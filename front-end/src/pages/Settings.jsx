<<<<<<< HEAD
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, Bell, Lock, User, Palette, Globe, Shield, HelpCircle, Loader2 } from "lucide-react";
import useUser from "@/hooks/useUser";
import { API_BASE_URL } from "@/services/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileFormData, setProfileFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: ""
  });

  const [languageFormData, setLanguageFormData] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY"
  });
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    assessments: true,
    courses: true,
    coaching: true,
    community: true
  });

  const [showFAQ, setShowFAQ] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  const faqs = [
    {
      question: "What is the SMAART Career Architecture Map™?",
      answer: "A modern reference model that frames careers as a multi-stage continuum, helping individuals navigate longer working lives and frequent transitions."
    },
    {
      question: "What is the Integrated Capability Framework™?",
      answer: "Our proprietary framework that combines Skills (applied ability), Judgement (decision quality), and Adaptability (effectiveness) to build holistic professional capability."
    },
    {
      question: "What are Future of Work insights?",
      answer: "Research-backed analysis of trends like intelligent automation, job restructuring, and the shift from role-based to skill-based work."
    },
    {
      question: "How can I access the Employment Readiness Report 2026?",
      answer: "The report is available to our institutional partners and subscribers, offering deep dives into the changing demand for skills and capabilities."
    }
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) return;

      setLoading(true);
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/register-details/${user.email}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setProfileFormData({
            name: data.fullName || user.fullName || "",
            email: data.email || user.email || "",
            phone: data.mobileNumber || user.mobileNumber || "",
            bio: data.bio || ""
          });
          setLanguageFormData({
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
            dateFormat: data.dateFormat || "DD/MM/YYYY"
          });
          if (data.notificationPrefs) {
            setNotificationPrefs(data.notificationPrefs);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user?.email) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/register-section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          section: 'personalDetails',
          data: {
            fullName: profileFormData.name,
            mobileNumber: profileFormData.phone,
            bio: profileFormData.bio
          }
        })
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        await refreshUser();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Connection error. Please try again.");
=======
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
>>>>>>> dharshh
    } finally {
      setSaving(false);
    }
  };

<<<<<<< HEAD
  const handleLanguageChange = (e) => {
    const { name, value } = e.target;
    setLanguageFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveLanguage = async () => {
    if (!user?.email) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/register-section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          section: 'personalDetails',
          data: {
            timezone: languageFormData.timezone,
            dateFormat: languageFormData.dateFormat
          }
        })
      });

      if (response.ok) {
        toast.success("Language & Region settings updated");
        await refreshUser();
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving language settings:", error);
      toast.error("Connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.email) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/register-section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          section: 'personalDetails',
          data: {
            notificationPrefs
          }
        })
      });

      if (response.ok) {
        toast.success("Notification preferences updated");
        await refreshUser();
      } else {
        toast.error("Failed to update preferences");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    switch (activeTab) {
      case "profile":
        handleSaveProfile();
        break;
      case "notifications":
        handleSaveNotifications();
        break;
      case "language":
        handleSaveLanguage();
        break;
      default:
        toast.info("Settings updated locally");
        break;
    }
  };

  const settingsTabs = [
    { id: "profile", label: t("settings.profile_settings"), icon: User, description: "Manage your personal information" },
    { id: "notifications", label: t("settings.notifications"), icon: Bell, description: "Configure notification preferences" },
    { id: "privacy", label: t("settings.privacy"), icon: Shield, description: "Manage your privacy settings" },
    { id: "appearance", label: t("settings.appearance"), icon: Palette, description: "Customize your dashboard look" },
    { id: "language", label: t("settings.language"), icon: Globe, description: "Set your language and timezone" },
    { id: "help", label: t("settings.help"), icon: HelpCircle, description: "Get help and contact support" },
=======
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
>>>>>>> dharshh
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
<<<<<<< HEAD
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3884]" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Display Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileFormData.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your display name"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileFormData.email}
                    disabled
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#002147]/50 border border-gray-200 dark:border-[#1a3884]/30 text-gray-500 dark:text-gray-400 cursor-not-allowed focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email address cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileFormData.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={profileFormData.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors resize-none"
                  />
                </div>
              </>
            )}
          </div>
        );

      case "notifications":
        const notificationItems = [
          { id: "email", label: "Email Notifications", description: "Receive updates via email" },
          { id: "push", label: "Push Notifications", description: "Get push notifications on your device" },
          { id: "assessments", label: "Assessment Reminders", description: "Remind me about pending assessments" },
          { id: "courses", label: "Course Updates", description: "Notify me about new course content" },
          { id: "coaching", label: "Coach Session Reminders", description: "Reminders for scheduled coaching sessions" },
          { id: "community", label: "Community Activity", description: "Updates from community discussions" },
        ];
        return (
          <div className="space-y-6">
            {notificationItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
=======
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
>>>>>>> dharshh
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
<<<<<<< HEAD
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationPrefs[item.id]} 
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, [item.id]: e.target.checked }))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a3884]"></div>
=======
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications[item.key]}
                    onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#1a3884] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
