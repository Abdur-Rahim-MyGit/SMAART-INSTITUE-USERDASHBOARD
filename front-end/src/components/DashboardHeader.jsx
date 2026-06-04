import { motion } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";
import { useLocation } from "react-router-dom";

const DashboardHeader = () => {
  const location = useLocation();
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
      '/dashboard/skills-vault': 'Skills Vault',
      '/skills-vault': 'Skills Vault',
    };
    return titleMap[path] || 'Dashboard';
  };

  return (
    <div className="w-full px-6 py-4 sm:px-8 lg:px-10 bg-white dark:bg-[#00152E] border-b border-[#d8e6f7] dark:border-white/5 relative z-40 transition-colors duration-300 shadow-sm dark:shadow-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a3884] dark:text-blue-400">
              SMAART Institute
            </span>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[20px] font-bold leading-tight tracking-tight text-[#0d1f4e] dark:text-white"
          >
            {getPageTitle()}
          </motion.h1>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

