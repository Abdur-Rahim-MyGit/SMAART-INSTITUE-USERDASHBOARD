import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstitutionSelector from "@/components/InstitutionSelector"; // We might need to adapt this or use a simplified version

import blueLogo from "@/assets/blue.png";
import whiteLogo from "@/assets/white.png";

const LandingNavbar = ({ onLoginClick, onSignupClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Services", href: "#services" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (id) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "backdrop-blur-md shadow-lg py-3"
        : "bg-transparent py-5"
        }`}
      style={isScrolled ? { backgroundColor: 'rgba(8, 30, 53, 0.9)' } : {}}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo Lockup */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex flex-col items-start transition-all duration-300 transform group-hover:scale-105">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tighter text-white leading-none drop-shadow-md">
                SMAART
              </span>
              <div className="w-2 h-2 rounded-full bg-[#C0C0C0] shadow-lg" />
            </div>
            <span className="text-[11px] font-bold text-[#C0C0C0] uppercase tracking-[0.3em] ml-0.5 opacity-90">
              Institute
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: '#F0F0F2' }}
              >
                {link.name}
              </button>
            ))}
          </div>

          <div className="h-6 w-px" style={{ backgroundColor: 'rgba(192, 192, 192, 0.5)' }} />

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="hover:bg-white/10"
              style={{ color: '#F0F0F2' }}
              onClick={onLoginClick}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button
              className="text-white font-semibold shadow-lg"
              style={{ backgroundColor: '#1a3884', boxShadow: '0 10px 15px -3px rgba(26, 56, 132, 0.4)', border: '1px solid #C0C0C0' }}
              onClick={onSignupClick}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{ backgroundColor: '#002147', borderTop: '1px solid #C0C0C0' }}
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="text-left py-2 font-medium hover:opacity-80"
                  style={{ color: '#F0F0F2' }}
                >
                  {link.name}
                </button>
              ))}
              <hr style={{ borderColor: '#C0C0C0' }} className="my-2" />
              <Button
                variant="ghost"
                className="justify-start hover:bg-white/10"
                style={{ color: '#F0F0F2' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button
                className="text-white justify-start"
                style={{ backgroundColor: '#1a3884', border: '1px solid #C0C0C0' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignupClick();
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default LandingNavbar;


