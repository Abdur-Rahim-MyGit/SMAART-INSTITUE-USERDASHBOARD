const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
  escalationId: {
    type: String,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  source: {
    type: String,
    enum: ['coach-report', 'wysa', 'manual', 'assessment', 'self-reported'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['academic', 'mental-health', 'behavioral', 'attendance', 'other'],
    required: true
  },
  description: String,
  assignedTherapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },
  actionTaken: String,
  resolutionDate: Date,
  resolutionTime: Number, // in days
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  notes: [
    {
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      note: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

// Generate escalation ID before saving
escalationSchema.pre('save', async function(next) {
  if (!this.escalationId) {
    const count = await mongoose.model('Escalation').countDocuments();
    this.escalationId = `ESC${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate resolution time if resolved
  if (this.status === 'resolved' && this.resolutionDate && !this.resolutionTime) {
    const diffTime = Math.abs(this.resolutionDate - this.createdAt);
    this.resolutionTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  next();
});

module.exports = mongoose.model('Escalation', escalationSchema);
