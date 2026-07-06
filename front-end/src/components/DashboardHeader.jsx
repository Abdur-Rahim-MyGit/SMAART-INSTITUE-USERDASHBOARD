import { motion } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const DashboardHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  // Map routes to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      '/dashboard': t('dashboard.home', 'Home'),
      '/dashboard/home': t('dashboard.home', 'Home'),
      '/dashboard/courses': t('sidebar.courses', 'My Courses'),
      '/my-courses': t('sidebar.courses', 'My Courses'),
      '/dashboard/assessment-centre': t('sidebar.assessments', 'Assessments'),
      '/dashboard/assessments/baseline': t('my_assessments.baseline_title', 'Base Line Test'),
      '/dashboard/community': t('sidebar.community', 'Community'),
      '/community': t('sidebar.community', 'Community'),
      '/dashboard/profile': t('sidebar.profile', 'Profile'),
      '/profile': t('sidebar.profile', 'Profile'),
      '/dashboard/settings': t('sidebar.settings', 'Settings'),
      '/settings': t('sidebar.settings', 'Settings'),
      '/dashboard/vision-boards': t('sidebar.vision_board', 'Vision Boards'),
      '/vision-board': t('sidebar.vision_board', 'Vision Boards'),
      '/vision-board-pro/gallery': t('sidebar.vision_board_gallery', 'Vision Boards'),
      '/dashboard/mindcare-sessions': t('sidebar.mindcare_sessions', 'MindCare Sessions'),
      '/mind-care': t('sidebar.mindcare_sessions', 'MindCare Sessions'),
      '/dashboard/library': t('sidebar.library', 'Library'),
      '/library': t('sidebar.library', 'Library'),
      '/dashboard/dictionary': t('sidebar.dictionary', 'General Dictionary'),
      '/dictionary': t('sidebar.dictionary', 'General Dictionary'),
      '/dashboard/smaart-toolkit': t('sidebar.toolkit', 'SMAART Toolkit'),
      '/smaart-toolkit': t('sidebar.toolkit', 'SMAART Toolkit'),
      '/dashboard/escalation': t('sidebar.escalation', 'Escalation'),
      '/dashboard/skills-passport': t('sidebar.skills_passport', 'Skills Passport'),
      '/skills-passport': t('sidebar.skills_passport', 'Skills Passport'),
      '/dashboard/quotients-grid': t('sidebar.quotients_grid', 'Quotients Grid'),
      '/quotients': t('sidebar.quotients_grid', 'Quotients Grid'),
      '/dashboard/notes': t('sidebar.notes', 'My Notes'),
      '/dashboard/notifications': t('sidebar.notifications', 'Notifications'),
      '/notifications': t('sidebar.notifications', 'Notifications'),
      '/dashboard/support': t('sidebar.help', 'Support Tickets'),
      '/tickets': t('sidebar.help', 'Support Tickets'),
      '/dashboard/add-details': t('sidebar.add_details', 'Add Details'),
      '/add-details': t('sidebar.add_details', 'Add Details'),
      '/dashboard/skills-vault': t('sidebar.skills_vault', 'Skills Vault'),
      '/skills-vault': t('sidebar.skills_vault', 'Skills Vault'),
    };
    return titleMap[path] || t('sidebar.dashboard', 'Dashboard');
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

