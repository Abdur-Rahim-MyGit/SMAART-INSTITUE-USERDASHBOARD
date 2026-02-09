import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = ({ onLoginClick, onSignupClick, showLinks = true }) => {
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
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#30919D] to-[#1a5f66] rounded-lg flex items-center justify-center shadow-lg shadow-[#30919D]/20 group-hover:shadow-[#30919D]/40 transition-all duration-300">
              <span className="text-white font-heading font-bold text-base sm:text-xl">S</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-sm sm:text-base md:text-lg font-bold tracking-tight leading-none ${scrolled || !showLinks ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                SMAART<span className="text-[#30919D]"> Minds</span>
              </span>
              <span className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mt-0.5 sm:mt-1">
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
                  onClick={() => scrollToSection(item)}
                  className={`text-sm font-medium transition-colors relative group ${scrolled ? 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#30919D] transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-white/10">
                <button
                  onClick={onLoginClick}
                  className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-900 dark:text-white hover:text-[#30919D]' : 'text-gray-900 dark:text-white hover:text-[#30919D]'}`}
                >
                  Log in
                </button>
                <button
                  onClick={onSignupClick}
                  className="px-5 py-2 bg-[#30919D] hover:bg-[#267a84] text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-[#30919D]/20 hover:shadow-[#30919D]/40 hover:-translate-y-0.5"
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
                  className="w-full py-3 bg-[#30919D] text-white rounded-lg font-medium text-center hover:bg-[#267a84] transition-all"
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
