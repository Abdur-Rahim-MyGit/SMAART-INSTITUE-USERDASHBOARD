import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

import blueLogo from "@/assets/blue.png";
import whiteLogo from "@/assets/white.png";

const Navbar = ({ onLoginClick, onSignupClick, showLinks = true }) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navItems = ["Services", "How It Works", "Testimonials", "FAQ", "Verify Certificate", "Contact"];

  // Use simple scroll listener for state
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavItemClick = (item) => {
    const sectionId = item.toLowerCase().replace(/\s+/g, '-');

    // Special case for Verify Certificate - direct route exists
    // if (item === "Verify Certificate") {
    //   navigate("/verify-certificate");
    //   setMobileMenuOpen(false);
    //   return;
    // }

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
        ? "bg-white/70 dark:bg-[#000F24]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 py-3 shadow-lg shadow-black/5"
        : "bg-transparent border-transparent py-5"
        }`}
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="flex flex-col items-start transition-all duration-300 transform group-hover:scale-105">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-black tracking-tighter text-[#1a3884] dark:text-white leading-none">
                  SMAART
                </span>
                <div className="w-2 h-2 rounded-full bg-[#C0C0C0]" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">
                Institute
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {showLinks && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavItemClick(item)}
                  className={`text-sm font-semibold transition-all duration-300 relative group ${scrolled ? 'text-[#1a3884] dark:text-gray-300 hover:text-[#C0C0C0] dark:hover:text-[#C0C0C0]' : 'text-[#1a3884] dark:text-gray-200 hover:text-[#C0C0C0] dark:hover:text-[#C0C0C0]'}`}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C0C0C0] transition-all duration-300 group-hover:w-full rounded-full" />
                </button>
              ))}
              <div className="flex items-center gap-4 pl-6 border-l border-gray-200 dark:border-white/10">
                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300 mr-2"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-[#1a3884]" />
                  )}
                </button>

                <button
                  onClick={() => onLoginClick ? onLoginClick() : navigate('/?modal=true')}
                  className={`text-sm font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${scrolled ? 'text-[#1a3884] dark:text-white' : 'text-[#1a3884] dark:text-white'}`}
                >
                  Log in
                </button>
                <button
                  onClick={() => handleNavItemClick("contact")}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1a3884] to-[#132c6b] hover:from-[#132c6b] hover:to-[#0d1f4d] text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a3884]/20 hover:shadow-[#1a3884]/40 hover:-translate-y-0.5 border border-[#C0C0C0]/30"
                >
                  Enquiry
                </button>
              </div>
            </div>
          )}

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              ) : (
                <Moon className="w-6 h-6 text-[#1a3884]" />
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
          className="md:hidden bg-white dark:bg-[#000F24] border-t border-gray-100 dark:border-white/10 shadow-xl"
        >
          <div className="container mx-auto px-6 py-6 flex flex-col space-y-4">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => handleNavItemClick(item)}
                className="text-left text-gray-600 dark:text-gray-300 hover:text-[#C0C0C0] dark:hover:text-[#C0C0C0] font-medium py-2 border-b border-gray-50 dark:border-white/5"
              >
                {item}
              </button>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => onLoginClick ? onLoginClick() : navigate('/?modal=true')}
                className="w-full py-3 text-center text-[#1a3884] dark:text-white font-semibold border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => onSignupClick ? onSignupClick() : navigate('/?modal=true')}
                className="w-full py-3 text-center bg-[#1a3884] text-white font-bold rounded-xl hover:bg-[#132c6b] transition-colors shadow-lg shadow-[#1a3884]/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;

