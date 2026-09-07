const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    default: ''
  },
  done: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'checklist'],
    default: 'text'
  },
  checklistItems: {
    type: [checklistItemSchema],
    default: []
  },
  colorId: {
    type: String,
    default: 'yellow'
  },
  pinned: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to quickly find a user's notes for a specific course
noteSchema.index({ user: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);
