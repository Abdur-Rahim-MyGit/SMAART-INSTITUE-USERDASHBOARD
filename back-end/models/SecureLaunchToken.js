const mongoose = require('mongoose');

/**
 * One launch of a secure assessment.
 *
 * Created when the student presses "Open in Safe Exam Browser". The raw token
 * travels in the sebs:// link (so SEB can download the .seb file) and inside
 * that file's startURL (so the app running inside SEB can sign the student in
 * without a password). Only the SHA-256 of the token is stored.
 *
 * The record also remembers the Config Key of the .seb file it produced: SEB
 * hashes that key into every request it makes, and middleware/sebGuard checks
 * incoming requests against the keys of this user's recent launches.
 */
const SecureLaunchTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userType: { type: String, default: 'student' },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  stage: { type: String, default: '' },
  // The student's live single-session id. The token the exchange issues
  // carries the same id, so the normal browser is not logged out.
  sessionId: { type: String, default: '' },
  configKey: { type: String, required: true },
  // The exact settings the .seb file is built from, so the bytes SEB
  // downloads always match the key computed at launch time.
  settings: { type: mongoose.Schema.Types.Mixed, required: true },
  configFetchedAt: { type: Date },
  exchangedAt: { type: Date },
  // How long the sebs:// link and the sign-in stay valid.
  expiresAt: { type: Date, required: true },
  // Kept a few hours longer so the guard can still match the Config Key for
  // the whole attempt; Mongo removes the document after that.
  purgeAt: { type: Date, required: true }
}, { timestamps: true });

SecureLaunchTokenSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
SecureLaunchTokenSchema.index({ userId: 1, assessmentId: 1, createdAt: -1 });

module.exports = mongoose.model('SecureLaunchToken', SecureLaunchTokenSchema);
