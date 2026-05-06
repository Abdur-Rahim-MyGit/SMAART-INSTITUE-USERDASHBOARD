import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Globe, HelpCircle, Palette, Settings as SettingsIcon, Shield, User } from 'lucide-react';
import { apiCall } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import useUser from '../hooks/useUser';

const createDefaultSettings = (theme = 'system') => ({
  profile: {
    displayName: '',
    email: '',
    bio: '',
    phone: '',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    assessmentReminders: true,
    courseUpdates: true,
    coachSessionReminders: true,
    communityActivity: true,
  },
  privacy: {
    profileVisibility: 'everyone',
    twoFactorEnabled: false,
  },
  appearance: {
    theme,
    accentColor: '#1a3884',
  },
  language: {
    preferredLanguage: 'English (US)',
    timezone: 'Asia/Kolkata (GMT+5:30)',
    dateFormat: 'DD/MM/YYYY',
  },
});

const Settings = () => {
  const { theme: currentTheme, setTheme: setGlobalTheme } = useTheme();
  const { user, updateUser } = useUser();
  const defaultSettings = useMemo(() => createDefaultSettings(currentTheme), [currentTheme]);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setSettings((prev) => ({
      ...defaultSettings,
      ...prev,
      appearance: {
        ...defaultSettings.appearance,
        ...(prev.appearance || {}),
      },
    }));
  }, [defaultSettings]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('token');

      if (!token) {
        setSettings(defaultSettings);
        return;
      }

      const response = await apiCall('/users/settings');
      if (response.success && response.data) {
        setSettings(response.data);
        if (response.data.appearance?.theme) {
          setGlobalTheme(response.data.appearance.theme);
        }
      }
    } catch (loadError) {
      console.error('Failed to load settings:', loadError);
      if (!String(loadError.message).includes('401') && !String(loadError.message).includes('Unauthorized')) {
        setError('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('Please log in to save settings');
        return;
      }

      const response = await apiCall('/users/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (response.success && response.data) {
        setSettings(response.data);
        setSuccess('Settings saved successfully!');

        if (response.data.appearance?.theme) {
          setGlobalTheme(response.data.appearance.theme);
        }

        updateUser({
          fullName: response.data.profile.displayName,
          email: response.data.profile.email,
          mobile: response.data.profile.phone,
        });
      }
    } catch (saveError) {
      console.error('Failed to save settings:', saveError);
      if (String(saveError.message).includes('401') || String(saveError.message).includes('Unauthorized')) {
        setError('Please log in to save settings');
      } else {
        setError('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, field, value) => {
    setError('');
    setSuccess('');
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));

    if (category === 'appearance' && field === 'theme') {
      setGlobalTheme(value);
    }
  };

  const handleCancel = () => {
    setError('');
    setSuccess('');
    loadSettings();
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile Settings', icon: User, description: 'Manage your personal information' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure notification preferences' },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Manage your privacy settings' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Customize your dashboard look' },
    { id: 'language', label: 'Language & Region', icon: Globe, description: 'Set your language and timezone' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, description: 'Get help and contact support' },
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#1a3884]"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">Display Name</label>
              <input
                type="text"
                value={settings.profile.displayName}
                onChange={(e) => updateSetting('profile', 'displayName', e.target.value)}
                placeholder="Enter your display name"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-colors placeholder-gray-400 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#002147] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">Email Address</label>
              <input
                type="email"
                value={settings.profile.email || user?.email || ''}
                disabled
                placeholder="Email cannot be changed here"
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500 transition-colors placeholder-gray-400 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#001122] dark:text-gray-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">Phone Number</label>
              <input
                type="tel"
                value={settings.profile.phone}
                onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                placeholder="Enter your phone number"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-colors placeholder-gray-400 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#002147] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">Bio</label>
              <textarea
                value={settings.profile.bio}
                onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-colors placeholder-gray-400 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#002147] dark:text-white"
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
              { key: 'pushNotifications', label: 'Push Notifications', description: 'Get push notifications on your device' },
              { key: 'assessmentReminders', label: 'Assessment Reminders', description: 'Remind me about pending assessments' },
              { key: 'courseUpdates', label: 'Course Updates', description: 'Notify me about new course content' },
              { key: 'coachSessionReminders', label: 'Coach Session Reminders', description: 'Reminders for scheduled coaching sessions' },
              { key: 'communityActivity', label: 'Community Activity', description: 'Updates from community discussions' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications[item.key]}
                    onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#1a3884] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            ))}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Profile Visibility</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your profile</p>
                </div>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#001229] dark:text-white"
                >
                  <option value="everyone">Everyone</option>
                  <option value="onlyme">Only Me</option>
                  <option value="connections">Connections</option>
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('privacy', 'twoFactorEnabled', !settings.privacy.twoFactorEnabled)}
                  className="rounded-lg bg-[#1a3884] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1a3884]/80"
                >
                  {settings.privacy.twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
              <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Theme</h4>
              <div className="grid grid-cols-3 gap-3">
                {['light', 'dark', 'system'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSetting('appearance', 'theme', theme)}
                    className={`rounded-xl border-2 p-4 capitalize transition-all ${settings.appearance.theme === theme ? 'border-[#1a3884] bg-[#1a3884]/10' : 'border-[#1a3884]/30 hover:border-[#1a3884]/50'}`}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{theme}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
              <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Accent Color</h4>
              <div className="flex gap-3">
                {['#1a3884', '#6366F1', '#EC4899', '#F59E0B', '#10B981'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateSetting('appearance', 'accentColor', color)}
                    className={`h-10 w-10 rounded-full border-2 ${settings.appearance.accentColor === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
              <label className="mb-3 block font-medium text-gray-900 dark:text-white">Language</label>
              <select
                value={settings.language.preferredLanguage}
                onChange={(e) => updateSetting('language', 'preferredLanguage', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#001229] dark:text-white"
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
              </select>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
              <label className="mb-3 block font-medium text-gray-900 dark:text-white">Timezone</label>
              <select
                value={settings.language.timezone}
                onChange={(e) => updateSetting('language', 'timezone', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#001229] dark:text-white"
              >
                <option>Asia/Kolkata (GMT+5:30)</option>
                <option>America/New_York (GMT-5)</option>
                <option>Europe/London (GMT+0)</option>
                <option>Asia/Tokyo (GMT+9)</option>
              </select>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#1a3884]/30 dark:bg-[#002147]">
              <label className="mb-3 block font-medium text-gray-900 dark:text-white">Date Format</label>
              <select
                value={settings.language.dateFormat}
                onChange={(e) => updateSetting('language', 'dateFormat', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-[#1a3884] focus:outline-none dark:border-[#1a3884]/30 dark:bg-[#001229] dark:text-white"
              >
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-6">
            {[
              { title: 'FAQ', description: 'Find answers to common questions' },
              { title: 'Contact Support', description: 'Get in touch with our support team' },
              { title: 'Report a Bug', description: 'Help us improve by reporting issues' },
              { title: 'Documentation', description: 'Read our user guides and tutorials' },
            ].map((item) => (
              <div key={item.title} className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-[#1a3884] dark:border-[#1a3884]/30 dark:bg-[#002147]">
                <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#1a3884]/30 dark:bg-[#002147] dark:shadow-none">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${activeTab === tab.id ? 'border border-[#1a3884] bg-[#1a3884]/20 text-gray-900 dark:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#1a3884]/30 dark:bg-[#002147] dark:shadow-none"
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-[#1a3884]/10 p-2 text-[#1a3884] dark:text-white">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {settingsTabs.find((tab) => tab.id === activeTab)?.label}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {settingsTabs.find((tab) => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>

            {renderTabContent()}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                {success}
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-xl border border-gray-300 px-6 py-2.5 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1a3884]/50 dark:text-gray-400 dark:hover:border-[#1a3884] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={saving || loading}
                className="flex items-center gap-2 rounded-xl bg-[#1a3884] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1a3884]/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;

