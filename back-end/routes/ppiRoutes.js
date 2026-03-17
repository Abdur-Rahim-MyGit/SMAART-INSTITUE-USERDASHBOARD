const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Registration = require('../models/Registration');
const EngagementProfile = require('../models/EngagementProfile');
const { computeCommunityEngagementScore } = require('../helpers/communityEngagementScore');

const roleGuard = requireRole('admin', 'moderator', 'coach', 'superadmin', 'staff');

// GET /api/ppi/all - list all profiles sorted by communityScore (register before param route)
router.get('/all', protect, roleGuard, async (req, res) => {
  try {
    console.log('[PPI ALL] user:', req.user?.role, req.user?.id);
    const profiles = await EngagementProfile.find().sort({ communityScore: -1 }).lean();

    const studentIds = profiles.map((p) => p.studentId);

    const [users, students, teachers, registrations] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select('fullName email'),
      Student.find({ _id: { $in: studentIds } }).select('fullName email'),
      Teacher.find({ _id: { $in: studentIds } }).select('fullName email'),
      Registration.find({ _id: { $in: studentIds } }).select('fullName email'),
    ]);

    const nameMap = {};
    [...users, ...students, ...teachers, ...registrations].forEach((u) => {
      nameMap[u._id.toString()] = u.fullName || u.email;
    });

    const enriched = profiles.map((p) => ({
      ...p,
      studentName: nameMap[p.studentId?.toString()] || 'Unknown',
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[PPI] Error listing profiles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ppi/recalculate - recompute for all students
router.post('/recalculate', protect, roleGuard, async (req, res) => {
  try {
    const students = await Student.find({}).select('_id');
    const results = [];

    for (const student of students) {
      const score = await computeCommunityEngagementScore(student._id);
      const profile = await EngagementProfile.findOneAndUpdate(
        { studentId: student._id },
        { ...score, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      results.push({ studentId: student._id, communityScore: profile.communityScore });
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (err) {
    console.error('[PPI] Error recalculating profiles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ppi/:studentId - calculate and persist PPI for one student (place after specific routes)
router.get('/:studentId', protect, roleGuard, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, error: 'Invalid student ID' });
    }

    const objectId = new mongoose.Types.ObjectId(studentId);

    const score = await computeCommunityEngagementScore(objectId);

    const profile = await EngagementProfile.findOneAndUpdate(
      { studentId: objectId },
      { ...score, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('[PPI] Error computing score:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
