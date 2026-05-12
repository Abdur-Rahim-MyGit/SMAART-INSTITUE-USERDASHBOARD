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
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY"
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
            timezone: data.timezone || "Asia/Kolkata",
            dateFormat: data.dateFormat || "DD/MM/YYYY"
          });
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
    } finally {
      setSaving(false);
    }
  };

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

  const settingsTabs = [
    { id: "profile", label: t("settings.profile_settings"), icon: User, description: "Manage your personal information" },
    { id: "notifications", label: t("settings.notifications"), icon: Bell, description: "Configure notification preferences" },
    { id: "privacy", label: t("settings.privacy"), icon: Shield, description: "Manage your privacy settings" },
    { id: "appearance", label: t("settings.appearance"), icon: Palette, description: "Customize your dashboard look" },
    { id: "language", label: t("settings.language"), icon: Globe, description: "Set your language and timezone" },
    { id: "help", label: t("settings.help"), icon: HelpCircle, description: "Get help and contact support" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
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
        return (
          <div className="space-y-6">
            {[
              { label: "Email Notifications", description: "Receive updates via email" },
              { label: "Push Notifications", description: "Get push notifications on your device" },
              { label: "Assessment Reminders", description: "Remind me about pending assessments" },
              { label: "Course Updates", description: "Notify me about new course content" },
              { label: "Coach Session Reminders", description: "Reminders for scheduled coaching sessions" },
              { label: "Community Activity", description: "Updates from community discussions" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">{item.label}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a3884]"></div>
                </label>
              </div>
            ))}
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">Profile Visibility</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Control who can see your profile</p>
                </div>
                <select className="px-3 py-2 rounded-lg bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]">
                  <option>Everyone</option>
                  <option>Only Me</option>
                  <option>Connections</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">Two-Factor Authentication</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
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
                </button>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">Theme</h4>
              <div className="grid grid-cols-2 gap-3">
                {["Light", "Dark"].map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => setTheme(themeOption.toLowerCase())}
                    className={`p-4 rounded-xl border-2 transition-all ${currentTheme === themeOption.toLowerCase()
                        ? "border-[#1a3884] bg-[#1a3884]/10"
                        : "border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884]/50"
                      }`}
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{themeOption}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="space-y-6">
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
                <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
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
      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 p-4 space-y-2 shadow-sm dark:shadow-none">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === tab.id
                    ? "bg-[#1a3884]/20 text-gray-900 dark:text-white border border-[#1a3884]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 p-6 shadow-sm dark:shadow-none"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {settingsTabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {settingsTabs.find((tab) => tab.id === activeTab)?.description}
            </p>

            {renderTabContent()}

            {/* Save Button */}
            <div className="mt-8 flex justify-end gap-3">
              <button className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a3884]/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-[#1a3884] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
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