import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

import blueLogo from "@/assets/blue.png";
import whiteLogo from "@/assets/white.png";

const Navbar = ({ onLoginClick, onSignupClick, showLinks = true }) => {
  const { theme } = useTheme();
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

  const scrollToSection = (sectionId) => {
    // Convert "How It Works" to "how-it-works" format
    const id = sectionId.toLowerCase().replace(/\s+/g, '-');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled || !showLinks
        ? "bg-white/90 dark:bg-[#002147]/90 backdrop-blur-md border-gray-200 dark:border-white/5 py-2 shadow-sm"
        : "bg-transparent border-transparent py-4"
        }`}
    >
      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="h-14 sm:h-16 w-auto flex items-center justify-center transition-all duration-300">
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
                  onClick={() => scrollToSection(item)}
                  className={`text-sm font-medium transition-colors relative group ${scrolled ? 'text-[#1a3884] hover:text-[#daa520] dark:text-gray-300 dark:hover:text-[#daa520]' : 'text-[#1a3884] hover:text-[#daa520] dark:text-gray-300 dark:hover:text-[#daa520]'}`}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#daa520] transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-white/10">
                <button
                  onClick={onLoginClick}
                  className={`text-sm font-medium transition-colors ${scrolled ? 'text-[#1a3884] dark:text-white hover:text-[#daa520]' : 'text-[#1a3884] dark:text-white hover:text-[#daa520]'}`}
                >
                  Log in
                </button>
                <button
                  onClick={onSignupClick}
                  className="px-5 py-2 bg-[#1a3884] hover:bg-[#122c6d] text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-[#1a3884]/20 hover:shadow-[#1a3884]/40 hover:-translate-y-0.5 border border-[#daa520]"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {showLinks && (
            <button
              className={`md:hidden p-2 transition-colors ${scrolled ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {showLinks && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden pt-4 pb-4 bg-[#002147] border-t border-white/10 mt-4 rounded-b-2xl shadow-xl"
          >
            <div className="flex flex-col space-y-4 px-4">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="text-left py-2 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  {item}
                </button>
              ))}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <button
                  onClick={onLoginClick}
                  className="w-full py-2 text-center text-gray-300 hover:text-white font-medium"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignupClick && onSignupClick();
                  }}
                  className="w-full py-3 bg-[#1a3884] text-white rounded-lg font-medium text-center hover:bg-[#122c6d] transition-all border border-[#daa520]"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
