/**
 * Log.js — Shared Auth/Activity Log Model
 * 
 * This model is shared with the SMAART-INSTITUTE-ADMIN backend.
 * Both backends write to the same 'logs' collection on Atlas.
 * The Admin Access Logs page reads from this collection.
 */
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'Login', 'LoginFailed', 'LoginBlocked',
            'OtpFailed', 'Logout',
            'Register', 'PasswordReset', 'ForgotPassword',
            'Create', 'Update', 'Delete', 'View',
            'Export', 'Import', 'System',
            'AssignAdmin', 'BulkUpload', 'BulkUpdate', 'StatusChange', 'AssignTeacher'
        ]
    },
    module: {
        type: String,
        required: true,
        enum: ['Auth', 'Assessment', 'College', 'Course', 'System', 'User', 'Login', 'Audit', 'Ticket', 'Department', 'Student', 'Teacher']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userName: { type: String },
    userEmail: { type: String },
    userRole: { type: String },
    // For failed logins where user may not be found — store email as string
    targetEmail: { type: String },
    details: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceInfo: { type: String }, // e.g. "Chrome / Windows / Desktop"
    success: { type: Boolean, default: true },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

logSchema.index({ module: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ user: 1, createdAt: -1 });
logSchema.index({ success: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
