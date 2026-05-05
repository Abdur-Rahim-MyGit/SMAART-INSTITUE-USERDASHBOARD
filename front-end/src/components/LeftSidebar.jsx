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
  Compass
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
      { icon: Compass, label: "Career Direc", path: "/dashboard/career-direction", badge: null },
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
      { icon: Settings, label: "sidebar.settings", path: "/dashboard/settings", badge: null },
      { icon: HelpCircle, label: "sidebar.help", path: "/dashboard/support", badge: null },
    ]
  }
];

const MALE_SEQUENCE = [
  ToddlerBoyIdle,
  ToddlerBoyGrowing,
  PreteenBoyIdle,
  PreteenBoyGrowing,
  TeenBoyIdle,
  TeenBoyGrowing,
  ManIdle
];

const FEMALE_SEQUENCE = [
  ToddlerGirlIdle,
  ToddlerGirlGrowing,
  PreteenGirlIdle,
  PreteenGirlGrowing,
  TeenGirlIdle,
  TeenGirlGrowing,
  WomanIdle
];

const LeftSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useUser();
  const { avatarData } = useAvatar();
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showCollegeLogo, setShowCollegeLogo] = useState(false);

  // Mobile sidebar state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    }
    return location.pathname === path || location.pathname.startsWith(path);
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
      {/* Mobile Menu Button - Fixed at top left */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-[90] lg:hidden p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#1a3884] transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

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
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {/* <img
                  src={theme === 'dark' ? whiteLogo : blueLogo}
                  alt="SMAART"
                  className="h-12 w-auto object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                /> */}
                {/* <div className="h-12 w-12 bg-[#1a3884] rounded-xl items-center justify-center hidden">
                  <Sparkles className="w-6 h-6 text-white" />
                </div> */}
                {(location.pathname === '/dashboard' || location.pathname === '/dashboard/') && (
                  <span
                    className="text-2xl font-extrabold tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif", color: theme === 'dark' ? '#fff' : '#1a3884' }}
                  >
                    SMAART
                  </span>
                )}
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
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (groupIndex * 0.1) + (itemIndex * 0.05) }}
                        >
                          <Link
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
                              ? 'bg-[#1a3884] text-white shadow-lg shadow-[#1a3884]/25'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                          >
                            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#1a3884]'}`} />
                            <span className="font-medium text-sm">{t(item.label)}</span>
                            {item.badge && (
                              <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
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
        {/* Logo Section */}
        <div className={`flex flex-col items-start p-5 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'px-3 items-center' : 'px-5'}`}>
          <Link to="/dashboard" className="flex flex-col items-start overflow-hidden">
            {/* SMAART Institute Logo - commented out, using text instead */}
            {/* <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'w-10' : 'w-full'}`}>
              <img
                src={theme === 'dark' ? whiteLogo : blueLogo}
                alt="SMAART Institute"
                className={`w-auto object-contain transition-all duration-300 ${isCollapsed ? 'h-8 max-w-[40px]' : 'h-10 lg:h-12 max-w-[180px] lg:max-w-[200px]'}`}
              />
            </div> */}
            {(location.pathname === '/dashboard' || location.pathname === '/dashboard/') ? (
              <>
                <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'w-10' : 'w-full'}`}>
                  {isCollapsed ? (
                    <span
                      className="text-lg font-extrabold tracking-tight"
                      style={{ fontFamily: "'Outfit', sans-serif", color: theme === 'dark' ? '#fff' : '#1a3884' }}
                    >
                      S
                    </span>
                  ) : (
                    <span
                      className="text-2xl font-extrabold tracking-tight"
                      style={{ fontFamily: "'Outfit', sans-serif", color: theme === 'dark' ? '#fff' : '#1a3884' }}
                    >
                      SMAART
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                    Craft Your Career
                  </span>
                )}
              </>
            ) : (
              // On inner pages, we can either show nothing or a minimal spacer/icon
              // Based on user request "dont show this", we'll hide it.
              <div className="h-4" />
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
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${active
                        ? 'bg-[#1a3884] text-white shadow-md shadow-[#1a3884]/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      {/* Icon */}
                      <div className={`relative ${isCollapsed ? '' : ''}`}>
                        <Icon
                          className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-[#1a3884]'
                            }`}
                        />
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                            {t(item.label)}
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
                            {t(item.label)}
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
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {/* Notification Button */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-[#1a3884]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    Notifications
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm ml-2">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full ml-auto">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {notificationOpen && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-2 left-0 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-[#1a3884] to-[#132c6b] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-white" />
                      <h3 className="font-semibold text-white text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-white/80 hover:text-white" title="Mark all read">
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-[#1a3884] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center px-4">
                        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.slice(0, 5).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              if (n.link) navigate(n.link);
                              setNotificationOpen(false);
                            }}
                            className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1a3884]/10">
                              <Bell className="w-4 h-4 text-[#1a3884]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{n.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{n.message}</p>
                            </div>
                            <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => {
                        navigate('/notifications');
                        setNotificationOpen(false);
                      }}
                      className="w-full text-center text-xs font-medium text-[#1a3884] hover:text-[#132c6b]"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


        </div>

        {/* User Profile Section with Hover Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 relative z-50">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50 ${isCollapsed ? 'justify-center' : ''}`}
            onMouseEnter={() => setIsProfileHovered(true)}
            onMouseLeave={() => setIsProfileHovered(false)}
            onClick={() => navigate('/dashboard/profile')}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {showCollegeLogo && user?.college?.logo ? (
                <img
                  src={user.college.logo.startsWith('http') ? user.college.logo : `${API_BASE_URL.replace('/api', '')}/${user.college.logo}`}
                  alt={user.college.collegeName || "College Logo"}
                  className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 p-1"
                  onError={() => {
                    setShowCollegeLogo(false);
                  }}
                />
              ) : (profilePhoto || user?.profileImage || user?.profilePicture) ? (
                <img
                  src={profilePhoto || (user?.profileImage?.startsWith('http') ? user.profileImage : (user?.profileImage ? `${getBackendUrl()}/${user.profileImage}` : user?.profilePicture))}
                  alt={user.fullName || 'User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1a3884] flex items-center justify-center border-2 border-white dark:border-slate-700">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-700"></span>
            </div>

            {/* User Info */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {user?.fullName || user?.firstName || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.role || 'Student'}
                </p>
              </div>
            )}

            {/* Arrow Indicator */}
            {!isCollapsed && (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Hover Profile Card */}
          <AnimatePresence>
            {isProfileHovered && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed z-[9999] pointer-events-auto"
                style={{
                  left: '20px',
                  bottom: '120px',
                  width: '220px'
                }}
                onMouseEnter={() => setIsProfileHovered(true)}
                onMouseLeave={() => setIsProfileHovered(false)}
              >
                <ProfileHoverCard user={user} avatarData={avatarData} onLogout={handleLogout} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
};

// Profile Hover Card Component
const ProfileHoverCard = ({ user, avatarData, onLogout }) => {
  const navigate = useNavigate();
  const videoRefs = useRef([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(0);

  const userGender = user?.gender || avatarData?.user?.gender;
  const normalizedGender = userGender?.toLowerCase()?.trim();
  const isFemale = ['female', 'girl', 'woman'].includes(normalizedGender);
  const ANIMATION_SEQUENCE = isFemale ? FEMALE_SEQUENCE : MALE_SEQUENCE;

  const levelProgress = avatarData?.levelProgress ||
    Math.min(100, Math.round(((avatarData?.xp || 0) / (avatarData?.xpToNextLevel || 100)) * 100));

  const handleVideoEnded = (index) => {
    if (index < ANIMATION_SEQUENCE.length - 1) {
      setCurrentVideoIndex(index + 1);
    }
  };

  useEffect(() => {
    setCurrentVideoIndex(0);
    setVisibleVideoIndex(0);
    videoRefs.current.forEach(v => v?.pause());
  }, [isFemale]);

  useEffect(() => {
    if (videoRefs.current[currentVideoIndex]) {
      const video = videoRefs.current[currentVideoIndex];
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented:", error);
        });
      }
    }
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentVideoIndex) {
        video.pause();
      }
    });
  }, [currentVideoIndex, isFemale]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl"
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0f172a] to-[#0f172a]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

      {/* Animation Section */}
      <div className="relative z-10 pt-4 px-4 pb-2">
        <div className="relative aspect-[4/5] w-full mx-auto rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl flex items-center justify-center bg-black/40 backdrop-blur-sm group max-h-[180px]">
          {/* Inner Glow Border */}
          <div className="absolute inset-0 rounded-xl border border-white/5 z-20 pointer-events-none group-hover:border-white/10 transition-colors" />

          {/* Video Playback */}
          {ANIMATION_SEQUENCE.map((src, index) => (
            <video
              key={`${isFemale ? 'female' : 'male'}-${index}`}
              ref={el => videoRefs.current[index] = el}
              src={src}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${index <= visibleVideoIndex ? 'opacity-100' : 'opacity-0'
                } ${index === visibleVideoIndex ? 'z-10' : 'z-0'}`}
              muted
              playsInline
              preload="auto"
              loop={index === ANIMATION_SEQUENCE.length - 1}
              onEnded={() => handleVideoEnded(index)}
              onPlaying={() => {
                if (index === currentVideoIndex) {
                  setVisibleVideoIndex(index);
                }
              }}
            />
          ))}

          {/* Floating Level Badge */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-2 inset-x-2 h-8 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-between px-2 z-30"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-white font-bold text-xs tracking-wide">Lvl {avatarData?.level || 1}</span>
            </div>
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full" style={{ width: `${levelProgress}%` }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Profile Info & Actions */}
      <div className="relative z-10 p-4 space-y-3">
        <div className="text-center space-y-0.5">
          <h3 className="text-lg font-bold text-white tracking-tight">{user?.fullName || 'Student'}</h3>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{user?.role || 'Student'}</p>
        </div>

        <div className="space-y-2">
          {/* Skills Passport Button */}
          <button
            onClick={() => navigate('/dashboard/skills-passport')}
            className="group relative w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98] overflow-hidden flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Skills Passport</span>
            <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* View Profile & Logout */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white transition-all duration-300 text-xs font-medium"
            >
              View Profile
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LeftSidebar;
