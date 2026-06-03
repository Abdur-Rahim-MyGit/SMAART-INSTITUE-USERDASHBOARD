const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  reminderTriggered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index to quickly fetch a user's tasks
todoSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model('Todo', todoSchema);
