const mongoose = require('mongoose');

const collegeBannerSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  message: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('CollegeBanner', collegeBannerSchema);
