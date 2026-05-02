import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Bell, Settings, Search, Command, Clock, Sun, Moon } from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import useUser from "@/hooks/useUser";
import { getBackendUrl } from "@/services/api";

// Page title mapping
const pageTitles = {
  '/dashboard': 'Home',
  '/dashboard/home': 'Home',
  '/dashboard/courses': 'My Courses',
  '/my-courses': 'My Courses',
  '/dashboard/assessment-centre': 'Assessments',
  '/dashboard/assessments': 'Assessments',
  '/dashboard/assessments/baseline': 'Base Line Test',
  '/dashboard/smaart-wallet': 'Skills Vault',
  '/dashboard/skills-passport': 'Skills Passport',
  '/skills-passport': 'Skills Passport',
  '/dashboard/vision-boards': 'Vision Board',
  '/vision-board': 'Vision Board',
  '/vision-board-pro/gallery': 'Vision Board Gallery',
  '/vision-board-pro/create': 'Vision Board Editor',
  '/vision-board/view/:id': 'Vision Board',
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
  'skills-vault': { label: 'Skills Vault', path: '/dashboard/smaart-wallet' },
  'skills-passport': { label: 'Skills Passport', path: '/dashboard/skills-passport' },
  'vision-boards': { label: 'Vision Board', path: '/dashboard/vision-boards' },
  'smaart-toolkit': { label: 'Tool Kit', path: '/dashboard/smaart-toolkit' },
  'community': { label: 'Community', path: '/dashboard/community' },
  'settings': { label: 'Settings', path: '/dashboard/settings' },
  'support': { label: 'Help & Support', path: '/dashboard/support' },
  'notifications': { label: 'Notifications', path: '/notifications' },
  'profile': { label: 'Profile', path: '/profile' },
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCollegeLogo, setShowCollegeLogo] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Fetch profile photo from Registration API
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch(`${API_BASE_URL}/users/register-details/${user.email}`);
        if (response.ok) {
          const data = await response.json();
          // Check for profilePhoto at root level first (new structure), then fallback to otherDetails
          const photoUrl = data.profilePhoto || data.otherDetails?.profilePhoto || user?.profilePicture;
          if (photoUrl) {
            // If it's already a full URL (Cloudinary), use it directly; otherwise prepend backend URL
            const fullUrl = photoUrl.startsWith('http') ? photoUrl : `${getBackendUrl()}/${photoUrl}`;
            setProfilePhoto(fullUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    };

    fetchProfilePhoto();
  }, [user?.email, user?.profilePicture]);

  // Toggle college logo every 5 seconds if user has a college logo
  useEffect(() => {
    if (!user?.college?.logo) return;

    const interval = setInterval(() => {
      setShowCollegeLogo(prev => !prev);
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.college?.logo]);

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
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between px-6 sm:px-10 lg:px-12 h-20">
            {/* Left: Breadcrumbs & Page Title */}
            <div className="flex flex-col">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2.5 text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mb-1">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors"
                >
                  Dashboard
                </button>
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                <span className="text-slate-600 dark:text-slate-300">
                  {pageTitle}
                </span>
              </nav>

              {/* Page Title */}
              <motion.div
                key={pageTitle}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="flex items-center gap-3"
              >
                <div className="w-1.5 h-6 bg-[#1a3884] dark:bg-blue-500 rounded-full hidden sm:block" />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                  {pageTitle}
                </h1>
              </motion.div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 lg:gap-5">
              {/* Time Display - Desktop */}
              <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 font-mono">
                  {formatTime(currentTime)}
                </span>
              </div>

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => navigate('/notifications')}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></span>
                </button>

                <button
                  onClick={() => navigate('/dashboard/settings')}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Section */}
              <div 
                className="flex items-center gap-4 pl-5 border-l border-slate-200 dark:border-slate-700 cursor-pointer group"
                onClick={() => navigate('/profile')}
              >
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                    {getGreeting()}
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors">
                    {user?.firstName || user?.fullName?.split(' ')[0] || 'User'}
                  </p>
                </div>
                
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {showCollegeLogo && user?.college?.logo ? (
                      <img
                        src={user.college.logo.startsWith('http') ? user.college.logo : `${API_BASE_URL.replace('/api', '')}/${user.college.logo}`}
                        alt={user.college.collegeName || "College Logo"}
                        className="w-11 h-11 rounded-xl object-contain bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-1 group-hover:border-[#1a3884] transition-all shadow-md"
                        onError={() => setShowCollegeLogo(false)}
                      />
                    ) : profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt={user?.fullName || 'User'}
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-[#1a3884] transition-all shadow-md"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a3884] to-[#112b6b] flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-lg group-hover:shadow-[#1a3884]/20 transition-all">
                        <span className="text-white text-base font-bold">
                          {(user?.firstName?.[0] || user?.fullName?.[0] || 'U').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>
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
