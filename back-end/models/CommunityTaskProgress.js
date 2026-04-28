const mongoose = require('mongoose');

const CommunityTaskProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    completedTasks: {
        type: Object,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('CommunityTaskProgress', CommunityTaskProgressSchema);
