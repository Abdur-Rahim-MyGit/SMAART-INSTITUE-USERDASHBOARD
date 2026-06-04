/**
 * Career Agent Routes
 * Ported from Career-Agent/backend/index.js
 * All routes are prefixed with /api/career-agent
 * Auth is provided by the main dashboard's protect middleware (JWT).
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { processCareerIntelligence } = require('../engine/careerEngine');
const { enhanceWithAI } = require('../services/careerAIService');
const {
  CareerAnalysisModel,
  CareerAgentDataModel,
  CareerRoleModel,
  RoleProfileModel,
  RoleSkillModel,
  CareerDirectionModel,
  FinalCareerPathwayModel
} = require('../models/careerAgentModels');

const Degree = require('../models/Degree');
// Auth middleware — optional auth (passes through without token, attaches user if token present)
const { optionalAuth } = require('../middleware/auth');

// Records directory for local caching of analyses
const RECORDS_DIR = path.join(__dirname, '..', 'records', 'careerAgent');
if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR, { recursive: true });

// ─── Profile hash helper ──────────────────────────────────────────────────────
function makeProfileHash(studentData) {
  const key = JSON.stringify({
    education: studentData.education,
    preferences: studentData.preferences,
    skills: (studentData.skills || []).map(s => s.name || s).sort()
  });
  return crypto.createHash('sha256').update(key).digest('hex');
}

function findCachedRecord(hash) {
  try {
    const files = fs.readdirSync(RECORDS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(RECORDS_DIR, file), 'utf8'));
      if (data.profile_hash === hash) return data;
    }
  } catch (e) { }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE INTELLIGENCE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/career-agent/career-role/:roleName
 * Dynamically fetches a role's career intelligence from MongoDB (careerroles collection).
 */
