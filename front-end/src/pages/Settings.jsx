import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, Bell, Lock, User, Palette, Globe, Shield, HelpCircle, Loader2, ArrowLeft } from "lucide-react";
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
      question: t("settings_page.faq_q1"),
      answer: t("settings_page.faq_a1")
    },
    {
      question: t("settings_page.faq_q2"),
      answer: t("settings_page.faq_a2")
    },
    {
      question: t("settings_page.faq_q3"),
      answer: t("settings_page.faq_a3")
    },
    {
      question: t("settings_page.faq_q4"),
      answer: t("settings_page.faq_a4")
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
        toast.success(t("settings_page.profile_success"));
        await refreshUser();
      } else {
        toast.error(t("settings_page.profile_failed"));
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(t("settings_page.connection_error"));
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
        toast.success(t("settings_page.language_success"));
        await refreshUser();
      } else {
        toast.error(t("settings_page.language_failed"));
      }
    } catch (error) {
      console.error("Error saving language settings:", error);
      toast.error(t("settings_page.connection_error"));
    } finally {
      setSaving(false);
    }
  };

  const settingsTabs = [
    { id: "profile", label: t("settings.profile_settings"), icon: User, description: t("settings_page.profile_desc") },
    { id: "notifications", label: t("settings.notifications"), icon: Bell, description: t("settings_page.notifications_desc") },
    { id: "privacy", label: t("settings.privacy"), icon: Shield, description: t("settings_page.privacy_desc") },
    { id: "customisation", label: t("settings.customisation"), icon: Palette, description: t("settings_page.customisation_desc") },
    { id: "help", label: t("settings.help"), icon: HelpCircle, description: t("settings_page.help_desc") },
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t("settings_page.display_name")}</label>
                  <input
                    type="text"
                    name="name"
                    value={profileFormData.name}
                    onChange={handleProfileChange}
                    placeholder={t("settings_page.enter_display_name")}
                    className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-dark-elevated border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] dark:focus:border-blue-400 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t("settings_page.email_address")}</label>
                  <input
                    type="email"
                    name="email"
                    value={profileFormData.email}
                    disabled
                    placeholder={t("settings_page.enter_email")}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#00152E] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 cursor-not-allowed focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t("settings_page.email_cannot_change")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t("settings_page.phone_number")}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileFormData.phone}
                    onChange={handleProfileChange}
                    placeholder={t("settings_page.enter_phone_number")}
                    className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-dark-elevated border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] dark:focus:border-blue-400 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t("settings_page.bio")}</label>
                  <textarea
                    name="bio"
                    value={profileFormData.bio}
                    onChange={handleProfileChange}
                    placeholder={t("settings_page.tell_about_yourself")}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-dark-elevated border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] dark:focus:border-blue-400 focus:outline-none transition-colors resize-none"
                  />
                </div>
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-medium">{t("settings_page.change_password")}</h4>
                      <p className="text-gray-500 dark:text-slate-300 text-sm">{t("settings_page.update_password_desc")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowChangePasswordModal(true)}
                      className="px-4 py-2 rounded-lg border border-[#1a3884] text-[#1a3884] text-sm font-bold hover:bg-[#1a3884]/10 transition-colors"
                    >
                      {t("settings_page.change")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            {[
              { label: t("settings_page.email_notifications"), description: t("settings_page.email_notifications_desc") },
              { label: t("settings_page.push_notifications"), description: t("settings_page.push_notifications_desc") },
              { label: t("settings_page.community_activity"), description: t("settings_page.community_activity_desc") },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">{item.label}</h4>
                  <p className="text-gray-500 dark:text-slate-300 text-sm">{item.description}</p>
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
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">{t("settings_page.two_factor_auth")}</h4>
                  <p className="text-gray-500 dark:text-slate-300 text-sm">{t("settings_page.two_factor_desc")}</p>
                </div>
                <button type="button" className="px-4 py-2 rounded-lg bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors">
                  {t("settings_page.enable")}
                </button>
              </div>
            </div>

            {/* SMAART Security & Privacy Guidelines */}
            <div className="p-5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <h4 className="flex items-center gap-2 text-[#002147] dark:text-blue-200 font-semibold mb-3">
                <Shield className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                {t("settings_page.security_guidelines")}
              </h4>
              <ul className="space-y-3.5 text-sm text-gray-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>{t("settings_page.guideline_1_title")}</strong>{t("settings_page.guideline_1_desc")}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>{t("settings_page.guideline_2_title")}</strong>{t("settings_page.guideline_2_desc")}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>{t("settings_page.guideline_3_title")}</strong>{t("settings_page.guideline_3_desc")}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>{t("settings_page.guideline_4_title")}</strong>{t("settings_page.guideline_4_desc")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );

      case "customisation":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10">
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">{t("settings_page.theme")}</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "Light", label: t("settings_page.light") },
                  { value: "Dark", label: t("settings_page.dark") }
                ].map((themeOption) => (
                  <button
                    key={themeOption.value}
                    type="button"
                    onClick={(e) => setTheme(themeOption.value.toLowerCase(), e)}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${currentTheme === themeOption.value.toLowerCase()
                      ? "border-[#1a3884] bg-[#1a3884]/10 dark:bg-[#1a3884]/20"
                      : "border-gray-200 dark:border-white/10 hover:border-[#1a3884]/50 dark:hover:border-[#1a3884]/60"
                      }`}
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{themeOption.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">{t("settings.language")}</label>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-elevated border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884] dark:focus:border-blue-400 transition-colors"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="ml">Malayalam (മലയാളം)</option>
                <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="fr">French (Français)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">{t("settings_page.timezone")}</label>
              <select
                name="timezone"
                value={languageFormData.timezone}
                onChange={handleLanguageChange}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-elevated border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884] dark:focus:border-blue-400 transition-colors"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">{t("settings_page.date_format")}</label>
              <select
                name="dateFormat"
                value={languageFormData.dateFormat}
                onChange={handleLanguageChange}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-elevated border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884] dark:focus:border-blue-400 transition-colors"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
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
                {t("settings_page.back_to_help")}
              </button>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10"
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
                        <p className="mt-3 text-gray-500 dark:text-slate-300 text-sm leading-relaxed border-t border-gray-200 dark:border-white/10 pt-3">
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
                {t("settings_page.back_to_help")}
              </button>

              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-white/10 pb-2">
                  {t("settings_page.user_documentation")}
                </h3>

                <section className="mb-8">
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">{t("settings_page.getting_started")}</h4>
                  <p className="text-gray-600 dark:text-slate-200 leading-relaxed">
                    {t("settings_page.getting_started_desc")}
                  </p>
                </section>

                <section className="mb-8">
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">{t("settings_page.core_frameworks")}</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F8FAFC] dark:bg-[#1a3884]/10 rounded-xl border border-gray-100 dark:border-white/10">
                      <h5 className="font-bold text-gray-800 dark:text-slate-100 mb-1">{t("settings_page.career_architecture_map")}</h5>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        {t("settings_page.career_architecture_map_desc")}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] dark:bg-[#1a3884]/10 rounded-xl border border-gray-100 dark:border-white/10">
                      <h5 className="font-bold text-gray-800 dark:text-slate-100 mb-1">{t("settings_page.capability_framework")}</h5>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        {t("settings_page.capability_framework_desc")}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">{t("settings_page.navigation_guide")}</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-slate-200">
                    <li><strong>{t("settings_page.nav_dashboard")}</strong>{t("settings_page.nav_dashboard_desc")}</li>
                    <li><strong>{t("settings_page.nav_skills_vault")}</strong>{t("settings_page.nav_skills_vault_desc")}</li>
                    <li><strong>{t("settings_page.nav_vision_board")}</strong>{t("settings_page.nav_vision_board_desc")}</li>
                    <li><strong>{t("settings_page.nav_community")}</strong>{t("settings_page.nav_community_desc")}</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-[#1a3884] dark:text-blue-400 mb-2">{t("settings_page.need_more_help")}</h4>
                  <p className="text-gray-600 dark:text-slate-200">
                    {t("settings_page.need_more_help_desc")}
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
              className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10 hover:border-[#1a3884] hover:shadow-md dark:hover:border-blue-400/50 transition-all cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">{t("settings_page.faq")}</h4>
              <p className="text-gray-400 text-sm">{t("settings_page.faq_desc")}</p>
            </div>
            <div
              onClick={() => navigate("/dashboard/support")}
              className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10 hover:border-[#1a3884] hover:shadow-md dark:hover:border-blue-400/50 transition-all cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">{t("settings_page.contact_support")}</h4>
              <p className="text-gray-400 text-sm">{t("settings_page.contact_support_desc")}</p>
            </div>
            <div
              onClick={() => navigate("/dashboard/support")}
              className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10 hover:border-[#1a3884] hover:shadow-md dark:hover:border-blue-400/50 transition-all cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">{t("settings_page.report_bug")}</h4>
              <p className="text-gray-400 text-sm">{t("settings_page.report_bug_desc")}</p>
            </div>
            <div
              onClick={() => {
                setShowDocs(true);
                setShowFAQ(false);
              }}
              className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#002147] border border-gray-200 dark:border-white/10 hover:border-[#1a3884] hover:shadow-md dark:hover:border-blue-400/50 transition-all cursor-pointer"
            >
              <h4 className="text-gray-900 dark:text-white font-medium">{t("settings_page.documentation")}</h4>
              <p className="text-gray-400 text-sm">{t("settings_page.documentation_desc")}</p>
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
      className="mx-auto max-w-7xl space-y-6 p-8"
    >
      {/* Back Button - Mobile Only */}
      <div className="md:hidden">
        <button
          onClick={() => navigate("/dashboard")}
          className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#1a3884] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
        </button>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-white/10 p-4 space-y-2 shadow-sm dark:shadow-none">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === tab.id
                    ? "bg-[#1a3884]/20 text-gray-900 dark:text-white border border-[#1a3884]"
                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-[14px]">{tab.label}</span>
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
            className="rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none"
          >
            <h2 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white mb-1">
              {settingsTabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
              {settingsTabs.find((tab) => tab.id === activeTab)?.description}
            </p>

            {renderTabContent()}

            {/* Save Button */}
            {(activeTab === "profile" || activeTab === "customisation") && (
              <div className="mt-8 flex justify-end gap-3">
                <button className="px-4 py-2 text-sm font-bold rounded-lg border border-gray-300 dark:border-[#1a3884]/50 text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-[#1a3884] transition-colors">
                  {t("settings_page.cancel")}
                </button>
                <button
                  onClick={activeTab === "profile" ? handleSaveProfile : handleSaveLanguage}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-[#1a3884] text-white hover:bg-[#132c6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {t("settings_page.save_changes")}
                </button>
              </div>
            )}
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