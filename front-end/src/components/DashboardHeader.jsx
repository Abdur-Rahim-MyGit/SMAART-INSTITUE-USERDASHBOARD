import { motion } from "framer-motion";
import { Bell, Settings, Search, ChevronRight, Command } from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Link, useLocation, useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map routes to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      '/dashboard': 'Home',
      '/dashboard/home': 'Home',
      '/dashboard/courses': 'My Courses',
      '/my-courses': 'My Courses',
      '/dashboard/assessment-centre': 'Assessments',
      '/dashboard/assessments/baseline': 'Base Line Test',
      '/dashboard/community': 'Community',
      '/community': 'Community',
      '/dashboard/profile': 'Profile',
      '/profile': 'Profile',
      '/dashboard/settings': 'Settings',
      '/settings': 'Settings',
      '/dashboard/vision-boards': 'Vision Boards',
      '/vision-board': 'Vision Boards',
      '/vision-board-pro/gallery': 'Vision Boards',
      '/dashboard/mindcare-sessions': 'MindCare Sessions',
      '/mind-care': 'MindCare Sessions',
      '/dashboard/library': 'Library',
      '/library': 'Library',
      '/dashboard/dictionary': 'General Dictionary',
      '/dictionary': 'General Dictionary',
      '/dashboard/smaart-toolkit': 'SMAART Toolkit',
      '/smaart-toolkit': 'SMAART Toolkit',
      '/dashboard/escalation': 'Escalation',
      '/dashboard/skills-passport': 'Skills Passport',
      '/skills-passport': 'Skills Passport',
      '/dashboard/quotients-grid': 'Quotients Grid',
      '/quotients': 'Quotients Grid',
      '/dashboard/notes': 'My Notes',
      '/dashboard/notifications': 'Notifications',
      '/notifications': 'Notifications',
      '/dashboard/support': 'Support Tickets',
      '/tickets': 'Support Tickets',
      '/dashboard/add-details': 'Add Details',
      '/add-details': 'Add Details',
      '/dashboard/smaart-wallet': 'SMAART Wallet',
      '/smaart-wallet': 'SMAART Wallet',
    };
    return titleMap[path] || 'Dashboard';
  };

  return (
    <div className="w-full relative z-30">
      {/* Top Gold Line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #c9a84c, #daa520, #c9a84c)' }} />

      {/* Blue Header Bar */}
      <div style={{
        background: '#1a3884',
        padding: '24px 0 20px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl lg:text-4xl"
          style={{
            color: '#ffffff',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontWeight: '700',
            letterSpacing: 'min(8px, 2vw)',
            textTransform: 'uppercase',
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0 20px'
          }}
        >
          {getPageTitle()}
        </motion.h1>
      </div>

      {/* Bottom Gold Line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #c9a84c, #daa520, #c9a84c)' }} />
    </div>
  );
};

export default DashboardHeader;
