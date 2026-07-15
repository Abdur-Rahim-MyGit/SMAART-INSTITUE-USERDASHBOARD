const mongoose = require('mongoose');
const Counter = require('./Counter');

const grievanceResponseSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin
    required: false
  },
  respondedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const grievanceSchema = new mongoose.Schema({
  grievanceId: {
    type: String,
    unique: true,
    sparse: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [3000, 'Description cannot exceed 3000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['placement', 'course', 'assessment', 'badges', 'certificate', 'career-direction', 'skill-passport', 'other', 'other-suggestion'],
      message: 'Invalid category'
    }
  },
  isAnonymous: {
    type: Boolean,
    default: false // Allows students to hide their identity from Admin
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  responses: [grievanceResponseSchema],
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'grievances'
});

// Auto-generate Grievance ID (e.g. GRV000001)
grievanceSchema.pre('save', async function (next) {
  if (!this.grievanceId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'grievanceId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.grievanceId = `GRV${String(counter.seq).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Grievance', grievanceSchema);
