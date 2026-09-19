import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User, Bell, Shield, Palette, HelpCircle, Loader2, ArrowLeft, Lock, Mail, Phone,
  ChevronDown, ChevronRight, FileText, Sun, Moon, Languages, Clock, Calendar,
  Save, Check, Smartphone, Users, Headset, Bug, Edit2, Settings as SettingsIcon,
} from "@/components/icons";
import useUser from "@/hooks/useUser";
import { API_BASE_URL } from "@/services/api";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

// Same tokens as Skills Vault / Courses / Assessments.
const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const PANEL =
  "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#072036] text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-white text-xs font-bold text-[#034a7d] transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] dark:border-white/10 dark:bg-white/5 dark:text-[#A6D7E8] dark:hover:bg-white/10";
const FIELD =
  "w-full rounded-xl border border-[#d7ebf5] bg-white px-3.5 py-2.5 text-sm text-[#072036] placeholder:text-slate-400 transition-colors focus:border-[#045C9A] focus:outline-none focus:ring-2 focus:ring-[#045C9A]/15 dark:border-white/10 dark:bg-[#072036]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#A6D7E8]";
const FIELD_DISABLED =
  "w-full cursor-not-allowed rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] px-3.5 py-2.5 text-sm text-slate-500 dark:border-white/10 dark:bg-[#072036]/40 dark:text-slate-400";
const LABEL =
  "mb-1.5 block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]";
const EASE = [0.25, 0.1, 0.25, 1];

const LANGUAGES = [
  ["en", "English"], ["hi", "Hindi (हिन्दी)"], ["ta", "Tamil (தமிழ்)"], ["te", "Telugu (తెలుగు)"],
  ["kn", "Kannada (ಕನ್ನಡ)"], ["ml", "Malayalam (മലയാളം)"], ["pa", "Punjabi (ਪੰਜਾਬੀ)"],
  ["ur", "Urdu (اردو)"], ["fr", "French (Français)"], ["ar", "Arabic (العربية)"],
];
const TIMEZONES = [
  ["Asia/Kolkata", "Asia/Kolkata (GMT+5:30)"], ["America/New_York", "America/New_York (GMT-5)"],
  ["Europe/London", "Europe/London (GMT+0)"], ["Asia/Tokyo", "Asia/Tokyo (GMT+9)"],
];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

/* ── Small building blocks ────────────────────────────────────────────── */

