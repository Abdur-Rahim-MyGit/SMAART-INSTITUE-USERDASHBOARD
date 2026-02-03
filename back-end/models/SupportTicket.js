const mongoose = require('mongoose');
const Counter = require('./Counter');

/**
 * Support Ticket Schema
 * Stored in the 'support' collection as per requirements
 */
const responseSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    sparse: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
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
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['technical', 'billing', 'account', 'content', 'feedback', 'other'],
      message: 'Invalid category. Must be one of: technical, billing, account, content, feedback, other'
    }
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Invalid priority. Must be one of: low, medium, high'
    },
    default: 'medium'
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'in-progress', 'resolved', 'closed'],
      message: 'Invalid status. Must be one of: open, in-progress, resolved, closed'
    },
    default: 'open'
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  responses: [responseSchema],
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'support' // Explicitly set collection name as per requirements
});

// Generate ticket ID before saving (atomic counter to prevent race conditions)
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'ticketId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.ticketId = `TKT${String(counter.seq).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Set resolvedAt timestamp when status changes to resolved
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  
  next();
});

// Indexes for better query performance
supportTicketSchema.index({ ticketId: 1 }, { unique: true, sparse: true });
supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ userId: 1, status: 1 }); // Compound index for user queries

// Virtual for response count
supportTicketSchema.virtual('responseCount').get(function() {
  return this.responses ? this.responses.length : 0;
});

// Ensure virtuals are included in JSON output
supportTicketSchema.set('toJSON', { virtuals: true });
supportTicketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
