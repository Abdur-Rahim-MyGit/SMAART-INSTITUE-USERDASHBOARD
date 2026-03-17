const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const MentorshipLog = require('../models/MentorshipLog');

const clamp01 = (value) => Math.max(0, Math.min(1, value || 0));

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (err) {
    return null;
  }
};

// Calculates a 0-1 community engagement score for a student
async function computeCommunityEngagementScore(studentId) {
  const studentObjectId = toObjectId(studentId);
  if (!studentObjectId) {
    return {
      qualityScore: 0,
      participationRate: 0,
      mentorshipFrequency: 0,
      communityScore: 0,
    };
  }

  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Average post quality
  const qualityAgg = await CommunityPost.aggregate([
    { $match: { author: studentObjectId } },
    { $group: { _id: null, avgQuality: { $avg: { $ifNull: ['$qualityScore', 0] } } } },
  ]);
  const qualityScore = clamp01(qualityAgg?.[0]?.avgQuality || 0);

  // Participation: posts + replies in last 30 days, normalized by days in window
  const postsLast30 = await CommunityPost.countDocuments({
    author: studentObjectId,
    createdAt: { $gte: since },
  });

  const repliesAgg = await CommunityPost.aggregate([
    { $match: { 'replies.author': studentObjectId } },
    { $unwind: '$replies' },
    {
      $match: {
        'replies.author': studentObjectId,
        $or: [
          { 'replies.createdAt': { $gte: since } },
          { 'replies.createdAt': { $exists: false } }, // legacy replies without timestamps
        ],
      },
    },
    { $count: 'count' },
  ]);
  const repliesLast30 = repliesAgg?.[0]?.count || 0;

  const participationRaw = (postsLast30 + repliesLast30) / 30; // assume 30-day window
  const participationRate = clamp01(participationRaw);

  // Mentorship frequency in last 30 days
  const mentorshipCount = await MentorshipLog.countDocuments({
    studentId: studentObjectId,
    timestamp: { $gte: since },
  });
  const mentorshipFrequency = clamp01(mentorshipCount / 10); // normalize: 10+ sessions -> 1

  // Weighted aggregate score
  const communityScore = clamp01(
    0.4 * qualityScore + 0.35 * participationRate + 0.25 * mentorshipFrequency
  );

  return {
    qualityScore,
    participationRate,
    mentorshipFrequency,
    communityScore,
  };
}

module.exports = { computeCommunityEngagementScore };
