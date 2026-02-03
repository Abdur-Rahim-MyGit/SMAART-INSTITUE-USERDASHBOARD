const mongoose = require('mongoose');

const coachSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  domain: {
    type: String,
    enum: ['academic', 'career', 'personal', 'mental-health', 'other'],
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: Date,
  sessionType: {
    type: String,
    enum: ['online', 'offline', 'phone'],
    default: 'online'
  },
  duration: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'requested'
  },
  notes: String,
  studentFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String
  },
  coachNotes: String,
  followUpRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate session ID before saving
coachSessionSchema.pre('save', async function(next) {
  if (!this.sessionId) {
    const count = await mongoose.model('CoachSession').countDocuments();
    this.sessionId = `SES${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CoachSession', coachSessionSchema);
