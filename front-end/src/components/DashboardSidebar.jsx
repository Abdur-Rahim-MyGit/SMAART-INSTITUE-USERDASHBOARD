import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  BookOpen,
  Grid3x3,
  Award,
  Menu,
  X,
  Lightbulb,
  Zap,
  Users,
  Home,
  Settings,
  HelpCircle,
  Bell,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";
import InteractiveMenu from "@/components/InteractiveMenu";
import ChatbotModal from "@/components/ChatbotModal";

const menuItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "My Courses", path: "/dashboard/courses" },
  { icon: Lightbulb, label: "Vision Boards", path: "/dashboard/vision-boards" },
  { icon: Zap, label: "SMAART Toolkit", path: "/dashboard/smaart-toolkit" },
  { icon: Award, label: "My Certificate", path: "/dashboard/certificate" },
  { icon: ShieldCheck, label: "Verify Certificate", path: "/verify-certificate" },
];


const bottomMenuItems = [
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help" }, // No path - opens chatbot modal
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMobileOpen]);

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#002147]/90 backdrop-blur-2xl border-b border-gray-100/50 dark:border-white/10 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all duration-300">
        <div className="flex items-center justify-between px-6 lg:px-10 h-16">
          {/* Left: Logo, Skills Passport & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#002147] to-[#30919D] shadow-[0_4px_15px_-3px_rgba(48,145,157,0.4)] group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <span className="font-bold text-lg text-white">S</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-[#002147] dark:text-white hidden md:block">
                SMAART<span className="text-[#30919D]"> Minds</span>
              </span>
            </Link>
          </div>

          {/* Center: Interactive Menu (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <InteractiveMenu />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">

            {/* Notification Badge */}
            <button className="p-2 mr-1 rounded-full text-gray-400 hover:text-[#30919D] hover:bg-[#30919D]/5 transition-all relative group/nav">
              <Bell className="w-5 h-5 group-hover/nav:animate-bounce" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#002147] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </button>

            {/* Profile */}
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar - Slide from left */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-screen w-[280px] flex flex-col z-50 lg:hidden bg-white border-r border-gray-100 shadow-2xl"
          >
            {/* Mobile Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#30919D]">
                  <span className="font-bold text-base text-white">S</span>
                </div>
                <span className="font-bold text-lg text-[#002147]">
                  SMAART<span className="text-[#30919D]">Minds</span>
                </span>
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
              <div className="space-y-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                          ? 'bg-[#30919D] text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#30919D]'}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Skills Passport */}
            <div className="p-3 border-t border-gray-100">
              <Link
                to="/dashboard/skills-passport"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #daa520 0%, #b8860b 50%, #daa520 100%)',
                }}
              >
                <Award className="w-5 h-5 text-[#002147]" />
                <span className="font-bold text-[#002147]">Skills Passport</span>
              </Link>
            </div>

            {/* Mobile Bottom */}
            <div className="p-3 space-y-1 border-t border-gray-100 bg-gray-50">
              {bottomMenuItems.map((item) => {
                const Icon = item.icon;
                const isHelpButton = item.label === 'Help';

                if (isHelpButton) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsMobileOpen(false);
                        setIsChatbotOpen(true);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-white hover:text-gray-700 transition-all w-full"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-white hover:text-gray-700 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onEscalateToTicket={(conversationId, messages) => {
          // Navigate to support tickets page with conversation data
          navigate('/dashboard/support', {
            state: { conversationId, messages }
          });
        }}
      />
    </>
  );
};

export default DashboardSidebar;
