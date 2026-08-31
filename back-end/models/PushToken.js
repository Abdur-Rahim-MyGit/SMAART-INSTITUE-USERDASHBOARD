const mongoose = require('mongoose');

/**
 * Expo push token registry — one document per device token.
 *
 * Keyed on the token itself: a token uniquely identifies an app install, so
 * when a different user signs in on the same device the upsert re-points the
 * token to them instead of duplicating it (and instead of pushing to the
 * previous account's owner).
 */
const pushTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true, // dedupe on token — an install has exactly one row
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web', 'unknown'],
      default: 'unknown',
    },
  },
  {
    timestamps: true, // updatedAt refreshes on every re-registration
  }
);

pushTokenSchema.index({ user: 1, token: 1 });

module.exports = mongoose.model('PushToken', pushTokenSchema);
