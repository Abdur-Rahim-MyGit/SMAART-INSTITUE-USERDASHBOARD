const mongoose = require('mongoose');

const createDefaultUserSettings = () => ({
  profile: {
    displayName: '',
    email: '',
    bio: '',
    phone: ''
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    assessmentReminders: true,
    courseUpdates: true,
    coachSessionReminders: true,
    communityActivity: true
  },
  privacy: {
    profileVisibility: 'everyone',
    twoFactorEnabled: false
  },
  appearance: {
    theme: 'light',
    accentColor: '#1a3884'
  },
  language: {
    preferredLanguage: 'English (US)',
    timezone: 'Asia/Kolkata (GMT+5:30)',
    dateFormat: 'DD/MM/YYYY'
  }
});

const userSettingsSchema = new mongoose.Schema({
  profile: {
    displayName: { type: String, default: '' },
    email: { type: String, default: '' },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    assessmentReminders: { type: Boolean, default: true },
    courseUpdates: { type: Boolean, default: true },
    coachSessionReminders: { type: Boolean, default: true },
    communityActivity: { type: Boolean, default: true }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['everyone', 'onlyme', 'connections'],
      default: 'everyone'
    },
    twoFactorEnabled: { type: Boolean, default: false }
  },
  appearance: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    accentColor: { type: String, default: '#1a3884' }
  },
  language: {
    preferredLanguage: { type: String, default: 'English (US)' },
    timezone: { type: String, default: 'Asia/Kolkata (GMT+5:30)' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' }
  }
}, { _id: false });

module.exports = {
  createDefaultUserSettings,
  userSettingsSchema
};
