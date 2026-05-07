import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, Bell, Settings, Search, Command, Clock, Sun, Moon, Info, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import LeftSidebar from "./LeftSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import useUser from "@/hooks/useUser";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL, getBackendUrl } from "@/services/api";
import useSessionGuard from "@/hooks/useSessionGuard";
import SessionExpiryWarning from "@/components/SessionExpiryWarning";

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
  '/dashboard/skills-vault': 'Skills Vault',
  '/skills-vault': 'Skills Vault',
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
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { user, loading: userLoading, logout } = useUser();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCollegeLogo, setShowCollegeLogo] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // === AUTH PROTECTION ===
  useEffect(() => {
    const hasToken = sessionStorage.getItem('token');
    if (!userLoading && !user && !hasToken) {
      console.warn('[DashboardLayout] No session found, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [user, userLoading, navigate]);

  // === SESSION GUARD: 3-hour expiry monitoring ===
  const handleSessionExpired = () => {
    logout();
    navigate('/', { replace: true, state: { sessionExpired: true } });
  };
  const { showWarning, secondsLeft, dismissWarning } = useSessionGuard(handleSessionExpired);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          // Check for profilePhoto at root level first (new structure), then fallback to otherDetails or user object
          const photoUrl = data.profilePhoto || data.otherDetails?.profilePhoto || user?.profileImage || user?.profilePicture;
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
    return pageTitles[location.pathname] || t('sidebar.dashboard');
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
      {/* Session Expiry Warning Modal */}
      <SessionExpiryWarning
        isVisible={showWarning}
        secondsLeft={secondsLeft}
        onDismiss={dismissWarning}
      />

      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 min-h-screen ${
          isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Top Header Bar - Premium AI SaaS Style */}
        <header className="sticky top-0 z-40 pt-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          <div className="flex items-center justify-between px-6 md:px-8 h-[80px] max-w-[1600px] mx-auto">
            
            {/* LEFT SECTION: Page Title & Breadcrumb */}
            <div className="flex flex-col shrink-0">
              {/* Subtle Breadcrumb */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 opacity-60">
                {(location.pathname === '/dashboard' || location.pathname === '/dashboard/') && (
                  <>
                    <span>SMAART</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </>
                )}
                <span>Dashboard</span>
              </div>
              
              <div className="flex items-center gap-3.5">
                {/* Primary Accent Bar */}
                <div className="w-1.5 h-7 bg-[#1a3884] dark:bg-blue-500 rounded-full shadow-[0_0_8px_rgba(26,56,132,0.15)]" />
                <motion.h1 
                  key={pageTitle}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl md:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}
                >
                  {pageTitle}
                </motion.h1>
              </div>
            </div>

            {/* CENTER SECTION: Premium Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-[480px] mx-10">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#1a3884] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search courses, skills, insights..."
                  className="block w-full pl-11 pr-14 py-2.5 bg-[#F1F5F9] dark:bg-slate-800/40 border border-transparent focus:border-[#1a3884]/30 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1a3884]/5 transition-all shadow-inner"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-bold text-slate-400 bg-white/80 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50 shadow-sm">
                    <Command className="w-2.5 h-2.5" />
                    <span>K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION: Grouped Actions */}
            <div className="flex items-center gap-5">
              
              {/* 1. Live Time Widget */}
              <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/20 border border-slate-100 dark:border-slate-700/50 rounded-full shadow-sm">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 font-mono tracking-tight">
                  {formatTime(currentTime)}
                </span>
              </div>

              {/* 2. Icon Group Container */}
              <div className="flex items-center gap-1 p-1 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30 rounded-2xl">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl text-slate-500 hover:text-[#1a3884] hover:bg-white dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-xl transition-all hover:scale-105 active:scale-95 group ${
                      showNotifications ? 'bg-white dark:bg-slate-700 text-[#1a3884]' : 'text-slate-500 hover:text-[#1a3884] hover:bg-white dark:hover:bg-slate-700'
                    }`}
                    aria-label="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5 group-hover:animate-[bounce_1s_infinite]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-slate-50 dark:border-slate-800 rounded-full shadow-sm animate-pulse"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-50"
                      >
                        {/* Header */}
                        <div className="px-5 py-4 bg-[#1a3884] flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <Bell className="w-4 h-4" />
                            <span className="text-sm font-bold tracking-wide">Notifications</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white backdrop-blur-sm">
                              {unreadCount} New
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="max-h-[360px] overflow-y-auto bg-white dark:bg-slate-900">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {notifications.slice(0, 5).map((n) => (
                                <div 
                                  key={n._id} 
                                  onClick={() => {
                                    markRead(n._id);
                                    if (n.link) navigate(n.link);
                                    setShowNotifications(false);
                                  }}
                                  className={`px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                                >
                                  <div className="flex gap-3">
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                      n.type === 'course' ? 'bg-blue-100 text-blue-600' : 
                                      n.type === 'assessment' ? 'bg-purple-100 text-purple-600' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {n.type === 'course' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs leading-relaxed ${!n.isRead ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {n.message}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-1">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                              </div>
                              <p className="text-sm font-medium">No notifications yet</p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <button
                          onClick={() => {
                            navigate('/notifications');
                            setShowNotifications(false);
                          }}
                          className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-[#1a3884] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                          View all notifications
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings */}
                <button
                  onClick={() => navigate('/dashboard/settings')}
                  className="p-2 rounded-xl text-slate-500 hover:text-[#1a3884] hover:bg-white dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
                  aria-label="Settings"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* 3. User Profile Card */}
              <motion.div 
                whileHover={{ y: -2, shadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm cursor-pointer group transition-all"
                onClick={() => navigate('/profile')}
              >
                <div className="relative shrink-0">
                  <div className="absolute -inset-0.5 bg-[#1a3884] rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity" />
                  <div className="relative p-[2px] bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-full">
                    {showCollegeLogo && user?.college?.logo ? (
                      <img
                        src={user.college.logo.startsWith('http') ? user.college.logo : `${API_BASE_URL.replace('/api', '')}/${user.college.logo}`}
                        alt="College"
                        className="w-9 h-9 rounded-full object-contain bg-white p-1"
                        onError={() => setShowCollegeLogo(false)}
                      />
                    ) : (profilePhoto || user?.profileImage || user?.profilePicture) ? (
                      <img
                        src={profilePhoto || (user?.profileImage?.startsWith('http') ? user.profileImage : (user?.profileImage ? `${getBackendUrl()}/${user.profileImage}` : user?.profilePicture))}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3884] to-[#112b6b] flex items-center justify-center text-white text-xs font-bold">
                        {(user?.firstName?.[0] || user?.fullName?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1">
                    {getGreeting()}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1a3884] transition-colors">
                      {user?.firstName || user?.fullName?.split(' ')[0] || 'User'}
                    </p>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1a3884] transition-colors" />
                  </div>
                </div>
              </motion.div>

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
