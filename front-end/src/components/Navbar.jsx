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
    if (item === "Verify Certificate") {
      navigate("/verify-certificate");
      setMobileMenuOpen(false);
      return;
    }

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
            <div className="h-14 sm:h-16 w-auto flex items-center justify-center transition-all duration-300 transform group-hover:scale-105">
              <img
                src={theme === 'dark' ? whiteLogo : blueLogo}
                alt="SMAART Institute"
                className="h-full w-auto object-contain"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          {showLinks && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavItemClick(item)}
                  className={`text-sm font-semibold transition-all duration-300 relative group ${scrolled ? 'text-[#1a3884] dark:text-gray-300 hover:text-[#daa520] dark:hover:text-[#daa520]' : 'text-[#1a3884] dark:text-gray-200 hover:text-[#daa520] dark:hover:text-[#daa520]'}`}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#daa520] transition-all duration-300 group-hover:w-full rounded-full" />
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
                  onClick={() => onSignupClick ? onSignupClick() : navigate('/?modal=true')}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1a3884] to-[#267d87] hover:from-[#132c6b] hover:to-[#1e6169] text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a3884]/20 hover:shadow-[#1a3884]/40 hover:-translate-y-0.5 border border-[#daa520]/30"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {showLinks && (
            <button
              className="md:hidden p-2 text-gray-600 dark:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          )}
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
                className="text-left text-gray-600 dark:text-gray-300 hover:text-[#daa520] dark:hover:text-[#daa520] font-medium py-2 border-b border-gray-50 dark:border-white/5"
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
