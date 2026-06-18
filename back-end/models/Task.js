const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    targetAudience: {
        type: String,
        default: 'all'
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: {
        type: String
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String, // e.g., "10:30 AM"
        default: "All Day"
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Submitted'],
        default: 'Pending'
    },
    type: {
        type: String,
        default: 'personal' // 'personal', 'assessment', 'meeting', 'marketing'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    avatars: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
