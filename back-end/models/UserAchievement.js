const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementType: {
    type: String,
    enum: ['STREAK_6_DAYS', 'OTHER'],
    default: 'STREAK_6_DAYS'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  voucher: {
    code: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Redeemed', 'Expired'],
      default: 'Active'
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    redeemedAt: {
      type: Date
    }
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'user_achievements'
});

userAchievementSchema.index({ user: 1 });
userAchievementSchema.index({ 'voucher.code': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