/** Section header inside the content card: icon tile + title + one-line hint. */
const SectionHead = ({ icon: Icon, title, hint }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <h3 className="text-sm font-extrabold text-[#072036] dark:text-white">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-[#35566b] dark:text-slate-400">{hint}</p>}
    </div>
  </div>
);

/** A labelled row with an icon and an action on the right (toggle / button). */
const SettingRow = ({ icon: Icon, title, desc, children, onClick, id }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      id={id}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left ${PANEL} ${
        onClick ? "transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] dark:hover:bg-[#045C9A]/10" : ""
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#045C9A] shadow-sm dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[#072036] dark:text-white">{title}</p>
        {desc && <p className="text-xs text-[#35566b] dark:text-slate-400">{desc}</p>}
      </div>
      {children}
    </Tag>
  );
};

/** Accessible switch on brand colours. */
const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#045C9A]/40 ${
      checked ? "bg-[#045C9A]" : "bg-slate-300 dark:bg-white/20"
    }`}
  >
    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

const SelectField = ({ id, icon: Icon, label, value, onChange, name, options }) => (
  <div>
    <label htmlFor={id} className={LABEL}>{label}</label>
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#045C9A] dark:text-[#A6D7E8]" />}
      <select id={id} name={name} value={value} onChange={onChange} className={`${FIELD} appearance-none ${Icon ? "pl-10" : ""} pr-9`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

/* ── Page ─────────────────────────────────────────────────────────────── */

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const emptyProfile = { name: "", email: "", phone: "", bio: "" };
  const [profileFormData, setProfileFormData] = useState(emptyProfile);
  const [profileSnapshot, setProfileSnapshot] = useState(emptyProfile);

  const emptyRegion = { timezone: "Asia/Kolkata", dateFormat: "DD/MM/YYYY" };
  const [languageFormData, setLanguageFormData] = useState(emptyRegion);
  const [regionSnapshot, setRegionSnapshot] = useState(emptyRegion);

  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, community: true });

  const [helpView, setHelpView] = useState("menu"); // menu | faq | docs
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  const faqs = [1, 2, 3, 4].map((n) => ({
    question: t(`settings_page.faq_q${n}`),
    answer: t(`settings_page.faq_a${n}`),
  }));

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/users/register-details/${user.email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const profile = {
            name: data.fullName || user.fullName || "",
            email: data.email || user.email || "",
            phone: data.mobileNumber || user.mobileNumber || "",
            bio: data.bio || "",
          };
          const region = {
            timezone: data.timezone || "Asia/Kolkata",
            dateFormat: data.dateFormat || "DD/MM/YYYY",
          };
          setProfileFormData(profile);
          setProfileSnapshot(profile);
          setLanguageFormData(region);
          setRegionSnapshot(region);
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
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleLanguageChange = (e) => {
    const { name, value } = e.target;
    setLanguageFormData((prev) => ({ ...prev, [name]: value }));
  };

  const patchSection = async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/register-section`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, section: "personalDetails", data }),
    });
    return response.ok;
  };

  const handleSaveProfile = async () => {
    if (!user?.email) return;
    setSaving(true);
    try {
      const ok = await patchSection({
        fullName: profileFormData.name,
        mobileNumber: profileFormData.phone,
        bio: profileFormData.bio,
      });
      if (ok) {
        toast.success(t("settings_page.profile_success"));
        setProfileSnapshot(profileFormData);
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

  const handleSaveLanguage = async () => {
    if (!user?.email) return;
    setSaving(true);
    try {
      const ok = await patchSection({
        timezone: languageFormData.timezone,
        dateFormat: languageFormData.dateFormat,
      });
      if (ok) {
        toast.success(t("settings_page.language_success"));
        setRegionSnapshot(languageFormData);
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

  const profileDirty = JSON.stringify(profileFormData) !== JSON.stringify(profileSnapshot);
  const regionDirty = JSON.stringify(languageFormData) !== JSON.stringify(regionSnapshot);

  const settingsTabs = [
    { id: "profile", label: t("settings.profile_settings"), icon: User, description: t("settings_page.profile_desc") },
    { id: "notifications", label: t("settings.notifications"), icon: Bell, description: t("settings_page.notifications_desc") },
    { id: "privacy", label: t("settings.privacy"), icon: Shield, description: t("settings_page.privacy_desc") },
    { id: "customisation", label: t("settings.customisation"), icon: Palette, description: t("settings_page.customisation_desc") },
    { id: "help", label: t("settings.help"), icon: HelpCircle, description: t("settings_page.help_desc") },
  ];
  const activeMeta = settingsTabs.find((tab) => tab.id === activeTab);

  const initials = (profileFormData.name || user?.fullName || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  /* ── Tab bodies ─────────────────────────────────────────────────────── */

  const renderProfile = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#045C9A]" />
        </div>
      ) : (
        <>
          {/* Identity strip */}
          <div className={`flex items-center gap-4 rounded-xl px-4 py-3.5 ${PANEL}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#072036] text-sm font-extrabold text-white dark:bg-[#A6D7E8] dark:text-[#072036]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-[#072036] dark:text-white">{profileFormData.name || user?.fullName}</p>
              <p className="truncate text-xs text-[#35566b] dark:text-slate-400">{profileFormData.email || user?.email}</p>
            </div>
            <span className="hidden items-center gap-1 rounded-full bg-[#045C9A]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] sm:inline-flex">
              <Check className="h-3 w-3" />
              {t("settings_page.role_student", "Student")}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="settings-name" className={LABEL}>{t("settings_page.display_name")}</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#045C9A] dark:text-[#A6D7E8]" />
                <input id="settings-name" type="text" name="name" value={profileFormData.name} onChange={handleProfileChange} placeholder={t("settings_page.enter_display_name")} className={`${FIELD} pl-10`} />
              </div>
            </div>
            <div>
              <label htmlFor="settings-phone" className={LABEL}>{t("settings_page.phone_number")}</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#045C9A] dark:text-[#A6D7E8]" />
                <input id="settings-phone" type="tel" name="phone" value={profileFormData.phone} onChange={handleProfileChange} placeholder={t("settings_page.enter_phone_number")} className={`${FIELD} pl-10`} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="settings-email" className={LABEL}>{t("settings_page.email_address")}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="settings-email" type="email" name="email" value={profileFormData.email} disabled placeholder={t("settings_page.enter_email")} className={`${FIELD_DISABLED} pl-10`} />
                <Lock className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="mt-1.5 text-[11px] text-[#35566b] dark:text-slate-400">{t("settings_page.email_cannot_change")}</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="settings-bio" className={LABEL}>{t("settings_page.bio")}</label>
              <textarea id="settings-bio" name="bio" value={profileFormData.bio} onChange={handleProfileChange} placeholder={t("settings_page.tell_about_yourself")} rows={3} maxLength={300} className={`${FIELD} resize-none`} />
              <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">{profileFormData.bio.length}/300</p>
            </div>
          </div>

          <div className="border-t border-[#d7ebf5] pt-5 dark:border-white/10">
            <SettingRow icon={Lock} title={t("settings_page.change_password")} desc={t("settings_page.update_password_desc")}>
              <button type="button" onClick={() => setShowChangePasswordModal(true)} className={`${BTN_GHOST} px-3 py-1.5`}>
                <Edit2 className="h-3.5 w-3.5" />
                {t("settings_page.change")}
              </button>
            </SettingRow>
          </div>
        </>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-3">
      {[
        { key: "email", icon: Mail, label: t("settings_page.email_notifications"), desc: t("settings_page.email_notifications_desc") },
        { key: "push", icon: Smartphone, label: t("settings_page.push_notifications"), desc: t("settings_page.push_notifications_desc") },
        { key: "community", icon: Users, label: t("settings_page.community_activity"), desc: t("settings_page.community_activity_desc") },
      ].map((item) => (
        <SettingRow key={item.key} icon={item.icon} title={item.label} desc={item.desc}>
          <Switch checked={notifPrefs[item.key]} onChange={(v) => setNotifPrefs((p) => ({ ...p, [item.key]: v }))} label={item.label} />
        </SettingRow>
      ))}
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <SettingRow icon={Shield} title={t("settings_page.two_factor_auth")} desc={t("settings_page.two_factor_desc")}>
        <button type="button" className={`${BTN_PRIMARY} px-3.5 py-1.5`}>{t("settings_page.enable")}</button>
      </SettingRow>

      <div>
        <SectionHead icon={Lock} title={t("settings_page.security_guidelines")} />
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className={`rounded-xl px-4 py-3.5 ${PANEL}`}>
              <p className="text-[12.5px] font-extrabold text-[#072036] dark:text-white">
                {t(`settings_page.guideline_${n}_title`).replace(/:\s*$/, "")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#35566b] dark:text-slate-400">{t(`settings_page.guideline_${n}_desc`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderCustomisation = () => (
    <div className="space-y-6">
      <div>
        <p className={LABEL}>{t("settings_page.theme")}</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("settings_page.theme")}>
          {[
            { value: "light", icon: Sun, label: t("settings_page.light") },
            { value: "dark", icon: Moon, label: t("settings_page.dark") },
          ].map((opt) => {
            const active = currentTheme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={(e) => setTheme(opt.value, e)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? "border-[#045C9A] bg-[#EAF7FD] dark:border-[#A6D7E8] dark:bg-[#045C9A]/20"
                    : "border-[#d7ebf5] bg-white hover:border-[#045C9A]/40 dark:border-white/10 dark:bg-[#072036]/60 dark:hover:border-[#A6D7E8]/40"
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-[#045C9A] text-white dark:bg-[#A6D7E8] dark:text-[#072036]" : "bg-[#F1F5F9] text-[#045C9A] dark:bg-white/5 dark:text-[#A6D7E8]"}`}>
                  <opt.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[13px] font-bold text-[#072036] dark:text-white">{opt.label}</span>
                {active && <Check className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SelectField id="settings-language" icon={Languages} label={t("settings.language")} value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} options={LANGUAGES} />
        </div>
        <SelectField id="settings-timezone" icon={Clock} name="timezone" label={t("settings_page.timezone")} value={languageFormData.timezone} onChange={handleLanguageChange} options={TIMEZONES} />
        <SelectField id="settings-dateformat" icon={Calendar} name="dateFormat" label={t("settings_page.date_format")} value={languageFormData.dateFormat} onChange={handleLanguageChange} options={DATE_FORMATS.map((f) => [f, f])} />
      </div>
    </div>
  );

  const renderHelp = () => {
    const back = (
      <button type="button" onClick={() => setHelpView("menu")} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#045C9A] hover:underline dark:text-[#A6D7E8]">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("settings_page.back_to_help").replace(/^←\s*/, "")}
      </button>
    );

    if (helpView === "faq") {
      return (
        <div className="space-y-4">
          {back}
          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const open = activeFAQIndex === index;
              return (
                <div key={index} className={`rounded-xl ${PANEL}`}>
                  <button type="button" aria-expanded={open} onClick={() => setActiveFAQIndex(open ? null : index)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                    <span className="text-[13px] font-bold text-[#072036] dark:text-white">{faq.question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#045C9A] transition-transform dark:text-[#A6D7E8] ${open ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <p className="border-t border-[#d7ebf5] px-4 py-3 text-xs leading-relaxed text-[#35566b] dark:border-white/10 dark:text-slate-400">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (helpView === "docs") {
      return (
        <div className="space-y-5">
          {back}
          <SectionHead icon={FileText} title={t("settings_page.user_documentation")} />
          <div className="space-y-5 text-sm">
            <section>
              <h4 className="text-[13px] font-extrabold text-[#045C9A] dark:text-[#A6D7E8]">{t("settings_page.getting_started")}</h4>
              <p className="mt-1 text-xs leading-relaxed text-[#35566b] dark:text-slate-400">{t("settings_page.getting_started_desc")}</p>
            </section>
            <section>
              <h4 className="text-[13px] font-extrabold text-[#045C9A] dark:text-[#A6D7E8]">{t("settings_page.core_frameworks")}</h4>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {["career_architecture_map", "capability_framework"].map((k) => (
                  <div key={k} className={`rounded-xl px-4 py-3 ${PANEL}`}>
                    <p className="text-[12.5px] font-extrabold text-[#072036] dark:text-white">{t(`settings_page.${k}`)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#35566b] dark:text-slate-400">{t(`settings_page.${k}_desc`)}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h4 className="text-[13px] font-extrabold text-[#045C9A] dark:text-[#A6D7E8]">{t("settings_page.navigation_guide")}</h4>
              <ul className="mt-2 space-y-1.5">
                {["dashboard", "skills_vault", "vision_board", "community"].map((k) => (
                  <li key={k} className="flex gap-2 text-xs leading-relaxed text-[#35566b] dark:text-slate-400">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                    <span><strong className="font-extrabold text-[#072036] dark:text-white">{t(`settings_page.nav_${k}`)}</strong>{t(`settings_page.nav_${k}_desc`)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className={`rounded-xl px-4 py-3 ${PANEL}`}>
              <p className="text-[12.5px] font-extrabold text-[#072036] dark:text-white">{t("settings_page.need_more_help")}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#35566b] dark:text-slate-400">{t("settings_page.need_more_help_desc")}</p>
            </section>
          </div>
        </div>
      );
    }

    const items = [
      { icon: HelpCircle, title: t("settings_page.faq"), desc: t("settings_page.faq_desc"), go: () => setHelpView("faq") },
      { icon: FileText, title: t("settings_page.documentation"), desc: t("settings_page.documentation_desc"), go: () => setHelpView("docs") },
      { icon: Headset, title: t("settings_page.contact_support"), desc: t("settings_page.contact_support_desc"), go: () => navigate("/dashboard/support") },
      { icon: Bug, title: t("settings_page.report_bug"), desc: t("settings_page.report_bug_desc"), go: () => navigate("/dashboard/support") },
    ];
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <SettingRow key={item.title} icon={item.icon} title={item.title} desc={item.desc} onClick={item.go}>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </SettingRow>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return renderProfile();
      case "notifications": return renderNotifications();
      case "privacy": return renderPrivacy();
      case "customisation": return renderCustomisation();
      case "help": return renderHelp();
      default: return null;
    }
  };

  const showFooter = activeTab === "profile" || activeTab === "customisation";
  const dirty = activeTab === "profile" ? profileDirty : regionDirty;
  const discard = () => (activeTab === "profile" ? setProfileFormData(profileSnapshot) : setLanguageFormData(regionSnapshot));

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
          <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
        </div>

        <main className="relative z-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
            {/* Back button -- mobile only */}
            <div className="flex items-center sm:hidden">
              <button type="button" onClick={() => navigate("/dashboard")} className="group flex w-fit items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:group-hover:border-[#045C9A]/40">
                  <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
                  {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                </span>
              </button>
            </div>

            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={`relative w-full overflow-hidden rounded-2xl ${SURFACE}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
              <div className="relative z-10 flex items-center gap-4 px-6 py-5 sm:px-8 sm:py-6">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] sm:flex">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                    {t("settings.title", "Settings")}
                  </h1>
                  <p className="mt-0.5 max-w-2xl text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                    {t("settings_page.hero_subtitle", "Manage your profile, notifications, security and how the dashboard looks.")}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Layout: nav rail + content */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
              className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[260px_minmax(0,1fr)]"
            >
              <nav id="settings-nav" aria-label={t("settings.title", "Settings")} className={`rounded-2xl p-2 lg:self-start ${SURFACE}`}>
                <div className="flex gap-1 overflow-x-auto lg:flex-col" role="tablist" aria-orientation="vertical">
                  {settingsTabs.map((tab) => {
                    const active = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => { setActiveTab(tab.id); setHelpView("menu"); }}
                        className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors lg:w-full ${
                          active
                            ? "bg-[#072036] text-white dark:bg-[#A6D7E8] dark:text-[#072036]"
                            : "text-[#35566b] hover:bg-[#F1F5F9] hover:text-[#072036] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15 dark:bg-[#072036]/10" : "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="whitespace-nowrap text-[13px] font-bold">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <section className={`flex flex-col rounded-2xl ${SURFACE}`} aria-live="polite">
                <header className="flex items-center gap-3 border-b border-[#d7ebf5] px-5 py-4 dark:border-white/10 sm:px-6">
                  {activeMeta && (
                    <>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                        <activeMeta.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-extrabold leading-tight text-[#072036] dark:text-white">{activeMeta.label}</h2>
                        <p className="text-xs text-[#35566b] dark:text-slate-400">{activeMeta.description}</p>
                      </div>
                    </>
                  )}
                </header>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab + helpView}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-5 sm:px-6"
                  >
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>

                {showFooter && (
                  <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#d7ebf5] px-5 py-3.5 dark:border-white/10 sm:px-6">
                    <p className="text-[11px] text-[#35566b] dark:text-slate-400">
                      {dirty ? t("settings_page.unsaved_changes", "You have unsaved changes.") : t("settings_page.all_saved", "All changes saved.")}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={discard} disabled={!dirty || saving} className={`${BTN_GHOST} px-3.5 py-2 disabled:cursor-not-allowed disabled:opacity-50`}>
                        {t("settings_page.cancel")}
                      </button>
                      <button
                        type="button"
                        id="settings-save"
                        onClick={activeTab === "profile" ? handleSaveProfile : handleSaveLanguage}
                        disabled={saving || !dirty}
                        className={`${BTN_PRIMARY} px-4 py-2`}
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {t("settings_page.save_changes")}
                      </button>
                    </div>
                  </footer>
                )}
              </section>
            </motion.div>
          </div>
        </main>

        <ForgotPasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} initialEmail={user?.email} />
      </div>
    </PageTransition>
  );
};

export default Settings;
