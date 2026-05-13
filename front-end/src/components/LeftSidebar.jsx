import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Home,
  BookOpen,
  ClipboardCheck,
  Wrench,
  Award,
  ShieldCheck,
  Lightbulb,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,

  Star,
  LogOut,
  User,
  Trophy,
  X,
  Sparkles,
  CheckCheck,
  Compass,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "@/contexts/SidebarContext";
import useUser from "@/hooks/useUser";
import useAvatar from "@/hooks/useAvatar";
import { getBackendUrl } from "@/services/api";

// Import logos for different themes
import whiteLogo from "@/assets/white.png";
import blueLogo from "@/assets/blue.png";

// Import Video Assets for Avatar Card
import ToddlerBoyIdle from "@/assets/Animations/ToddlerBoyIdle.mp4";
import ToddlerBoyGrowing from "@/assets/Animations/ToddlerBoyGrowing.mp4";
import PreteenBoyIdle from "@/assets/Animations/PreteenBoyIdle.mp4";
import PreteenBoyGrowing from "@/assets/Animations/PreteenBoyGrowing.mp4";
import TeenBoyIdle from "@/assets/Animations/TeenBoyIdle.mp4";
import TeenBoyGrowing from "@/assets/Animations/TeenBoyGrowing.mp4";
import ManIdle from "@/assets/Animations/ManIdle.mp4";
import ToddlerGirlIdle from "@/assets/Animations/ToddlerGirlIdle.mp4";
import ToddlerGirlGrowing from "@/assets/Animations/ToddlerGirlGrowing.mp4";
import PreteenGirlIdle from "@/assets/Animations/PreeteenGirlIdle.mp4";
import PreteenGirlGrowing from "@/assets/Animations/PreteenGirlGrowing.mp4";
import TeenGirlIdle from "@/assets/Animations/TeenGirlIdle.mp4";
import TeenGirlGrowing from "@/assets/Animations/TeenGirlGrowing.mp4";
import WomanIdle from "@/assets/Animations/WomanIdle.mp4";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// SRM Logo URL
const srmLogo = "";

// Menu items configuration
const menuGroups = [
  {
    title: "sidebar.group_main",
    items: [
      { icon: Home, label: "sidebar.dashboard", path: "/dashboard", badge: null },
      { icon: BookOpen, label: "sidebar.courses", path: "/dashboard/courses", badge: null },
      { icon: ClipboardCheck, label: "sidebar.assessments", path: "/dashboard/assessment-centre", badge: null },
      { icon: Wrench, label: "sidebar.toolkit", path: "/dashboard/smaart-toolkit", badge: null },
    ]
  },
  {
    title: "sidebar.group_skills",
    items: [
      { icon: Award, label: "Skills Vault", path: "/dashboard/skills-vault", badge: null },
      { icon: Compass, label: "Career Directions", path: "/dashboard/career-direction", badge: null },
      { icon: ShieldCheck, label: "Skills Passport", path: "/dashboard/skills-passport", badge: null },
      { icon: Lightbulb, label: "Vision Board", path: "/dashboard/vision-boards", badge: null },
    ]
  },
  {
    title: "sidebar.group_community",
    items: [
      { icon: Users, label: "sidebar.community", path: "/dashboard/community", badge: null },
    ]
  },
  {
    title: "sidebar.group_system",
    items: [
      { icon: Sun, label: "sidebar.theme", isThemeToggle: true, onlyMobile: true },
      { icon: Bell, label: "sidebar.notifications", path: "/dashboard/notifications", onlyMobile: true },
      { icon: Settings, label: "sidebar.settings", path: "/dashboard/settings" },
      { icon: HelpCircle, label: "sidebar.help", path: "/dashboard/support" },
    ]
  }
];



const LeftSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { user, logout } = useUser();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showCollegeLogo, setShowCollegeLogo] = useState(false);

  // Auto-toggle between profile photo and college logo
  useEffect(() => {
    if (!user?.college?.logo) return;

    const interval = setInterval(() => {
      setShowCollegeLogo(prev => !prev);
    }, 5000); // Toggle every 5 seconds

    return () => clearInterval(interval);
  }, [user?.college?.logo]);

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
  }, [user?.email, user?.profileImage, user?.profilePicture]);

  // Notifications state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notificationRef = useRef(null);

  // Auth headers helper
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Fetch notifications
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notificationOpen) {
      fetchNotifications();
    }
  }, [notificationOpen]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications?limit=10`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const timeAgo = (date) => {
    const secs = Math.floor((Date.now() - new Date(date)) / 1000);
    if (secs < 60) return 'now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
    return `${Math.floor(secs / 86400)}d`;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback navigation if logout fails
      navigate('/', { replace: true });
    }
  };


  // Check if menu item is active
  const isActive = (path) => {
    if (!path) return false;
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Sidebar width classes
  const sidebarWidth = isCollapsed ? 'w-[70px]' : 'w-[260px]';

  return (
    <>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[95] lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-screen w-[280px] z-[100] lg:hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Mobile Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black tracking-tighter text-[#1a3884] dark:text-white leading-none">
                      SMAART
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">
                    Institute
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Mobile Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              {menuGroups.map((group, groupIndex) => (
                <div key={group.title} className="mb-6">
                  <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    {t(group.title)}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.isThemeToggle ? (theme === 'dark' ? Sun : Moon) : item.icon;
                      const label = item.isThemeToggle ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : t(item.label);
                      const active = isActive(item.path);

                      const content = (
                        <>
                          <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#1a3884]'}`} />
                          <span className="font-medium text-sm">{label}</span>
                          {item.badge && (
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      );

                      return (
                        <motion.div
                          key={item.path || item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (groupIndex * 0.1) + (itemIndex * 0.05) }}
                          className={item.onlyMobile ? 'sm:hidden' : ''}
                        >
                          {item.isThemeToggle ? (
                            <button
                              onClick={() => {
                                toggleTheme();
                                setIsMobileOpen(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              {content}
                            </button>
                          ) : (
                            <Link
                              to={item.path}
                              onClick={() => setIsMobileOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
                                ? 'bg-[#1a3884] text-white shadow-lg shadow-[#1a3884]/25'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                              {content}
                            </Link>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">{t("sidebar.logout")}</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Left Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 70 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed left-0 top-0 h-screen z-[80] hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl`}
        onMouseEnter={() => isCollapsed && toggleSidebar()}
      >
        <div className={`flex flex-col items-start py-6 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'px-3 items-center' : 'px-5'}`}>
          <Link to="/dashboard" className="flex flex-col items-start overflow-hidden">
            {isCollapsed ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3884] to-[#132c6b] flex items-center justify-center shadow-lg shadow-[#1a3884]/20">
                <span className="text-xl font-black text-white">S</span>
              </div>
            ) : (
              <div className="flex flex-col items-start transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-1">
                  <span className="text-2xl lg:text-3xl font-black tracking-tighter text-[#1a3884] dark:text-white leading-none">
                    SMAART
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">
                  Institute
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-3">
              {/* Group Title */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2"
                  >
                    {t(group.title)}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  if (item.onlyMobile) return null;
                  const Icon = item.isThemeToggle ? (theme === 'dark' ? Sun : Moon) : item.icon;
                  const label = item.isThemeToggle ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : t(item.label);
                  const active = isActive(item.path);

                  const content = (
                    <>
                      {/* Icon */}
                      <div className={`relative ${isCollapsed ? '' : ''}`}>
                        <Icon
                          className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-[#1a3884]'
                            }`}
                        />
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                            {label}
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="font-medium text-sm whitespace-nowrap flex-1 ml-2"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Badge */}
                      {!isCollapsed && item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}

                      {/* Active Indicator */}
                      {active && !isCollapsed && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  );

                  return item.isThemeToggle ? (
                    <button
                      key={item.label}
                      onClick={toggleTheme}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${active
                        ? 'bg-[#1a3884] text-white shadow-md shadow-[#1a3884]/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {/* Section left empty after removing notification button */}
        </div>

        {/* User Profile Section with Hover Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 relative z-50">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50 ${isCollapsed ? 'justify-center' : ''}`}
            onClick={() => navigate('/dashboard/profile')}
          >
            {/* Avatar - Fixed to College Logo */}
            <div className="relative flex-shrink-0">
              {user?.college?.logo ? (
                <img
                  src={user.college.logo.startsWith('http') ? user.college.logo : `${API_BASE_URL.replace('/api', '')}/${user.college.logo}`}
                  alt={user.college.collegeName || "College Logo"}
                  className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 p-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1a3884] flex items-center justify-center border-2 border-white dark:border-slate-700">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* User Info - Displaying College Name */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {user?.college?.collegeName || 'College'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.role || 'student'}
                </p>
              </div>
            )}

            {/* Arrow Indicator */}
            {!isCollapsed && (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default LeftSidebar;
