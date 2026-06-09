const mongoose = require('mongoose');

const videoTranscriptSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transcriptText: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    default: 'deepgram'
  }
}, { timestamps: true });

module.exports = mongoose.model('VideoTranscript', videoTranscriptSchema);
