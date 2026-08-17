const mongoose = require('mongoose');

// Single global slideshow shown beside the student login page for everyone.
// Written by the admin panel; read-only here.
const loginMediaSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true,
  },
  items: [{
    url: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('LoginMedia', loginMediaSchema);