router.get('/career-role/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    const escapedRoleName = roleName
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/-/g, '[-–—]')
      .replace(/ /g, '\\s+');
    const role = await CareerRoleModel.findOne({
      role_name: { $regex: new RegExp(`^${escapedRoleName}$`, 'i') }
    }).lean();

    if (!role) {
      return res.status(404).json({ error: 'Role not found in Career Agent Database' });
    }
    res.json(role);
  } catch (error) {
    console.error('[career-agent] Error fetching role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/role-skills/:roleTitle
 * Fetches skills for a specific role from the roleskillslist collection.
 * Transforms flat rows → grouped { roleTitle, jobFamily, jobCode, skills[] } object.
 */
router.get('/role-skills/:roleTitle', async (req, res) => {
  try {
    const { roleTitle } = req.params;
    const db = req.app.locals.db || require('mongoose').connection.db;

    // Exact match first, then case-insensitive regex fallback
    let rows = await db.collection('roleskillslist')
      .find({ 'Job Role': new RegExp(`^${decodeURIComponent(roleTitle).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i') })
      .toArray();

    if (!rows.length) {
      return res.status(404).json({ error: 'Role skills not found for this role' });
    }

    // Aggregate flat rows into grouped skill object
    const first = rows[0];
    const grouped = {
      roleTitle: first['Job Role'],
      jobFamily: first['Job Family'],
      jobCode:   first['Role ID'] || '',
      skills: rows.map(r => ({
        skillCategory: r['Category'] || 'General',
        skillName:     r['Skill Name'],
        skillId:       r['Skill ID'] || '',
        importance:    r['Category'] === 'Domain' ? 'High' :
                       r['Category'] === 'Technical' ? 'High' :
                       r['Category'] === 'AI-Tool' ? 'Medium' : 'Medium',
        certificationName: r['Certification'] || null,
        platform:          r['Platform'] || null
      }))
    };

    res.json(grouped);
  } catch (error) {
    console.error('[career-agent] Error fetching role skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/role-skills/family/:jobFamily
 * Lists all distinct role names within a job family from roleskillslist.
 * NOTE: must be registered before /role-skills/:roleTitle
 */
router.get('/role-skills/family/:jobFamily', async (req, res) => {
  try {
    const { jobFamily } = req.params;
    const db = req.app.locals.db || require('mongoose').connection.db;

    // Build a keyword regex that matches the job family name broadly
    const rawFamily = decodeURIComponent(jobFamily);
    const keywords = rawFamily
      .replace(/[&*()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'analytics', 'engineering', 'development', 'the'].includes(w.toLowerCase()));

    const searchWord = keywords.length > 0 ? keywords[0] : rawFamily.split(' ')[0];
    const regex = new RegExp(searchWord.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'), 'i');

    const roles = await db.collection('roleskillslist')
      .distinct('Job Role', { 'Job Family': { $regex: regex } });

    const sorted = [...new Set(roles)].filter(Boolean).sort();
    res.json(sorted);
  } catch (error) {
    console.error('[career-agent] Error fetching roles in family:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/role-skills/roadmap/:jobFamily
 * Aggregates all skills within a job family from roleskillslist, sorted by overlap frequency.
 */
router.get('/role-skills/roadmap/:jobFamily', async (req, res) => {
  try {
    const { jobFamily } = req.params;
    const db = req.app.locals.db || require('mongoose').connection.db;

    const rawFamily = decodeURIComponent(jobFamily);
    const keywords = rawFamily
      .replace(/[&*()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'analytics', 'engineering', 'development', 'the'].includes(w.toLowerCase()));

    const searchWord = keywords.length > 0 ? keywords[0] : rawFamily.split(' ')[0];
    const regex = new RegExp(searchWord.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'), 'i');

    const allRows = await db.collection('roleskillslist')
      .find({ 'Job Family': { $regex: regex } })
      .toArray();

    if (!allRows.length) return res.json([]);

    // Count distinct roles in this family
    const distinctRoles = [...new Set(allRows.map(r => r['Job Role']))].filter(Boolean);
    const totalRoles = distinctRoles.length;

    // Build skill frequency map
    const skillMap = {};
    allRows.forEach(row => {
      const name = row['Skill Name'];
      if (!name) return;
      if (!skillMap[name]) {
        skillMap[name] = {
          skillName: name,
          occurrenceCount: 0,
          categories: new Set(),
          maxImportance: 'Medium'
        };
      }
      skillMap[name].occurrenceCount += 1;
      if (row['Category']) skillMap[name].categories.add(row['Category']);
      // Higher importance for domain / technical
      if (row['Category'] === 'Technical' || row['Category'] === 'Domain') {
        skillMap[name].maxImportance = 'High';
      }
    });

    const aggregated = Object.values(skillMap).map(s => ({
      skillName: s.skillName,
      occurrenceCount: s.occurrenceCount,
      categories: [...s.categories],
      maxImportance: s.maxImportance,
      overlapPercentage: Math.round((s.occurrenceCount / totalRoles) * 100)
    }));

    aggregated.sort((a, b) => b.overlapPercentage - a.overlapPercentage || b.occurrenceCount - a.occurrenceCount);
    res.json(aggregated);
  } catch (error) {
    console.error('[career-agent] Error generating aggregated roadmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/career-roles/names
 * Fetches a list of all role names for the onboarding selector.
 */
router.get('/career-roles/names', async (req, res) => {
  try {
    const roles = await CareerRoleModel.find({}, 'role_name').lean();
    const names = roles.map(r => r.role_name).sort();
    res.json(names);
  } catch (error) {
    console.error('[career-agent] Error fetching role names:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/direction-roles/:directionName
 * Returns the job roles for a career direction from careerdirections collection.
 * Searches by Career Direction name first, then by job role name as fallback.
 */
router.get('/direction-roles/:directionName', async (req, res) => {
  try {
    const { directionName } = req.params;
    const db = require('mongoose').connection.db;

    const cleanName = directionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Primary search: by Career Direction name
    let doc = await db.collection('careerdirections').findOne({
      'Career Direction': { $regex: cleanName, $options: 'i' }
    });

    // FIX: Secondary search — if the user stored a role name instead of a direction name,
    // find the direction that contains this role (search Job Role 1-10 fields)
    if (!doc) {
      const roleSearchConditions = [];
      for (let i = 1; i <= 10; i++) {
        roleSearchConditions.push({ [`Job Role ${i}`]: { $regex: cleanName, $options: 'i' } });
      }
      doc = await db.collection('careerdirections').findOne({ $or: roleSearchConditions });
    }

    if (!doc) return res.json({ directionName, roles: [], found: false });

    // Extract only non-null roles as stored in DB
    const roles = [];
    for (let i = 1; i <= 10; i++) {
      const role = doc[`Job Role ${i}`];
      const id   = doc[`Role ID ${i}`];
      if (role && typeof role === 'string' && role.trim()) {
        roles.push({ role: role.trim(), id: id || '' });
      }
    }

    res.json({
      directionName: doc['Career Direction'],
      directionId:   doc['Direction ID'],
      overview:      doc['Overview / Description'] || '',
      roles,
      found: true
    });
  } catch (err) {
    console.error('[career-agent] Error in /direction-roles:', err.message);
    res.status(500).json({ error: 'Failed to fetch direction roles', details: err.message });
  }
});





/**
 * GET /api/career-agent/role-profile/:roleTitle
 * Unified endpoint — fetches detailed role data for a specific role.
 * Priority 1: roles-profile-data collection (has "What This Role Actually Does" etc.)
 * Priority 2: careerroles collection (has narrative_para1/2/3)
 * Returns a normalized object with unified field names.
 */
router.get('/role-profile/:roleTitle', async (req, res) => {
  try {
    const { roleTitle } = req.params;
    const escTitle = roleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRegex = new RegExp(`^${escTitle}$`, 'i');

    // ── Priority 1: roles-profile-data collection ──────────────────────────────
    // Field names in this collection use special characters and newlines
    const db = require('mongoose').connection.db;
    const rawDoc = await db.collection('roles-profile-data').findOne({
      'Role Title': { $regex: titleRegex }
    });

    if (rawDoc) {
      // Helper: find a key by normalized prefix match
      const keys = Object.keys(rawDoc);
      const findKey = (search) => keys.find(k =>
        k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(search.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      const getVal = (search) => { const k = findKey(search); return k ? rawDoc[k] : ''; };

      // Extract salary fields (keys have literal \n)
      const salaryKey0 = keys.find(k => k.includes('Year 0'));
      const salaryKey2 = keys.find(k => k.includes('Year 2'));
      const salaryKey4 = keys.find(k => k.includes('Year 4'));
      const salaryKey6 = keys.find(k => k.includes('Year 6'));
      const englishKey = keys.find(k => k.includes('Requirement'));

      const pctStr = String(getVal('aiexposure') || '0').replace('%', '');
      const aiPct = parseFloat(pctStr) || 0;

      return res.json({
        source: 'roles-profile-data',
        roleTitle: rawDoc['Role Title'],
        jobFamily: rawDoc['Job Family'] || '',
        roleId: rawDoc['Role ID'] || '',
        aiExposurePct: aiPct,
        aiExposureLevel: rawDoc['AI Exposure Level'] || '',
        humanValueTasks: rawDoc['Human Value — What AI Cannot Do'] || '',
        salaryYear0_1: salaryKey0 ? rawDoc[salaryKey0] : '',
        salaryYear2_3: salaryKey2 ? rawDoc[salaryKey2] : '',
        salaryYear4_5: salaryKey4 ? rawDoc[salaryKey4] : '',
        salaryYear6plus: salaryKey6 ? rawDoc[salaryKey6] : '',
        englishRequirement: englishKey ? rawDoc[englishKey] : '',
        englishContext: rawDoc['English — Context'] || '',
        whatRoleDoes: rawDoc['What This Role Actually Does'] || '',
        howAiChanging: rawDoc['How AI Is Changing This Role'] || '',
        whoShouldConsider: rawDoc['Who Should Consider This Role'] || '',
        careerGrowthPath: rawDoc['Career Growth Path'] || rawDoc['Career Growth'] || ''
      });
    }

    // ── Priority 2: careerroles collection (narrative_para1/2/3) ──────────────
    const careerRoleDoc = await CareerRoleModel.findOne({
      $or: [
        { role_name: { $regex: titleRegex } },
        { 'Job Role': { $regex: titleRegex } }
      ]
    }).lean();

    if (careerRoleDoc) {
      const salaryLow = careerRoleDoc.salary_range_low
        ? `₹${Math.round(Number(careerRoleDoc.salary_range_low) / 100000)} L`
        : '';
      const salaryHigh = careerRoleDoc.salary_range_high
        ? `₹${Math.round(Number(careerRoleDoc.salary_range_high) / 100000)} L`
        : '';
      const salaryRange = salaryLow && salaryHigh ? `${salaryLow} – ${salaryHigh}` : salaryLow || salaryHigh || '';
      const salaryProg = careerRoleDoc.salary_progression || {};

      return res.json({
        source: 'careerroles',
        roleTitle: careerRoleDoc.role_name || careerRoleDoc['Job Role'],
        jobFamily: careerRoleDoc.job_family || careerRoleDoc['Job Family'] || '',
        roleId: careerRoleDoc['Role ID'] || '',
        aiExposurePct: parseFloat(String(careerRoleDoc.ai_exposure_pct || '0')) || 0,
        aiExposureLevel: careerRoleDoc.ai_exposure_level || '',
        humanValueTasks: careerRoleDoc.human_value_tasks || '',
        salaryYear0_1: salaryProg['year_0_1'] || salaryProg['Year 0–1'] || salaryRange,
        salaryYear2_3: salaryProg['year_2_3'] || salaryProg['Year 2–3'] || '',
        salaryYear4_5: salaryProg['year_4_5'] || salaryProg['Year 4–5'] || '',
        salaryYear6plus: salaryProg['year_6plus'] || salaryProg['Year 6+'] || '',
        englishRequirement: careerRoleDoc.english_requirement || '',
        englishContext: careerRoleDoc.english_explanation || careerRoleDoc.english_context || '',
        whatRoleDoes: careerRoleDoc.narrative_para1 || '',
        howAiChanging: careerRoleDoc.narrative_para2 || '',
        whoShouldConsider: careerRoleDoc.narrative_para3 || '',
        careerGrowthPath: careerRoleDoc.career_growth_path || careerRoleDoc.path_text || ''
      });
    }

    // ── Not found in either collection ────────────────────────────────────────
    return res.status(404).json({ error: `No role data found for "${roleTitle}"` });

  } catch (err) {
    console.error('[career-agent] Error in /role-profile/:roleTitle:', err.message);
    res.status(500).json({ error: 'Failed to fetch role profile', details: err.message });
  }
});

/**
 * GET /api/career-agent/role-profiles
 * Fetches all role profiles from the roles-profile-data collection.
 */
router.get('/role-profiles', async (req, res) => {
  try {
    const rawData = await RoleProfileModel.find({}).lean();
    const profiles = rawData.map(doc => {
      if (doc.roleId && doc.roleTitle) return doc;
      const keys = Object.keys(doc);
      const findK = (prefix) => keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(prefix.toLowerCase().replace(/[^a-z0-9]/g, '')));
      const getV = (prefix) => { const k = findK(prefix); return k ? doc[k] : ''; };
      const pctStr = getV('aiexposure%') || getV('Aiexposure');
      const aiPct = parseFloat(String(pctStr).replace('%', ''));
      return {
        _id: doc._id,
        jobFamily: getV('jobfamily'),
        roleId: getV('roleid'),
        roleTitle: getV('roletitle'),
        aiExposurePct: isNaN(aiPct) ? 0 : aiPct,
        aiExposureLevel: getV('aiexposurelevel'),
        humanValueTasks: getV('humanvalue'),
        salaryYear0_1: getV('salaryyear0'),
        salaryYear2_3: getV('salaryyear2'),
        salaryYear4_5: getV('salaryyear4'),
        salaryYear6plus: getV('salaryyear6'),
        englishRequirement: getV('englishreq'),
        englishContext: getV('englishcontext') || getV('english'),
        whatRoleDoes: getV('whatthisrole'),
        howAiChanging: getV('howaiis'),
        whoShouldConsider: getV('whoshould'),
        careerGrowthPath: getV('careergrowth')
      };
    }).filter(p => p.roleId);
    profiles.sort((a, b) => (a.jobFamily || '').localeCompare(b.jobFamily || ''));
    res.json(profiles);
  } catch (err) {
    console.error('[career-agent] Failed to fetch role profiles:', err.message);
    res.status(500).json({ error: 'Failed to fetch role profiles' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CAREER AGENT DIRECTION ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/career-agent/unique-id
 * Query: level, domain, degreeFullName, specialisation
 * Returns the Unique ID (e.g. UG-006-001) for a given degree combination.
 */
router.get('/unique-id', async (req, res) => {
  try {
    const { level, domain, degreeFullName, specialisation } = req.query;
    console.log(`[career-agent/unique-id] Request received for level: "${level}", domain: "${domain}", fullName: "${degreeFullName}", spec: "${specialisation}"`);
    
    if (!level || !domain || !degreeFullName) {
      return res.status(400).json({ error: 'level, domain, and degreeFullName are required' });
    }

    // Query the new Degree model
    const query = {
      level: level,
      domain: domain,
      fullName: degreeFullName
    };

    if (specialisation && specialisation.trim() !== '' && specialisation !== 'General') {
      query.specialization = specialisation;
    } else {
      // If specialisation is 'General' or empty, try finding 'General' or the first one available
      query.specialization = 'General';
    }

    let doc = await Degree.findOne(query);

    // Fallback: if no match with 'General', try without specialization filter to find ANY record for this degree
    if (!doc) {
      const fallbackQuery = { level, domain, fullName: degreeFullName };
      doc = await Degree.findOne(fallbackQuery);
    }

    if (!doc) {
      console.warn(`[career-agent/unique-id] No degree found for:`, { level, domain, degreeFullName, specialisation });
      return res.json({ uniqueId: null, found: false });
    }

    res.json({ uniqueId: doc.uniqueId, found: true });
  } catch (err) {
    console.error('[career-agent/unique-id] Error:', err.message);
    res.status(500).json({ error: 'Failed to lookup career directions', details: err.message });
  }
});

/**
 * GET /api/career-agent/directions/:uniqueId
 * Returns all Career Directions for a given Unique ID.
 */
router.get('/directions/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    console.log(`[career-agent/directions] Request received for uniqueId: "${uniqueId}"`);
    
    if (!uniqueId) {
      return res.status(400).json({ error: 'uniqueId is required' });
    }

    const docs = await CareerAgentDataModel.find({ 'Spec ID': uniqueId }).lean();

    if (!docs || docs.length === 0) {
      return res.json({ uniqueId, directions: [], found: false });
    }

    const directions = docs.map(doc => ({
      directionId: doc['Direction ID'],
      directionName: doc['Career Direction'],
      directionDescription: doc['Overview / Description'],
      directionOverview: doc['Overview / Description'], // Mapping both for compatibility
      type: doc['Type'] || 'Primary', // Default to Primary if type not in Excel
      uniqueId: doc['Spec ID'],
      roles: [
        { role: doc['Job Role 1'], id: doc['Role ID 1'] },
        { role: doc['Job Role 2'], id: doc['Role ID 2'] },
        { role: doc['Job Role 3'], id: doc['Role ID 3'] },
        { role: doc['Job Role 4'], id: doc['Role ID 4'] },
        { role: doc['Job Role 5'], id: doc['Role ID 5'] },
        { role: doc['Job Role 6'], id: doc['Role ID 6'] },
        { role: doc['Job Role 7'], id: doc['Role ID 7'] },
        { role: doc['Job Role 8'], id: doc['Role ID 8'] },
        { role: doc['Job Role 9'], id: doc['Role ID 9'] },
        { role: doc['Job Role 10'], id: doc['Role ID 10'] }
      ].filter(r => r.role && typeof r.role === 'string' && r.role.trim() !== '')
    }));

    const typeOrder = { 'Primary': 0, 'Secondary': 1, 'Alternative': 2, 'Alternate': 2 };
    directions.sort((a, b) => (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3));

    res.json({ uniqueId, directions, found: true, total: directions.length });
  } catch (err) {
    console.error('[career-agent/directions] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch career directions', details: err.message });
  }
});

/**
 * POST /api/career-agent/career-direction
 * Fetches the career direction mapping for a specific degree/specialisation and role.
 */
router.post('/career-direction', async (req, res) => {
  try {
    const { degree, specialisation, roleName } = req.body;
    const degreeDoc = await CareerDirectionModel.findOne({
      degree_name: { $regex: new RegExp(degree, 'i') }
    }).lean();

    if (!degreeDoc) {
      return res.status(404).json({ error: 'Degree mapping not found' });
    }

    const foundDirection = degreeDoc.directions.find(dir =>
      dir.roles.some(r => r.toLowerCase() === roleName.toLowerCase() || roleName.toLowerCase().includes(r.toLowerCase()))
    );

    if (!foundDirection) {
      return res.status(404).json({ error: 'No matching direction for this role' });
    }

    res.json({ degree_name: degreeDoc.degree_name, direction: foundDirection });
  } catch (error) {
    console.error('[career-agent] Error fetching career direction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// CAREER DIRECTION LOCKING SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/career-agent/direction-lock/status
 * Returns the user's current career direction lock status.
 * AUTO-EXPIRES: if lockExpiryDate has passed, automatically locks.
 */
router.get('/direction-lock/status', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const userId = req.user._id || req.user.id;
    const email  = req.user.email;

    let record = await FinalCareerPathwayModel.findOne({ userId }).lean();
    if (!record && email) {
      record = await FinalCareerPathwayModel.findOne({ student_email: email }).lean();
    }

    // No pathway yet — user hasn't completed first analysis
    if (!record) {
      return res.json({
        found: false,
        isLocked: false,
        firstVisitAt: null,
        lockExpiryDate: null,
        attemptsUsed: 0,
        maxAttempts: 5,
        remainingAttempts: 5,
        remainingDays: 14,
        lockReason: null,
        primaryCareerPath: null,
        secondaryCareerPath: null,
        tertiaryCareerPath: null,
        firstVisitModalShown: false,
        finalLockedDate: null,
      });
    }

    // ── Auto-expiry check ────────────────────────────────────────────────────
    // If the 14-day window has closed and the record isn't locked yet → lock it now
    if (!record.is_locked && record.lockExpiryDate && new Date(record.lockExpiryDate) < new Date()) {
      const updated = await FinalCareerPathwayModel.findOneAndUpdate(
        { _id: record._id, is_locked: { $ne: true } }, // prevent double-lock race
        {
          $set: {
            is_locked: true,
            locked_at: new Date(),
            finalLockedDate: new Date(),
            lockReason: 'time_expired',
            primaryCareerPath:   record.primaryCareerPath   || record.primary_role,
            secondaryCareerPath: record.secondaryCareerPath || record.secondary_role,
            tertiaryCareerPath:  record.tertiaryCareerPath  || record.tertiary_role,
            updated_at: new Date(),
          }
        },
        { new: true }
      ).lean();
      if (updated) record = updated;
    }

    const now = new Date();
    const expiry = record.lockExpiryDate ? new Date(record.lockExpiryDate) : null;
    const remainingMs = expiry ? Math.max(0, expiry - now) : 0;
    const remainingDays = expiry ? Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24))) : 0;
    const used = record.attemptsUsed || 0;
    const max  = record.maxAttempts  || 5;

    return res.json({
      found: true,
      isLocked: !!record.is_locked,
      firstVisitAt: record.firstVisitAt || null,
      lockExpiryDate: record.lockExpiryDate || null,
      attemptsUsed: used,
      maxAttempts: max,
      remainingAttempts: Math.max(0, max - used),
      remainingDays,
      lockReason: record.lockReason || null,
      primaryCareerPath: record.primaryCareerPath || record.primary_role || null,
      secondaryCareerPath: record.secondaryCareerPath || record.secondary_role || null,
      tertiaryCareerPath: record.tertiaryCareerPath || record.tertiary_role || null,
      firstVisitModalShown: !!record.firstVisitModalShown,
      finalLockedDate: record.finalLockedDate || null,
    });
  } catch (err) {
    console.error('[career-agent] direction-lock/status error:', err);
    res.status(500).json({ error: 'Failed to fetch lock status', details: err.message });
  }
});

/**
 * PUT /api/career-agent/direction-lock/mark-modal-shown
 * Call once from the frontend after showing the first-visit modal.
 * Sets firstVisitModalShown = true so it never shows again.
 */
router.put('/direction-lock/mark-modal-shown', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const userId = req.user._id || req.user.id;

    await FinalCareerPathwayModel.findOneAndUpdate(
      { userId },
      { $set: { firstVisitModalShown: true, updated_at: new Date() } }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[career-agent] mark-modal-shown error:', err);
    res.status(500).json({ error: 'Failed to update modal flag', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/career-agent/onboarding
 * Main career intelligence processing endpoint.
 * Uses the same engine from Career-Agent/backend/engine.js.
 *
 * LOCK SYSTEM ENFORCEMENT:
 *  1. Checks if pathway is already locked → 423
 *  2. Checks if 14-day window expired   → auto-locks → 423
 *  3. Checks if attempts exhausted      → 423
 *  4. On success: increments attemptsUsed, sets firstVisitAt/lockExpiryDate on first save,
 *     auto-locks if this save consumed the last attempt.
 */
router.post('/onboarding', optionalAuth, async (req, res) => {
  try {
    const studentData = req.body;

    // Inject user identity from JWT if authenticated
    const loggedInUser = req.user || null;
    if (loggedInUser && !studentData.personalDetails?.email) {
      studentData.personalDetails = studentData.personalDetails || {};
      studentData.personalDetails.email = loggedInUser.email;
      studentData.personalDetails.name = studentData.personalDetails.name || loggedInUser.name;
    }

    // ── LOCK ENFORCEMENT (server-side, cannot be bypassed) ───────────────────
    if (loggedInUser) {
      const userId = loggedInUser._id || loggedInUser.id;
      const existingPathway = await FinalCareerPathwayModel.findOne({ userId }).lean();

      if (existingPathway) {
        // 1. Already manually or permanently locked
        if (existingPathway.is_locked) {
          return res.status(423).json({
            error: 'Career direction is permanently locked. No further modifications are allowed.',
            locked: true,
            lockReason: existingPathway.lockReason || 'manual',
            primaryCareerPath: existingPathway.primaryCareerPath || existingPathway.primary_role,
            secondaryCareerPath: existingPathway.secondaryCareerPath || existingPathway.secondary_role,
            tertiaryCareerPath: existingPathway.tertiaryCareerPath || existingPathway.tertiary_role,
          });
        }

        // 2. Time-based expiry — auto-lock and reject
        if (existingPathway.lockExpiryDate && new Date(existingPathway.lockExpiryDate) < new Date()) {
          await FinalCareerPathwayModel.findOneAndUpdate(
            { userId },
            {
              $set: {
                is_locked: true,
                locked_at: new Date(),
                finalLockedDate: new Date(),
                lockReason: 'time_expired',
                primaryCareerPath:   existingPathway.primaryCareerPath   || existingPathway.primary_role,
                secondaryCareerPath: existingPathway.secondaryCareerPath || existingPathway.secondary_role,
                tertiaryCareerPath:  existingPathway.tertiaryCareerPath  || existingPathway.tertiary_role,
                updated_at: new Date(),
              }
            }
          );
          return res.status(423).json({
            error: 'Your 14-day career direction window has expired. Your career direction is now permanently locked.',
            locked: true,
            lockReason: 'time_expired',
          });
        }

        // 3. Attempts exhausted
        const used = existingPathway.attemptsUsed || 0;
        const max  = existingPathway.maxAttempts  || 5;
        if (used >= max) {
          return res.status(423).json({
            error: `You have used all ${max} career analysis attempts. Your direction is now locked.`,
            locked: true,
            lockReason: 'attempts_exhausted',
            attemptsUsed: used,
            maxAttempts: max,
          });
        }
      }
    }

    // Normalize skills upfront (objects vs strings)
    if (Array.isArray(studentData.skills)) {
      studentData.skills = studentData.skills.map(s => (typeof s === 'string' ? s : s.name || '')).filter(Boolean);
    } else {
      studentData.skills = [];
    }

    const profileHash = makeProfileHash(studentData);

    // Cache check — return cached result if profile hasn't changed
    const cached = findCachedRecord(profileHash);
    if (cached) {
      const cachedAnalysis = cached.output_generated_report || cached.analysis || cached;
      return res.json({ success: true, cached: true, analysis: cachedAnalysis, id: cached.id || profileHash });
    }

    const traceId = Date.now();
    const recordFilename = `analysis_${traceId}_${(studentData.personalDetails?.name || 'unknown').replace(/\s+/g, '_')}.json`;
    const recordPath = path.join(RECORDS_DIR, recordFilename);

    // Save initial draft
    const initialRecord = {
      id: String(traceId),
      timestamp: new Date().toISOString(),
      status: 'pending_analysis',
      profile_hash: profileHash,
      input_user_data: studentData,
      output_generated_report: null
    };
    try {
      fs.writeFileSync(recordPath, JSON.stringify(initialRecord, null, 2));
    } catch (fsErr) {
      console.error('[career-agent] Failed to save draft:', fsErr.message);
    }

    // Run the engine
    let analysis;
    try {
      analysis = await processCareerIntelligence(studentData);
      analysis = await enhanceWithAI(studentData, analysis);

      const finalRecord = { ...initialRecord, status: 'completed', output_generated_report: analysis };
      fs.writeFileSync(recordPath, JSON.stringify(finalRecord, null, 2));
    } catch (procErr) {
      console.error(`[career-agent] Engine failed:`, procErr.message);
      const errorRecord = { ...initialRecord, status: 'failed', error: procErr.message };
      try { fs.writeFileSync(recordPath, JSON.stringify(errorRecord, null, 2)); } catch (e) { }
      throw procErr;
    }

    // Common variables used for both FinalCareerPathway and CareerAnalysis saves
    const studentName    = studentData.personalDetails?.name  || 'Unknown';
    const studentEmail   = studentData.personalDetails?.email || loggedInUser?.email || 'Unknown';
    const primaryRole    = studentData.preferences?.primary?.role || 'Career Match';
    const preVerifiedData = analysis.preVerified || {};
    const primaryPath   = studentData.preferences?.primary?.careerDirectionName   || studentData.preferences?.primary?.role    || '';
    const secondaryPath = studentData.preferences?.secondary?.careerDirectionName || studentData.preferences?.secondary?.role  || '';
    const tertiaryPath  = studentData.preferences?.tertiary?.careerDirectionName  || studentData.preferences?.tertiary?.role   || '';

    // ── Save / Update FinalCareerPathway + lock tracking ────────────────────
    if (loggedInUser) {
      const userId = loggedInUser._id || loggedInUser.id;
      const preV = analysis.preVerified || {};
      const now  = new Date();

      // Fetch current record to calculate new attempt count
      const currentRecord = await FinalCareerPathwayModel.findOne({ userId }).lean();
      const prevAttempts  = currentRecord?.attemptsUsed || 0;
      const newAttempts   = prevAttempts + 1;
      const maxAttempts   = currentRecord?.maxAttempts || 5;
      const isFirstSave   = !currentRecord?.firstVisitAt;

      // Build the lock update fields
      const lockFields = {
        attemptsUsed: newAttempts,
        primaryCareerPath:   primaryPath,
        secondaryCareerPath: secondaryPath,
        tertiaryCareerPath:  tertiaryPath,
      };

      // Set firstVisitAt and lockExpiryDate only on FIRST successful save
      if (isFirstSave) {
        lockFields.firstVisitAt   = now;
        lockFields.lockExpiryDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      }

      // Auto-lock if this save consumes the last available attempt
      if (newAttempts >= maxAttempts) {
        lockFields.is_locked       = true;
        lockFields.locked_at       = now;
        lockFields.finalLockedDate = now;
        lockFields.lockReason      = 'attempts_exhausted';
        console.log(`[career-agent] Auto-locking career direction for user ${userId} — all ${maxAttempts} attempts used.`);
      }

      FinalCareerPathwayModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            userId,
            student_name:   studentName,
            student_email:  studentEmail,
            input_data:     studentData,
            output_data:    analysis,
            primary_role:   primaryRole,
            secondary_role: studentData.preferences?.secondary?.role || '',
            tertiary_role:  studentData.preferences?.tertiary?.role  || '',
            zone_primary:   preV?.primaryZone?.employer_zone   || 'Unknown',
            zone_secondary: preV?.secondaryZone?.employer_zone || 'Unknown',
            zone_tertiary:  preV?.tertiaryZone?.employer_zone  || 'Unknown',
            updated_at:     now,
            ...lockFields,
          },
          $setOnInsert: { created_at: now }
        },
        { upsert: true, new: true }
      ).catch(err => console.warn('[career-agent] FinalCareerPathway upsert warning:', err.message));
    }

    // Also save to CareerAnalysis for history
    CareerAnalysisModel.create({
      userId: loggedInUser?._id || loggedInUser?.id || null,
      student_name: studentName,
      student_email: studentEmail,
      primary_role: primaryRole,
      input_data: studentData,
      output_data: analysis,
      profile_hash: profileHash,
      zone_primary: preVerifiedData?.primaryZone?.employer_zone || 'Unknown',
      zone_secondary: preVerifiedData?.secondaryZone?.employer_zone || 'Unknown',
      zone_tertiary: preVerifiedData?.tertiaryZone?.employer_zone || 'Unknown',
      missing_skills: preVerifiedData?.primarySkillGap?.missing || [],
      matched_skills: preVerifiedData?.primarySkillGap?.matched || [],
      skill_coverage_pct: preVerifiedData?.primarySkillGap?.coveragePct || 0
    }).catch(err => console.warn('[career-agent] MongoDB save warning:', err.message));

    res.json({
      status: 'success',
      id: String(traceId),
      recommendations: {
        primary: primaryRole,
        secondary: studentData.preferences?.secondary?.role || 'Secondary Path',
        tertiary: studentData.preferences?.tertiary?.role || 'Alternative Option'
      },
      analysis
    });
  } catch (err) {
    console.error('[career-agent] Onboarding error:', err);
    res.status(500).json({ error: 'Career analysis failed', details: err.message });
  }
});



/**
 * GET /api/career-agent/final-pathway
 * Returns the current user's finalcareerpathway record.
 * Used by the onboarding edit mode to pre-fill all form fields.
 */
router.get('/final-pathway', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userId = req.user._id || req.user.id;
    const email  = req.user.email;

    let record = await FinalCareerPathwayModel.findOne({ userId }).lean();
    if (!record && email) {
      record = await FinalCareerPathwayModel.findOne({ student_email: email }).lean();
    }

    if (!record) {
      return res.status(404).json({ found: false, message: 'No pathway saved for this user yet.' });
    }

    return res.json({
      found: true,
      id: String(record._id),
      primary_role:   record.primary_role,
      secondary_role: record.secondary_role,
      tertiary_role:  record.tertiary_role,
      is_locked:      record.is_locked,
      input_data:     record.input_data,    // ← full form data for pre-fill
      output_data:    record.output_data,
      updated_at:     record.updated_at
    });
  } catch (err) {
    console.error('[career-agent] final-pathway GET error:', err);
    res.status(500).json({ error: 'Failed to fetch final pathway', details: err.message });
  }
});

/**
 * PUT /api/career-agent/final-pathway/lock
 * Marks the user's pathway as locked (after they confirm "Interested" in the UI).
 */
router.put('/final-pathway/lock', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userId = req.user._id || req.user.id;
    const record = await FinalCareerPathwayModel.findOneAndUpdate(
      { userId },
      { $set: { is_locked: true, locked_at: new Date(), updated_at: new Date() } },
      { new: true }
    );
    if (!record) {
      return res.status(404).json({ error: 'No pathway found to lock.' });
    }
    return res.json({ success: true, is_locked: record.is_locked, locked_at: record.locked_at });
  } catch (err) {
    console.error('[career-agent] final-pathway lock error:', err);
    res.status(500).json({ error: 'Failed to lock pathway', details: err.message });
  }
});


router.get('/my-analysis', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to fetch your analysis.' });
    }
    const userId = req.user._id || req.user.id;
    const email  = req.user.email;

    // Try by userId first, fall back to email
    let record = await CareerAnalysisModel.findOne({ userId })
      .sort({ created_at: -1 })
      .lean();

    if (!record && email) {
      record = await CareerAnalysisModel.findOne({ student_email: email })
        .sort({ created_at: -1 })
        .lean();
    }

    if (!record) {
      return res.status(404).json({ found: false, message: 'No analysis found for this user.' });
    }

    return res.json({
      found: true,
      id: String(record._id),
      created_at: record.created_at,
      primary_role: record.primary_role,
      analysis: record.output_data,
      input_data: record.input_data
    });
  } catch (err) {
    console.error('[career-agent] my-analysis error:', err);
    res.status(500).json({ error: 'Failed to fetch analysis', details: err.message });
  }
});

/**
 * GET /api/career-agent/my-analysis/all
 * Returns all analyses for the logged-in user (for history/new analysis).
 */
router.get('/my-analysis/all', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const userId = req.user._id || req.user.id;
    const email  = req.user.email;

    const records = await CareerAnalysisModel.find(
      userId ? { $or: [{ userId }, { student_email: email }] } : { student_email: email }
    ).sort({ created_at: -1 }).select('_id created_at primary_role').lean();

    res.json({ found: records.length > 0, count: records.length, analyses: records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

/**
 * POST /api/career-agent/student/profile
 * Pre-save personal details during onboarding step 1.
 */
router.post('/student/profile', async (req, res) => {
  try {
    const { personalDetails } = req.body;
    // Just acknowledge — the main user profile is managed by the main backend
    res.json({ success: true, message: 'Profile acknowledged' });
  } catch (err) {
    res.status(500).json({ error: 'Profile save failed' });
  }
});

/**
 * GET /api/career-agent/dashboard/:id
 * Retrieve a specific analysis record by trace ID.
 */
router.get('/dashboard/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const files = fs.readdirSync(RECORDS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(RECORDS_DIR, file), 'utf8'));
      if (data.id === id || file.includes(id)) {
        return res.json({ success: true, source: 'local', data });
      }
    }

    // Fallback to MongoDB
    const mongoResult = await CareerAnalysisModel.findOne({ profile_hash: id }).lean();
    if (mongoResult) {
      return res.json({ success: true, source: 'mongodb', data: mongoResult });
    }

    return res.status(404).json({ success: false, message: 'Analysis not found' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/career-agent/feedback
 * Save user feedback on analysis quality.
 */
router.post('/feedback', async (req, res) => {
  try {
    const { analysisId, rating, comment } = req.body;
    if (!analysisId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'analysisId and rating (1-5) required' });
    }
    const feedbackFile = path.join(RECORDS_DIR, 'feedback.json');
    let feedbacks = [];
    if (fs.existsSync(feedbackFile)) {
      try { feedbacks = JSON.parse(fs.readFileSync(feedbackFile, 'utf8')); } catch (e) { }
    }
    feedbacks.push({ analysisId, rating, comment: comment || '', timestamp: new Date().toISOString() });
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
    res.json({ success: true, message: 'Feedback saved' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/career-agent/health
 */
router.get('/health', (req, res) => {
  res.json({ status: 'Career Agent routes active', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// SKILL PROGRESS ROUTES (Career Roadmap tracking)
// ─────────────────────────────────────────────────────────────────────────────

const { SkillProgressModel } = require('../models/careerAgentModels');

/**
 * GET /api/career-agent/user-skills/:email
 * Returns all skill progress entries for a user.
 */
router.get('/user-skills/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const progress = await SkillProgressModel.find({ email: decodeURIComponent(email) }).lean();
    res.json(progress);
  } catch (error) {
    console.error('[career-agent] Error fetching user skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/career-agent/user-skills/progress
 * Upserts a skill progress record for a user.
 * Body: { email, skillName, status }
 */
router.post('/user-skills/progress', async (req, res) => {
  try {
    const { email, skillName, status } = req.body;
    if (!email || !skillName || !status) {
      return res.status(400).json({ error: 'email, skillName, and status are required' });
    }
    const valid = ['Not Started', 'In Progress', 'Completed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    }
    const result = await SkillProgressModel.findOneAndUpdate(
      { email, skillName },
      { email, skillName, status, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (error) {
    console.error('[career-agent] Error updating skill progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS ENDPOINT (career-agent-certifaction collection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a real URL from the certification name and issuing body.
 * All documents have the same placeholder official_url so we derive the real
 * one from the cert name / issuing body text.
 */
function deriveUrl(certName, issuingBody) {
  const c = (certName  || '').toLowerCase();
  const p = (issuingBody || '').toLowerCase();

  // GitHub
  if (p.includes('github') || c.includes('github'))          return 'https://learn.microsoft.com/en-us/certifications/github/';
  // Google
  if (p.includes('google') && c.includes('it automation'))   return 'https://www.coursera.org/professional-certificates/google-it-automation';
  if (p.includes('google') && c.includes('data analytics'))  return 'https://www.coursera.org/professional-certificates/google-data-analytics';
  if (p.includes('google') && c.includes('project'))         return 'https://www.coursera.org/professional-certificates/google-project-management';
  if (p.includes('google') && c.includes('ux'))              return 'https://www.coursera.org/professional-certificates/google-ux-design';
  if (p.includes('google') && c.includes('cybersecurity'))   return 'https://www.coursera.org/professional-certificates/google-cybersecurity';
  if (p.includes('google cloud') || c.includes('google cloud')) return 'https://cloud.google.com/learn/certification';
  if (p.includes('google') && c.includes('technical writing')) return 'https://developers.google.com/tech-writing';
  if (p.includes('google'))                                  return 'https://grow.google/certificates/';
  // AWS
  if (p.includes('aws') || c.includes('aws'))                return 'https://aws.amazon.com/certification/';
  // Microsoft / Azure
  if (p.includes('microsoft') && c.includes('azure'))        return 'https://learn.microsoft.com/en-us/certifications/browse/?products=azure';
  if (p.includes('microsoft') && c.includes('teams'))        return 'https://learn.microsoft.com/en-us/training/modules/m365-teams-collab/';
  if (p.includes('microsoft'))                               return 'https://learn.microsoft.com/en-us/certifications/';
  // DeepLearning.AI
  if (p.includes('deeplearning') || c.includes('deeplearning')) return 'https://www.deeplearning.ai/courses/';
  // Hugging Face
  if (p.includes('hugging face') || c.includes('hugging face')) return 'https://huggingface.co/learn';
  // Docker / Mirantis
  if (p.includes('docker') || p.includes('mirantis') || c.includes('docker')) return 'https://training.mirantis.com/dca-certification-exam/';
  // Kubernetes / CKA / CKAD
  if (c.includes('cka') || c.includes('ckad') || c.includes('kubernetes') || p.includes('linux foundation')) return 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/';
  // Oracle
  if (p.includes('oracle') || c.includes('oracle'))          return 'https://education.oracle.com/certification';
  // IBM
  if (p.includes('ibm') || c.includes('ibm'))                return 'https://www.ibm.com/training/certifications';
  // Atlassian / Jira
  if (p.includes('atlassian') || c.includes('atlassian') || c.includes('jira')) return 'https://university.atlassian.com/';
  if (c.includes('agile') && c.includes('coursera'))         return 'https://www.coursera.org/learn/agile-atlassian-jira';
  // Coursera general
  if (p.includes('coursera') || c.includes('coursera'))      return 'https://www.coursera.org/';
  // Udemy
  if (p.includes('udemy') || c.includes('udemy'))            return 'https://www.udemy.com/';
  // PMI / PMP
  if (p.includes('pmi') || c.includes('pmp') || c.includes('pmi')) return 'https://www.pmi.org/certifications';
  // Scrum Alliance / PSM
  if (p.includes('scrum') || c.includes('scrum') || c.includes('psm')) return 'https://www.scrumalliance.org/get-certified';
  // Axelos / ITIL / Prince2
  if (p.includes('axelos') || c.includes('itil') || c.includes('prince2')) return 'https://www.axelos.com/certifications';
  // CompTIA
  if (p.includes('comptia') || c.includes('comptia'))        return 'https://www.comptia.org/certifications';
  // Cisco
  if (p.includes('cisco') || c.includes('cisco') || c.includes('ccna')) return 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications.html';
  // MeitY / India Govt
  if (p.includes('meity') || c.includes('dpdp') || c.includes('meity')) return 'https://meity.gov.in/';
  // NITI Aayog
  if (c.includes('niti aayog') || p.includes('niti'))        return 'https://www.niti.gov.in/';
  // LinkedIn Learning
  if (p.includes('linkedin') || c.includes('linkedin'))      return 'https://www.linkedin.com/learning/';
  // Salesforce
  if (p.includes('salesforce') || c.includes('salesforce'))  return 'https://trailhead.salesforce.com/credentials/overview';
  // Tableau
  if (p.includes('tableau') || c.includes('tableau'))        return 'https://www.tableau.com/learn/certification';
  // Meta / Facebook
  if (p.includes('meta') || c.includes('meta') || c.includes('facebook')) return 'https://www.coursera.org/professional-certificates/meta-front-end-developer';
  // Anthropic / Claude
  if (p.includes('anthropic') || c.includes('anthropic') || c.includes('claude')) return 'https://www.anthropic.com/api';
  // Codeium / Windsurf
  if (p.includes('codeium') || c.includes('codeium') || c.includes('windsurf')) return 'https://codeium.com/';
  // Perplexity AI
  if (p.includes('perplexity') || c.includes('perplexity')) return 'https://www.perplexity.ai/';
  // freeCodeCamp
  if (p.includes('freecodecamp') || c.includes('freecodecamp')) return 'https://www.freecodecamp.org/learn';
  // Scrum.org
  if (p.includes('scrum.org') || c.includes('scrum.org'))    return 'https://www.scrum.org/professional-scrum-certifications';
  // Educative
  if (p.includes('educative') || c.includes('educative'))    return 'https://www.educative.io/';
  // Pluralsight
  if (p.includes('pluralsight') || c.includes('pluralsight')) return 'https://www.pluralsight.com/';
  // edX
  if (p.includes('edx') || c.includes('edx'))               return 'https://www.edx.org/';
  // Default: Google search so user can still find the cert
  return `https://www.google.com/search?q=${encodeURIComponent(certName)}`;
}

/**
 * GET /api/career-agent/certifications/:roleTitle
 *
 * Fetches certifications for a SPECIFIC job role (e.g. "Computer Vision Engineer").
 * Uses exact Skill ID match: roleskillslist → career-agent-certifaction.
 *
 * Strategy:
 *  1. Exact match on roleskillslist 'Job Role' column
 *  2. Get all Skill IDs for that role (T-xxxxx, A-xxxxx, D-xxxxx)
 *  3. Fetch ALL matching certs from career-agent-certifaction using skill_id field
 *  4. Group by category: Technical | AI-Tool | Domain
 *  5. Generate real URLs (DB has same placeholder for all records)
 */
router.get('/certifications/:roleTitle', async (req, res) => {
  try {
    const roleTitle = decodeURIComponent(req.params.roleTitle).trim();
    const db = require('mongoose').connection.db;

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // ── Step 1: Get skills for this EXACT role from roleskillslist ────────────
    const roleSkillRows = await db.collection('roleskillslist')
      .find({ 'Job Role': { $regex: new RegExp(`^${escapeRegex(roleTitle)}$`, 'i') } })
      .toArray();

    if (!roleSkillRows.length) {
      return res.json({ roleTitle, found: false, technical: [], ai: [], domain: [], totalSkillsMatched: 0 });
    }

    // ── Step 2: Collect unique Skill IDs ──────────────────────────────────────
    const skillIds = [...new Set(roleSkillRows.map(r => r['Skill ID']).filter(Boolean))];

    // ── Step 3: Fetch ALL certs matching these Skill IDs ─────────────────────
    // NOTE: DB field is "skill_id" (snake_case) — matches roleskillslist "Skill ID"
    const certs = await db.collection('career-agent-certifaction')
      .find({ skill_id: { $in: skillIds } })
      .toArray();

    // ── Step 4: Map to clean output ───────────────────────────────────────────
    // Use official_url directly from DB. If DB still has the known placeholder
    // (all records were imported with the same Coursera URL), use deriveUrl as fallback.
    const PLACEHOLDER = 'https://www.coursera.org/professional-certificates/google-it-automation';
    const mapCert = (c) => {
      const dbUrl = c.official_url || c.officialUrl || '';
      const url = dbUrl && dbUrl !== PLACEHOLDER
        ? dbUrl
        : deriveUrl(c.suggested_certificates, c.issuing_body);
      return {
        id:        String(c._id),
        skillId:   c.skill_id   || '',
        skillName: c.skill_name || '',
        name:      c.suggested_certificates || '',
        provider:  c.issuing_body || '',
        url,
        fee:       c.fee || 'Check Website',
        category:  c.category || 'Technical',
      };
    };


    const technical = certs.filter(c => c.category === 'Technical').map(mapCert);
    const ai        = certs.filter(c => c.category === 'AI-Tool').map(mapCert);
    const domain    = certs.filter(c => c.category === 'Domain').map(mapCert);

    return res.json({
      roleTitle,
      found:              certs.length > 0,
      totalSkillsMatched: skillIds.length,
      technical,
      ai,
      domain,
    });
  } catch (err) {
    console.error('[career-agent] Error in /certifications/:roleTitle:', err.message);
    res.status(500).json({ error: 'Failed to fetch certifications', details: err.message });
  }
});

module.exports = router;

