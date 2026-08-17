const express = require('express');
const mongoose = require('mongoose');
const CollegeLead = require('../models/CollegeLead');
const College = require('../models/College');
const escapeRegex = require('../utils/escapeRegex');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Internal CRM data — never public. Every route is authenticated and admin/sales gated.
router.use(generalLimiter);
router.use(protect);
router.use(requireRole('admin', 'sales', 'counsellor'));

const STAGES = CollegeLead.STAGES;

/**
 * GET /api/college-leads
 * Powers the lead table. Filters, search, pagination, sorting.
 *   ?stage=New&category=Engineering&city=Chennai&contactStatus=pending
 *   ?owner=me|unassigned|<userId>&due=today|overdue&search=srm
 *   ?page=1&limit=50&sort=nextFollowUpAt
 */
router.get('/', async (req, res) => {
  try {
    const {
      stage, category, city, area, contactStatus, source, tag, owner, due,
      search, page = 1, limit = 50, sort = 'collegeName'
    } = req.query;

    const q = { isDuplicateOf: { $exists: false } };

    if (stage) q.stage = { $in: String(stage).split(',') };
    if (category) q.category = { $in: String(category).split(',') };
    if (contactStatus) q.contactStatus = contactStatus;
    if (source) q.source = source;
    if (tag) q.tags = tag;
    if (city) q['address.city'] = new RegExp(escapeRegex(city), 'i');
    if (area) q['address.area'] = new RegExp(escapeRegex(area), 'i');

    if (owner === 'me') q.ownerId = req.user._id;
    else if (owner === 'unassigned') q.ownerId = { $exists: false };
    else if (owner && mongoose.isValidObjectId(owner)) q.ownerId = owner;

    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
    if (due === 'today') q.nextFollowUpAt = { $lte: endOfToday };
    else if (due === 'overdue') q.nextFollowUpAt = { $lt: new Date(new Date().setHours(0, 0, 0, 0)) };

    if (search) {
      const re = new RegExp(escapeRegex(String(search).trim()), 'i');
      q.$or = [{ collegeName: re }, { shortName: re }, { 'address.area': re }, { leadCode: re }];
    }

    const perPage = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;

    const [data, total] = await Promise.all([
      CollegeLead.find(q)
        .select('-activities')
        .populate('ownerId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(perPage)
        .lean(),
      CollegeLead.countDocuments(q)
    ]);

    res.json({ success: true, count: data.length, total, page: Number(page), pages: Math.ceil(total / perPage), data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch college leads', message: err.message });
  }
});

/** GET /api/college-leads/stats — the KPI strip on top of the lead page. */
router.get('/stats', async (req, res) => {
  try {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

    const [byStage, byCategory, byContactStatus, dueToday, overdue, unassigned, total] = await Promise.all([
      CollegeLead.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      CollegeLead.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      CollegeLead.aggregate([{ $group: { _id: '$contactStatus', count: { $sum: 1 } } }]),
      CollegeLead.countDocuments({ nextFollowUpAt: { $gte: startOfToday, $lte: endOfToday } }),
      CollegeLead.countDocuments({ nextFollowUpAt: { $lt: startOfToday }, stage: { $nin: ['Won', 'Lost'] } }),
      CollegeLead.countDocuments({ ownerId: { $exists: false } }),
      CollegeLead.countDocuments({})
    ]);

    const toMap = (rows) => rows.reduce((acc, r) => ({ ...acc, [r._id || 'unknown']: r.count }), {});
    res.json({
      success: true,
      data: { total, dueToday, overdue, unassigned, byStage: toMap(byStage), byCategory: toMap(byCategory), byContactStatus: toMap(byContactStatus) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to compute stats', message: err.message });
  }
});

/** GET /api/college-leads/:id — full record incl. activity timeline (newest first). */
router.get('/:id', async (req, res) => {
  try {
    const lead = await CollegeLead.findById(req.params.id)
      .populate('ownerId', 'name email')
      .populate('convertedCollegeId', 'collegeName collegeCode')
      .lean();
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    lead.activities = (lead.activities || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch lead', message: err.message });
  }
});

/** POST /api/college-leads — create a lead manually. */
router.post('/', async (req, res) => {
  try {
    const existing = await CollegeLead.findOne({ collegeName: req.body.collegeName })
      .collation({ locale: 'en', strength: 2 });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A lead for this college already exists', data: { id: existing._id, leadCode: existing.leadCode } });
    }
    const lead = new CollegeLead({ ...req.body, createdBy: req.user._id });
    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Failed to create lead', message: err.message });
  }
});

/** PATCH /api/college-leads/:id — edit fields. Stage changes go through /stage instead. */
router.patch('/:id', async (req, res) => {
  try {
    const { stage, activities, leadCode, convertedCollegeId, ...safe } = req.body;
    const lead = await CollegeLead.findByIdAndUpdate(
      req.params.id,
      { $set: { ...safe, lastUpdatedBy: req.user._id } },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Failed to update lead', message: err.message });
  }
});

/** PATCH /api/college-leads/:id/stage — move through the pipeline. Lost requires a reason. */
router.patch('/:id/stage', async (req, res) => {
  try {
    const { stage, lostReason, lostNote } = req.body;
    if (!STAGES.includes(stage)) {
      return res.status(400).json({ success: false, error: `stage must be one of: ${STAGES.join(', ')}` });
    }
    if (stage === 'Lost' && !lostReason) {
      return res.status(400).json({ success: false, error: 'lostReason is required when moving a lead to Lost' });
    }

    const lead = await CollegeLead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const from = lead.stage;
    lead.stage = stage;
    lead.lostReason = stage === 'Lost' ? lostReason : '';
    lead.lostNote = stage === 'Lost' ? (lostNote || '') : '';
    lead.lastActivityAt = new Date();
    lead.lastUpdatedBy = req.user._id;
    lead.activities.push({
      type: 'StageChange',
      body: `${from} → ${stage}${stage === 'Lost' ? ` (${lostReason})` : ''}`,
      meta: { from, to: stage, lostReason },
      actorId: req.user._id
    });
    await lead.save();

    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Failed to change stage', message: err.message });
  }
});

/** POST /api/college-leads/:id/activities — log a call/email/meeting and optionally set the next follow-up. */
router.post('/:id/activities', async (req, res) => {
  try {
    const { type, direction, outcome, durationSec, body, nextFollowUpAt } = req.body;
    const lead = await CollegeLead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    lead.activities.push({ type, direction, outcome, durationSec, body, actorId: req.user._id });
    lead.lastActivityAt = new Date();
    if (['Call', 'Email', 'WhatsApp'].includes(type)) lead.attemptCount += 1;
    if (nextFollowUpAt) lead.nextFollowUpAt = new Date(nextFollowUpAt);
    // First real contact auto-advances New -> Contacted; later stages are moved manually.
    if (lead.stage === 'New' && outcome === 'Connected') lead.stage = 'Contacted';
    await lead.save();

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Failed to log activity', message: err.message });
  }
});

/** PATCH /api/college-leads/:id/verify-contact — mark phone/email confirmed against a real source. */
router.patch('/:id/verify-contact', async (req, res) => {
  try {
    const { phones, emails, contactSourceUrl, status = 'verified' } = req.body;
    if (!['verified', 'invalid', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'status must be verified, invalid or pending' });
    }
    const set = { contactStatus: status, contactVerifiedAt: new Date(), contactVerifiedBy: req.user._id };
    if (Array.isArray(phones)) set.phones = phones;
    if (Array.isArray(emails)) set.emails = emails;
    if (contactSourceUrl) set.contactSourceUrl = contactSourceUrl;

    const lead = await CollegeLead.findByIdAndUpdate(req.params.id, { $set: set }, { new: true });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Failed to verify contact', message: err.message });
  }
});

/** POST /api/college-leads/bulk — assign owner / set stage / add tags across a selection. */
router.post('/bulk', requireRole('admin', 'sales'), async (req, res) => {
  try {
    const { ids, action, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids[] is required' });
    }
    let update;
    if (action === 'assign') update = { $set: { ownerId: value }, $push: { ownerHistory: { userId: value } } };
    else if (action === 'stage') update = { $set: { stage: value } };
    else if (action === 'addTag') update = { $addToSet: { tags: value } };
    else if (action === 'removeTag') update = { $pull: { tags: value } };
    else return res.status(400).json({ success: false, error: 'action must be assign, stage, addTag or removeTag' });

    if (action === 'stage' && value === 'Lost') {
      return res.status(400).json({ success: false, error: 'Bulk-moving to Lost is blocked — each lead needs its own lostReason' });
    }

    const result = await CollegeLead.updateMany({ _id: { $in: ids } }, update);
    res.json({ success: true, modified: result.modifiedCount });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Bulk action failed', message: err.message });
  }
});

/**
 * POST /api/college-leads/:id/convert — promote a won lead into a real College.
 * Admin only: this creates an institution that students can then sign up under.
 */
router.post('/:id/convert', requireRole('admin'), async (req, res) => {
  try {
    const lead = await CollegeLead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    if (lead.convertedCollegeId) {
      return res.status(409).json({ success: false, error: 'Lead already converted', data: { collegeId: lead.convertedCollegeId } });
    }

    // College requires these and they are NOT knowable from a prospect record —
    // the caller must supply them from the signed contract.
    const { registrationNumber, accreditationStatus, email, contactNumber } = req.body;
    const missing = ['registrationNumber', 'accreditationStatus', 'email', 'contactNumber']
      .filter((f) => !req.body[f]);
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing required onboarding fields: ${missing.join(', ')}` });
    }

    const college = new College({
      collegeName: lead.collegeName,
      institutionType: lead.institutionType,
      governanceType: ['Private', 'Government', 'Autonomous', 'Deemed'].includes(lead.governanceType) ? lead.governanceType : '',
      affiliatedUniversity: lead.affiliatedUniversity,
      website: lead.website,
      email,
      contactNumber,
      registrationNumber,
      accreditationStatus,
      establishedYear: lead.establishedYear,
      address: {
        street: [lead.address?.street, lead.address?.area].filter(Boolean).join(', '),
        city: lead.address?.city,
        state: lead.address?.state,
        pincode: lead.address?.pincode,
        country: 'India'
      },
      status: 'Pending Approval', // never auto-Active — an admin approves before students see it
      createdBy: req.user._id,
      ...req.body.collegeOverrides
    });
    await college.save();

    lead.stage = 'Won';
    lead.convertedCollegeId = college._id;
    lead.convertedAt = new Date();
    lead.activities.push({ type: 'System', body: `Converted to College ${college.collegeCode}`, actorId: req.user._id });
    await lead.save();

    res.status(201).json({ success: true, data: { lead, college } });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Conversion failed', message: err.message });
  }
});

module.exports = router;
