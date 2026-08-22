import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import smaartLogoNavy from "@/assets/smaart-logo-navy.svg";
import smaartLogoWhite from "@/assets/smaart-logo-white.svg";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { IconSun, IconMoon, IconWorld } from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

import blueLogo from "@/assets/blue.png";
import whiteLogo from "@/assets/white.png";

const Navbar = ({ onLoginClick, onSignupClick, showLinks = true }) => {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const languageRef = useRef(null);

  const languageOptions = [
    { code: 'en', name: 'English', native: 'English', shortLabel: 'EN' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', shortLabel: 'HI' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', shortLabel: 'TA' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', shortLabel: 'TE' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', shortLabel: 'KN' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', shortLabel: 'ML' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', shortLabel: 'PA' },
    { code: 'ur', name: 'Urdu', native: 'اردو', shortLabel: 'UR' },
    { code: 'fr', name: 'French', native: 'Français', shortLabel: 'FR' },
    { code: 'ar', name: 'Arabic', native: 'العربية', shortLabel: 'AR' }
  ];

  const activeLanguageCode = i18n.language || 'en';
  const activeLanguage = languageOptions.find(lang => lang.code === activeLanguageCode) || languageOptions[0];

  const getInstituteLabel = () => {
    switch (activeLanguageCode) {
      case 'fr': return "Institut";
      case 'hi': return "संस्थान";
      case 'ta': return "நிறுவனம்";
      case 'te': return "సంస్థ";
      case 'kn': return "ಸಂಸ್ಥೆ";
      case 'ml': return "സ്ഥാപനം";
      case 'pa': return "ਸੰਸਥਾ";
      case 'ur': return "ادارہ";
      case 'ar': return "معهد";
      default: return "Institute";
    }
  };

  const navItems = [
    { key: "Services", label: t("landing.navbar.services", "Services") },
    { key: "How It Works", label: t("landing.navbar.how_it_works", "How It Works") },
    { key: "Pricing", label: t("landing.navbar.pricing", "Pricing") },
    { key: "Verify Certificate", label: t("landing.navbar.verify_certificate", "Verify Certificate") },
    { key: "FAQ", label: t("landing.navbar.faq", "FAQ") },
    { key: "Contact", label: t("landing.navbar.contact", "Contact") }
  ];

  // Use simple scroll listener for state
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside language selector dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguages(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavItemClick = (itemKey) => {
    const sectionId = itemKey.toLowerCase().replace(/\s+/g, '-');

    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    } else {
      // Navigate to landing page with anchor
      navigate(`/#${sectionId}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !showLinks
        ? "bg-white/70 dark:bg-[#00152E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 py-3 shadow-lg shadow-black/5"
        : "bg-transparent border-transparent py-5"
        }`}
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            {/* Same SMAART logo as the dashboard sidebar */}
            <img src={smaartLogoNavy} alt="SMAART Institute" className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:hidden" />
            <img src={smaartLogoWhite} alt="SMAART Institute" className="hidden h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:block" />
          </Link>

          {/* Desktop Navigation */}
          {showLinks && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavItemClick(item.key)}
                  className={`text-sm font-semibold transition-all duration-300 relative group ${scrolled ? 'text-[#1a3884] dark:text-slate-200 hover:text-[#C0C0C0] dark:hover:text-[#C0C0C0]' : 'text-[#1a3884] dark:text-slate-100 hover:text-[#C0C0C0] dark:hover:text-[#C0C0C0]'}`}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C0C0C0] transition-all duration-300 group-hover:w-full rounded-full" />
                </button>
              ))}
              <div className="flex items-center gap-4 pl-6 border-l border-gray-200 dark:border-white/10">
                {/* Theme Toggle */}
                <button
                  onClick={(e) => setTheme(theme === 'dark' ? 'light' : 'dark', e)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-slate-200"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <IconSun stroke={1.5} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <IconMoon stroke={1.5} className="w-5 h-5 text-[#1a3884]" />
                  )}
                </button>

                {/* Language Switcher */}
                <div className="relative" ref={languageRef}>
                  <button
                    onClick={() => setShowLanguages(!showLanguages)}
                    className="flex items-center gap-1.5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-[#1a3884] dark:text-slate-200"
                    aria-label="Select Language"
                  >
                    <IconWorld stroke={1.5} className="w-5 h-5 hover:rotate-[15deg] transition-transform duration-300" />
                    <span className="text-xs font-bold tracking-wider mt-[1px]">
                      {activeLanguage.shortLabel}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLanguages ? 'rotate-180 text-[#C0C0C0]' : 'text-[#1a3884]/60 dark:text-slate-400'}`} />
                  </button>

                  <AnimatePresence>
                    {showLanguages && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-[#002147] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-50"
                      >
                        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            Language
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-[#1a3884] dark:text-slate-200">
                            {activeLanguage.name}
                          </p>
                        </div>
                        <div className="p-2 space-y-1">
                          {languageOptions.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                i18n.changeLanguage(lang.code);
                                setShowLanguages(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${activeLanguageCode === lang.code
                                ? 'bg-[#1a3884] text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[9px] font-black tracking-wider ${activeLanguageCode === lang.code ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/8 dark:text-slate-300'}`}>
                                  {lang.shortLabel}
                                </span>
                                <span>{lang.name}</span>
                              </div>
                              <span className="text-[9px] opacity-60 font-bold">{lang.native}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <a
                  href={`${import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000'}/employer/register`}
                  className={`text-sm font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${scrolled ? 'text-[#1a3884] dark:text-white' : 'text-[#1a3884] dark:text-white'}`}
                >
                  For Employers
                </a>
                <button
                  onClick={() => onLoginClick ? onLoginClick() : navigate('/?modal=true')}
                  className={`text-sm font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${scrolled ? 'text-[#1a3884] dark:text-white' : 'text-[#1a3884] dark:text-white'}`}
                >
                  {t("landing.navbar.login")}
                </button>
                <button
                  onClick={() => handleNavItemClick("Contact")}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1a3884] to-[#132c6b] hover:from-[#132c6b] hover:to-[#0d1f4d] text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a3884]/20 hover:shadow-[#1a3884]/40 hover:-translate-y-0.5 border border-[#C0C0C0]/30"
                >
                  {t("landing.navbar.enquiry")}
                </button>
              </div>
            </div>
          )}

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={(e) => setTheme(theme === 'dark' ? 'light' : 'dark', e)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-slate-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <IconSun stroke={1.5} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              ) : (
                <IconMoon stroke={1.5} className="w-6 h-6 text-[#1a3884]" />
              )}
            </button>

            {showLinks && (
              <button
                className="p-2 rounded-lg text-[#1a3884] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && showLinks && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white dark:bg-[#00152E] border-t border-gray-100 dark:border-white/8 shadow-xl"
        >
          <div className="container mx-auto px-6 py-6 flex flex-col space-y-4">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavItemClick(item.key)}
                className="text-left text-gray-600 dark:text-slate-200 hover:text-[#C0C0C0] dark:hover:text-[#C0C0C0] font-medium py-2 border-b border-gray-50 dark:border-white/5"
              >
                {item.label}
              </button>
            ))}

            {/* Mobile Language Selector */}
            <div className="pt-2 pb-1 border-b border-gray-50 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Language / भाषा / மொழி / తెలుగు / ಕನ್ನಡ / മലയാളം / ਪੰਜਾਬੀ / زبان / Langue
              </span>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeLanguageCode === lang.code
                        ? 'bg-[#1a3884] text-white'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                    }`}
                  >
                    <span>{lang.shortLabel}</span>
                    <span className="opacity-70 text-[9px] font-bold">{lang.native}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <a
                href="http://localhost:3000/employer/register"
                className="w-full py-3 text-center text-[#1a3884] dark:text-white font-semibold border border-gray-200 dark:border-white/10 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
              >
                For Employers
              </a>
              <button
                onClick={() => onLoginClick ? onLoginClick() : navigate('/?modal=true')}
                className="w-full py-3 text-center text-[#1a3884] dark:text-white font-semibold border border-gray-200 dark:border-white/10 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
              >
                {t("landing.navbar.login")}
              </button>
              <button
                onClick={() => onSignupClick ? onSignupClick() : navigate('/?modal=true')}
                className="w-full py-3 text-center bg-[#1a3884] text-white font-bold rounded-xl hover:bg-[#132c6b] transition-colors shadow-lg shadow-[#1a3884]/20"
              >
                {t("landing.hero.get_started")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
