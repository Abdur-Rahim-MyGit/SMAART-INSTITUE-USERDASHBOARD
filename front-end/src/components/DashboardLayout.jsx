import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Bell, Settings, Search, Command, Clock } from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import useUser from "@/hooks/useUser";

// Page title mapping
const pageTitles = {
  '/dashboard': 'Home',
  '/dashboard/home': 'Home',
  '/dashboard/courses': 'My Courses',
  '/my-courses': 'My Courses',
  '/dashboard/assessment-centre': 'Assessments',
  '/dashboard/assessments': 'Assessments',
  '/dashboard/assessments/baseline': 'Base Line Test',
  '/dashboard/skills-vault': 'Skills Vault',
  '/dashboard/skills-passport': 'Skills Passport',
  '/skills-passport': 'Skills Passport',
  '/dashboard/vision-boards': 'Vision Board',
  '/vision-board': 'Vision Board',
  '/vision-board-pro/gallery': 'Vision Board',
  '/dashboard/smaart-toolkit': 'Tool Kit',
  '/smaart-toolkit': 'Tool Kit',
  '/dashboard/community': 'Community',
  '/community': 'Community',
  '/dashboard/settings': 'Settings',
  '/settings': 'Settings',
  '/dashboard/support': 'Help & Support',
  '/tickets': 'Help & Support',
  '/dashboard/notifications': 'Notifications',
  '/notifications': 'Notifications',
  '/dashboard/profile': 'Profile',
  '/profile': 'Profile',
  '/dashboard/notes': 'My Notes',
  '/dashboard/library': 'Library',
  '/library': 'Library',
  '/dashboard/dictionary': 'Dictionary',
  '/dictionary': 'Dictionary',
  '/dashboard/mindcare-sessions': 'MindCare',
  '/mind-care': 'MindCare',
  '/dashboard/performance': 'Performance',
  '/dashboard/certificate': 'Certificates',
  '/certificate': 'Certificates',
  '/dashboard/smaart-wallet': 'SMAART Wallet',
  '/smaart-wallet': 'SMAART Wallet',
  '/dashboard/add-details': 'Add Details',
  '/add-details': 'Add Details',
  '/dashboard/groups': 'Student Groups',
  '/dashboard/groups/:id': 'Group Chat',
  '/dashboard/quotients-grid': 'Quotients Grid',
  '/quotients': 'Quotients Grid',
  '/dashboard/profile-analysis': 'AI Profile Analysis',
  '/dashboard/resume-builder': 'Resume Builder',
  '/dashboard/career-data-fetcher': 'Career Data',
};

// Breadcrumb mapping
const breadcrumbMap = {
  'dashboard': { label: 'Dashboard', path: '/dashboard' },
  'courses': { label: 'My Courses', path: '/dashboard/courses' },
  'assessment-centre': { label: 'Assessments', path: '/dashboard/assessment-centre' },
  'skills-vault': { label: 'Skills Vault', path: '/dashboard/skills-vault' },
  'skills-passport': { label: 'Skills Passport', path: '/dashboard/skills-passport' },
  'vision-boards': { label: 'Vision Board', path: '/dashboard/vision-boards' },
  'smaart-toolkit': { label: 'Tool Kit', path: '/dashboard/smaart-toolkit' },
  'community': { label: 'Community', path: '/dashboard/community' },
  'settings': { label: 'Settings', path: '/dashboard/settings' },
  'support': { label: 'Help & Support', path: '/dashboard/support' },
  'notifications': { label: 'Notifications', path: '/notifications' },
  'profile': { label: 'Profile', path: '/profile' },
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { theme } = useTheme();
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get page title
  const getPageTitle = () => {
    return pageTitles[location.pathname] || 'Dashboard';
  };

  // Generate breadcrumbs from path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    paths.forEach((path, index) => {
      const mapped = breadcrumbMap[path];
      if (mapped) {
        breadcrumbs.push({
          ...mapped,
          isLast: index === paths.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Could trigger global search here
        console.log('Search shortcut triggered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle();

  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300`}>
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 min-h-screen ${
          isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* Left: Breadcrumbs & Page Title */}
            <div className="flex flex-col">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors font-medium"
                >
                  Dashboard
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {pageTitle}
                </span>
              </nav>

              {/* Page Title */}
              <motion.h1
                key={pageTitle}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mt-0.5"
              >
                {pageTitle}
              </motion.h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Time Display - Desktop */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg mr-2">
                <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {formatTime(currentTime)}
                </span>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

              {/* Settings Button */}
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Notification Button */}
              <button
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile Section */}
              <div className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {getGreeting()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.firstName || user?.fullName?.split(' ')[0] || 'User'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="relative"
                  aria-label="Profile"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.fullName || 'User'}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-[#1a3884] dark:hover:ring-blue-400 transition-all"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#1a3884] flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-[#1a3884] dark:hover:ring-blue-400 transition-all">
                      <span className="text-white text-sm font-semibold">
                        {(user?.firstName?.[0] || user?.fullName?.[0] || 'U').toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="max-w-[1600px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
