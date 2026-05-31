const mongoose = require('mongoose');

const userStreakSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  preResetStreak: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'user_streaks'
});

userStreakSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('UserStreak', userStreakSchema);
