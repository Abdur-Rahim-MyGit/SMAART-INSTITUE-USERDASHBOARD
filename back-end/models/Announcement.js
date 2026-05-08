const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 3000
  },
  // Optional attachment — just a URL, no file upload needed
  attachmentUrl: {
    type: String,
    trim: true,
    default: null
  },
  attachmentType: {
    type: String,
    enum: ['pdf', 'image', 'link', null],
    default: null
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'college_admin'],
    required: true
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 'all' = broadcast to everyone, 'college' = specific college(s)
  targetType: {
    type: String,
    enum: ['all', 'college'],
    default: 'all'
  },
  // If targetType === 'college', these are the college IDs
  targetCollegeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date,
    default: null
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }]
}, { timestamps: true });

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isPinned: -1, createdAt: -1 });
announcementSchema.index({ targetType: 1, targetCollegeIds: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