>>>>>>> dharshh
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
<<<<<<< HEAD
                <button className="px-4 py-2 rounded-lg bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors">
                  Enable
                </button>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">Change Password</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Update your account password</p>
                </div>
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-4 py-2 rounded-lg border border-[#1a3884] text-[#1a3884] font-medium hover:bg-[#1a3884]/10 transition-colors"
                >
                  Change
=======
                <button
                  type="button"
                  onClick={() => updateSetting('privacy', 'twoFactorEnabled', !settings.privacy.twoFactorEnabled)}
                  className="rounded-lg bg-[#1a3884] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1a3884]/80"
                >
                  {settings.privacy.twoFactorEnabled ? 'Disable' : 'Enable'}
>>>>>>> dharshh
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
<<<<<<< HEAD
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">Theme</h4>
              <div className="grid grid-cols-2 gap-3">
                {["Light", "Dark"].map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => setTheme(themeOption.toLowerCase())}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      currentTheme === themeOption.toLowerCase()
                        ? "border-[#1a3884] bg-[#1a3884]/10"
                        : "border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884]/50"
                    }`}
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{themeOption}</span>
=======
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
>>>>>>> dharshh
                  </button>
                ))}
              </div>
            </div>
<<<<<<< HEAD
=======
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
>>>>>>> dharshh
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
<<<<<<< HEAD
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">{t("settings.language")}</label>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="ur">Urdu (اردو)</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">Timezone</label>
              <select
                name="timezone"
                value={languageFormData.timezone}
                onChange={handleLanguageChange}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - GMT+5:30)</option>
                <option value="America/New_York">America/New_York (EST/EDT - GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT/BST - GMT+0)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST - GMT+9)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - GMT+4)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST - GMT+1)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT - GMT+10)</option>
                <option value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT - GMT+12)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT - GMT-8)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - GMT+8)</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">Date Format</label>
              <select
                name="dateFormat"
                value={languageFormData.dateFormat}
                onChange={handleLanguageChange}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
=======
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
>>>>>>> dharshh
              </select>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveLanguage}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#1a3884] text-white rounded-xl font-semibold hover:bg-[#1a3884]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        );

<<<<<<< HEAD
      case "help":
        if (showFAQ) {
          return (
            <div className="space-y-4">
              <button 
                onClick={() => setShowFAQ(false)}
                className="flex items-center gap-2 text-[#1a3884] dark:text-blue-400 font-medium mb-4 hover:underline"
              >
                ← Back to Help
              </button>
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30"
                >
                  <button
                    onClick={() => setActiveFAQIndex(activeFAQIndex === index ? null : index)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h4 className="text-gray-900 dark:text-white font-medium">{faq.question}</h4>
                    <span className="text-gray-400">{activeFAQIndex === index ? "−" : "+"}</span>
                  </button>
                  <AnimatePresence>
                    {activeFAQIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-200 dark:border-[#1a3884]/20 pt-3">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          );
        }

        if (showDocs) {
          return (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <button 
                onClick={() => setShowDocs(false)}
                className="flex items-center gap-2 text-[#1a3884] dark:text-blue-400 font-medium mb-4 hover:underline"
              >
                ← Back to Help
              </button>
              
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-[#1a3884]/30 pb-2">
                  User Documentation
                </h3>
                
                <section className="mb-8">
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">Getting Started</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Welcome to SMAART Institute! Our platform is designed to help you navigate your career journey using advanced AI insights. Start by completing your profile and taking the baseline assessments.
                  </p>
                </section>

                <section className="mb-8">
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">Core Frameworks</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-[#1a3884]/10 rounded-xl border border-gray-100 dark:border-[#1a3884]/20">
                      <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Career Architecture Map™</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        A multi-stage model for lifelong career development, moving beyond traditional linear career paths.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#1a3884]/10 rounded-xl border border-gray-100 dark:border-[#1a3884]/20">
                      <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Capability Framework™</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Balances technical skills with judgement and adaptability to build comprehensive professional capability.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">Navigation Guide</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                    <li><strong>Dashboard:</strong> Overview of your progress and upcoming tasks.</li>
                    <li><strong>Skills Vault:</strong> A repository of your certified skills and achievements.</li>
                    <li><strong>Vision Board:</strong> Visualize and track your long-term career aspirations.</li>
                    <li><strong>Community:</strong> Connect with peers and mentors in your field.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">Need More Help?</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    If you can't find what you're looking for, please use the "Contact Support" option to reach out to our dedicated team.
                  </p>
                </section>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div 
              onClick={() => {
                setShowFAQ(true);
                setShowDocs(false);
              }}
              className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">FAQ</h4>
              <p className="text-gray-400 text-sm">Find answers to common questions</p>
            </div>
            <div 
              onClick={() => navigate("/dashboard/support")}
              className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">Contact Support</h4>
              <p className="text-gray-400 text-sm">Get in touch with our support team</p>
            </div>
            <div 
              onClick={() => navigate("/dashboard/support")}
              className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">Report a Bug</h4>
              <p className="text-gray-400 text-sm">Help us improve by reporting issues</p>
            </div>
            <div 
              onClick={() => {
                setShowDocs(true);
                setShowFAQ(false);
              }}
              className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">Documentation</h4>
              <p className="text-gray-400 text-sm">Read our user guides and tutorials</p>
            </div>
=======
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
>>>>>>> dharshh
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
<<<<<<< HEAD
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar gap-2 rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 p-2 sm:p-4 shadow-sm dark:shadow-none">
=======
          <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#1a3884]/30 dark:bg-[#002147] dark:shadow-none">
>>>>>>> dharshh
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
<<<<<<< HEAD
                  className={`flex lg:w-full items-center gap-3 p-3 rounded-xl transition-all text-left whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                    ? "bg-[#1a3884]/20 text-gray-900 dark:text-white border border-[#1a3884]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    }`}
=======
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${activeTab === tab.id ? 'border border-[#1a3884] bg-[#1a3884]/20 text-gray-900 dark:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
>>>>>>> dharshh
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
<<<<<<< HEAD
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {settingsTabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {settingsTabs.find((tab) => tab.id === activeTab)?.description}
            </p>
=======
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
>>>>>>> dharshh

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
<<<<<<< HEAD
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
=======
                onClick={saveSettings}
                disabled={saving || loading}
                className="flex items-center gap-2 rounded-xl bg-[#1a3884] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1a3884]/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>}
                {saving ? 'Saving...' : 'Save Changes'}
>>>>>>> dharshh
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <ForgotPasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </motion.div>
  );
};

export default Settings;

