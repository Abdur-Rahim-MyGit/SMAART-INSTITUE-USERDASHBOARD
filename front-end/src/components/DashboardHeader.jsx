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
    <div className="w-full px-6 py-8 sm:px-10 lg:px-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden transition-all duration-300">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-1 bg-[#1a3884] dark:bg-blue-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a3884] dark:text-blue-400">
                SMAART Institute Dashboard
              </span>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight"
              style={{
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              {getPageTitle()}
            </motion.h1>
          </div>

          {/* Optional context label or action could go here */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Current View</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Personalized Learning Path</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-4 top-6 z-40">
        <NotificationBell />
      </div>

      {/* Bottom Silver Line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #C0C0C0, #FFFFFF, #C0C0C0)' }} />
    </div>
  );
};

export default DashboardHeader;

