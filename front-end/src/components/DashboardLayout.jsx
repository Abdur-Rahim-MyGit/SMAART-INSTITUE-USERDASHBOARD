import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  IconChevronRight as ChevronRight,
  IconChevronDown as ChevronDown,
  IconBell as Bell,
  IconSettings as Settings,
  IconSearch as Search,
  IconCommand as Command,
  IconKeyboard as Keyboard,
  IconClock as Clock,
  IconSun as Sun,
  IconMoon as Moon,
  IconInfoCircle as Info,
  IconCircleCheck as CheckCircle,
  IconAlertCircle as AlertCircle,
  IconExternalLink as ExternalLink,
  IconMenu2 as Menu,
  IconStar as Star,
  IconLogout as LogOut,
  IconTrophy as Trophy,
  IconUser as User,
  IconWorld as Globe2,
  IconX as X,
  IconFlame as Flame,
} from "@tabler/icons-react";
import StreaksWidget from "@/components/dashboard/StreaksWidget";
import { useTranslation } from "react-i18next";
import LeftSidebar from "./LeftSidebar";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import Footer from "./Footer";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import useUser from "@/hooks/useUser";
import useAvatar from "@/hooks/useAvatar";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL, getBackendUrl } from "@/services/api";
import useSessionGuard from "@/hooks/useSessionGuard";
import SessionExpiryWarning from "@/components/SessionExpiryWarning";
import { STAGES, TRACKS, ASSESSMENT_GATES } from "@/data/courseStructureData";

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
  '/dashboard/grievances': 'Grievance Redressal',
  '/grievances': 'Grievance Redressal',
  '/dashboard/notifications': 'Notifications',
  '/notifications': 'Notifications',
  '/dashboard/profile': 'Profile',
  '/profile': 'Profile',
  '/dashboard/notes': 'My Notes',
  '/dashboard/library': 'Library',
  '/library': 'Library',
  '/dashboard/dictionary': 'Dictionary',
  '/dictionary': 'Dictionary',
  '/dashboard/performance': 'Performance',
  '/dashboard/certificate': 'Certificates',
  '/certificate': 'Certificates',
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
  'grievances': { label: 'Grievance Redressal', path: '/dashboard/grievances' },
  'notifications': { label: 'Notifications', path: '/notifications' },
  'profile': { label: 'Profile', path: '/profile' },
};

const STATIC_SEARCH_ITEMS = [
  {
    id: "page-home",
    title: "Home",
    subtitle: "Dashboard overview and progress",
    path: "/dashboard",
    type: "Page",
    keywords: ["dashboard", "home", "overview", "progress"]
  },
  {
    id: "page-courses",
    title: "My Courses",
    subtitle: "Browse all learning modules and course paths",
    path: "/dashboard/courses",
    type: "Page",
    keywords: ["courses", "learning", "modules", "player", "curriculum"]
  },
  {
    id: "page-assessments",
    title: "Assessment Centre",
    subtitle: "View tests, stages, and assessments",
    path: "/dashboard/assessment-centre",
    type: "Page",
    keywords: ["assessment", "test", "exam", "quiz", "baseline"]
  },
  {
    id: "page-skills-vault",
    title: "Skills Vault",
    subtitle: "Track capability growth and achievements",
    path: "/dashboard/skills-vault",
    type: "Page",
    keywords: ["skills", "vault", "growth", "achievements"]
  },
  {
    id: "page-skills-passport",
    title: "Skills Passport",
    subtitle: "Your verified skills and development record",
    path: "/dashboard/skills-passport",
    type: "Page",
    keywords: ["skills passport", "passport", "verified skills", "profile"]
  },
  {
    id: "page-vision-board",
    title: "Vision Board",
    subtitle: "Review and manage personal goals",
    path: "/dashboard/vision-boards",
    type: "Page",
    keywords: ["vision", "goals", "board", "future"]
  },
  {
    id: "page-toolkit",
    title: "SMAART Toolkit",
    subtitle: "Open tools, dictionary, and utility features",
    path: "/dashboard/smaart-toolkit",
    type: "Page",
    keywords: ["toolkit", "tools", "utility", "career", "resources"]
  },
  {
    id: "page-community",
    title: "Community",
    subtitle: "Explore discussions and people",
    path: "/dashboard/community",
    type: "Page",
    keywords: ["community", "discussion", "people", "network"]
  },
  {
    id: "page-notes",
    title: "My Notes",
    subtitle: "Search and manage your personal notes",
    path: "/dashboard/notes",
    type: "Page",
    keywords: ["notes", "personal notes", "writing"]
  },
  {
    id: "page-library",
    title: "Library",
    subtitle: "Search books and learning resources",
    path: "/dashboard/library",
    type: "Page",
    keywords: ["library", "books", "resources", "reading"]
  },
  {
    id: "page-dictionary",
    title: "Dictionary",
    subtitle: "Look up terms and meanings",
    path: "/dashboard/dictionary",
    type: "Page",
    keywords: ["dictionary", "meaning", "word", "definition"]
  },
  {
    id: "page-settings",
    title: "Settings",
    subtitle: "Manage dashboard preferences",
    path: "/dashboard/settings",
    type: "Page",
    keywords: ["settings", "preferences", "theme", "account"]
  },
  {
    id: "page-support",
    title: "Help & Support",
    subtitle: "Open support and ticket help",
    path: "/dashboard/support",
    type: "Page",
    keywords: ["help", "support", "ticket", "issue"]
  },
  {
    id: "page-grievances",
    title: "Grievance Redressal",
    subtitle: "Submit and track grievances securely",
    path: "/dashboard/grievances",
    type: "Page",
    keywords: ["grievance", "redressal", "complaint", "issue", "anonymous"]
  },
  {
    id: "page-profile",
    title: "Profile",
    subtitle: "Manage your account and profile information",
    path: "/dashboard/profile",
    type: "Page",
    keywords: ["profile", "account", "user", "details", "photo"]
  },
  {
    id: "page-resume-builder",
    title: "Resume Builder",
    subtitle: "Create a professional ATS-friendly resume",
    path: "/dashboard/resume-builder",
    type: "Page",
    keywords: ["resume", "cv", "builder", "ats", "career", "jobs"]
  },
  {
    id: "page-profile-analysis",
    title: "AI Profile Analysis",
    subtitle: "Analyze your career profile using AI",
    path: "/dashboard/profile-analysis",
    type: "Page",
    keywords: ["ai", "analysis", "profile", "career", "insights"]
  },
  {
    id: "page-certificates",
    title: "Certificates",
    subtitle: "View and download your earned certificates",
    path: "/dashboard/certificate",
    type: "Page",
    keywords: ["certificate", "award", "earned", "completion"]
  },
  {
    id: "page-quotients",
    title: "Quotients Grid",
    subtitle: "View your intelligence and skill quotients",
    path: "/dashboard/quotients-grid",
    type: "Page",
    keywords: ["quotients", "skills", "grid", "iq", "eq", "sq"]
  },
  {
    id: "page-performance",
    title: "Performance",
    subtitle: "Track academic and skill performance analytics",
    path: "/dashboard/performance",
    type: "Page",
    keywords: ["performance", "analytics", "progress", "stats", "score"]
  },
  {
    id: "page-career-agent",
    title: "Career Directions",
    subtitle: "Explore career paths and get AI-powered career guidance",
    path: "/dashboard/career-agent",
    type: "Page",
    keywords: ["career", "agent", "career agent", "career directions", "jobs", "path", "guidance", "ai career"]
  },
  {
    id: "page-todos",
    title: "To-Do & Calendar",
    subtitle: "Manage tasks, deadlines, and your schedule",
    path: "/dashboard/todos",
    type: "Page",
    keywords: ["todo", "tasks", "calendar", "deadlines", "schedule", "planner"]
  },
  {
    id: "page-notifications",
    title: "Notifications",
    subtitle: "View all your alerts and activity updates",
    path: "/dashboard/notifications",
    type: "Page",
    keywords: ["notifications", "alerts", "updates", "activity"]
  },
  {
    id: "page-groups",
    title: "Student Groups",
    subtitle: "Join and chat with student groups",
    path: "/dashboard/groups",
    type: "Page",
    keywords: ["groups", "student groups", "chat", "community", "team"]
  },
];

const COURSE_SEARCH_ITEMS = STAGES.flatMap((stage) =>
  stage.courses.map((course) => ({
    id: `course-${course.id}`,
    title: course.title,
    subtitle: `${stage.name} course - ${course.subtitle}`,
    path: `/dashboard/courses/${course.id}/player`,
    type: "Course",
    keywords: [course.id, stage.name, stage.subtitle, course.subtitle]
  }))
);

const TRACK_SEARCH_ITEMS = TRACKS.map((track) => ({
  id: `track-${track.id}`,
  title: track.name,
  subtitle: `${track.shortName} track - ${track.description}`,
  path: "/dashboard/courses",
  type: "Track",
  keywords: [track.id, track.shortName, track.description, ...track.courses.map((course) => course.title)]
}));

const ASSESSMENT_SEARCH_ITEMS = ASSESSMENT_GATES.map((assessment) => ({
  id: `assessment-${assessment.id}`,
  title: assessment.name,
  subtitle: `${assessment.id} - ${assessment.description}`,
  path: "/dashboard/assessment-centre",
  type: "Assessment",
  keywords: [assessment.id, assessment.description]
}));

const DASHBOARD_SEARCH_ITEMS = [
  ...STATIC_SEARCH_ITEMS,
  ...COURSE_SEARCH_ITEMS,
  ...TRACK_SEARCH_ITEMS,
  ...ASSESSMENT_SEARCH_ITEMS,
];

const normalizeSearchValue = (value) => value.toLowerCase().trim();

const getSearchScore = (item, normalizedQuery) => {
  const title = normalizeSearchValue(item.title);
  const subtitle = normalizeSearchValue(item.subtitle);
  const keywords = item.keywords.map(normalizeSearchValue);

  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;
  if (keywords.some((keyword) => keyword === normalizedQuery)) return 2;
  if (title.includes(normalizedQuery)) return 3;
  if (keywords.some((keyword) => keyword.startsWith(normalizedQuery))) return 4;
  if (keywords.some((keyword) => keyword.includes(normalizedQuery))) return 5;
  if (subtitle.includes(normalizedQuery)) return 6;
  return 99;
};

const getSearchResults = (query) => {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return DASHBOARD_SEARCH_ITEMS.slice(0, 8);
  }

  return DASHBOARD_SEARCH_ITEMS
    .map((item) => ({
      ...item,
      score: getSearchScore(item, normalizedQuery)
    }))
    .filter((item) => item.score < 99)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 8);
};


const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Reset scroll position on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const isCareerAgentDashboard = location.pathname === '/dashboard/career-agent/dashboard';
  const isImmersiveRoute = location.pathname.includes('/player') || (location.pathname.includes('/micro-assessments/') && location.pathname.split('/').length > 3);
  const isFullScreenPage = isCareerAgentDashboard || location.pathname === '/dashboard/assessments/baseline' || isImmersiveRoute;

  const { t, i18n } = useTranslation();
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { user, loading: userLoading, logout } = useUser();
  const { avatarData } = useAvatar();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [showLanguages, setShowLanguages] = useState(false);
  const languageRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Scroll-based transparent navbar effect
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const target = mainEl || window;
    const onScroll = () => {
      const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;
      setScrolled(scrollTop > 12);
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  const fetchStreak = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/streaks/status`, {
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          setStreakCount(res.data.currentStreak);
        }
      }
    } catch (err) {
      console.error("Error fetching streak for navbar badge:", err);
    }
  };

  const recordActivityAndFetch = async () => {
    try {
      await fetch(`${API_BASE_URL}/streaks/activity`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`
        }
      });
    } catch (err) {
      console.error("Error auto-recording activity:", err);
    } finally {
      fetchStreak();
    }
  };

  useEffect(() => {
    if (user) {
      recordActivityAndFetch();
    }
  }, [user]);

  // Track feature visits in localStorage for "Where Learning Time Was Spent" breakdown
  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    let featureKey = null;

    if (path.includes('/career-') || path.includes('/career/')) {
      featureKey = 'career';
    } else if (path.includes('/vision-board') || path.includes('/vision-boards')) {
      featureKey = 'vision_board';
    } else if (path.includes('/resume-builder')) {
      featureKey = 'resume_builder';
    } else if (path.includes('/dictionary')) {
      featureKey = 'dictionary';
    } else if (path.includes('/notes')) {
      featureKey = 'notes';
    } else if (path.includes('/interview-prep')) {
      featureKey = 'interview_prep';
    } else if (path.includes('/skills-passport') || path.includes('/skills-vault') || path.includes('/skills/')) {
      featureKey = 'skills_passport';
    } else if (path.includes('/community')) {
      featureKey = 'community';
    } else if (path.includes('/profile')) {
      featureKey = 'profile';
    }

    if (featureKey) {
      try {
        const nowISO = new Date().toISOString();
        const storageKey = `smaart_visits_${user._id || user.id || 'guest'}_${featureKey}`;
        const visits = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const lastVisit = visits[visits.length - 1];

        // Debounce visit logging by 5 minutes to avoid spamming the timeline
        if (!lastVisit || (new Date(nowISO).getTime() - new Date(lastVisit).getTime()) > 5 * 60 * 1000) {
          visits.push(nowISO);
          // Keep only the last 30 visits
          const cleanVisits = visits.slice(-30);
          localStorage.setItem(storageKey, JSON.stringify(cleanVisits));
          console.log(`[Feature Tracker] Logged visit to ${featureKey} at ${nowISO}`);
        }
      } catch (err) {
        console.warn('[Feature Tracker] Failed to log visit:', err);
      }
    }
  }, [location.pathname, user]);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchResults = getSearchResults(searchQuery);
  const languageOptions = [
    { code: 'en', name: 'English', native: 'English', shortLabel: 'EN' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', shortLabel: 'HI' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', shortLabel: 'TA' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', shortLabel: 'TE' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', shortLabel: 'KN' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', shortLabel: 'ML' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', shortLabel: 'PA' },
    { code: 'ur', name: 'Urdu', native: 'اردو', shortLabel: 'UR' },
    { code: 'fr', name: 'French', native: 'Français', shortLabel: 'FR' },
    { code: 'ar', name: 'Arabic', native: 'العربية', shortLabel: 'AR' }
  ];
  const activeLanguageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const activeLanguage = languageOptions.find((lang) => lang.code === activeLanguageCode) || languageOptions[0];

  const [showCareerLockWarning, setShowCareerLockWarning] = useState(false);
  const [careerLockDaysRemaining, setCareerLockDaysRemaining] = useState(14);

  useEffect(() => {
    const checkCareerLockStatus = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_BASE_URL}/career-agent/final-pathway`, { credentials: 'include' });
        let isLocked = false;
        if (res.ok) {
          const payload = await res.json();
          if (payload.found && payload.is_locked) {
            isLocked = true;
          }
        }

        if (!isLocked) {
          // Calculate remaining days based on user.createdAt
          const regDate = user.createdAt || user.registrationDate || new Date();
          const diffTime = Date.now() - new Date(regDate).getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const remaining = 14 - diffDays;

          setCareerLockDaysRemaining(remaining);
          setShowCareerLockWarning(true);
        } else {
          setShowCareerLockWarning(false);
        }
      } catch (err) {
        console.error('Error checking career lock status:', err);
      }
    };

    checkCareerLockStatus();
  }, [user, location.pathname]);

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
    setIsProfileHovered(false);
  };

  const isDesktopViewport = () => window.matchMedia("(min-width: 1024px)").matches;

  const handleMouseEnter = () => {
    if (!isDesktopViewport()) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsProfileHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isDesktopViewport()) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsProfileHovered(false);
    }, 150); // Small delay to allow moving to the modal
  };

  const handleProfileClick = () => {
    if (!isDesktopViewport()) {
      setIsProfileMenuOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    closeProfileMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isProfileMenuOpen]);

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

  // Close notifications and language switcher on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguages(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle Theme
  const toggleTheme = (e) => {
    setTheme(theme === 'dark' ? 'light' : 'dark', e);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/', { replace: true });
    }
  };

  // Sync profile photo from context or API
  useEffect(() => {
    // 1. Try to get it from context first to avoid extra API calls
    const photoUrl = user?.profilePhoto || user?.otherDetails?.profilePhoto || user?.profileImage || user?.profilePicture;
    if (photoUrl) {
      const fullUrl = photoUrl.startsWith('http') ? photoUrl : `${getBackendUrl()}/${photoUrl}`;
      setProfilePhoto(fullUrl);
    } else {
      // 2. Fallback to API if not in context
      const fetchProfilePhoto = async () => {
        if (!user?.email) return;
        try {
          const response = await fetch(`${API_BASE_URL}/users/register-details/${user.email}`);
          if (response.ok) {
            const data = await response.json();
            const fetchedPhotoUrl = data.profilePhoto || data.otherDetails?.profilePhoto;
            if (fetchedPhotoUrl) {
              const fullUrl = fetchedPhotoUrl.startsWith('http') ? fetchedPhotoUrl : `${getBackendUrl()}/${fetchedPhotoUrl}`;
              setProfilePhoto(fullUrl);
            }
          }
        } catch (error) {
          console.error("Error fetching profile photo:", error);
        }
      };
      fetchProfilePhoto();
    }
  }, [user?.email, user?.profilePhoto, user?.otherDetails?.profilePhoto, user?.profileImage, user?.profilePicture]);

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
    const titleMap = {
      '/dashboard': t('sidebar.dashboard', 'Dashboard'),
      '/dashboard/home': t('sidebar.dashboard', 'Dashboard'),
      '/dashboard/courses': t('sidebar.courses', 'My Courses'),
      '/my-courses': t('sidebar.courses', 'My Courses'),
      '/dashboard/assessment-centre': t('sidebar.assessments', 'Assessments'),
      '/dashboard/assessments': t('sidebar.assessments', 'Assessments'),
      '/dashboard/assessments/baseline': t('my_assessments.baseline_title', 'Base Line Test'),
      '/dashboard/skills-vault': t('sidebar.skills_vault', 'Skills Vault'),
      '/dashboard/skills-passport': t('sidebar.skills_passport', 'Skills Passport'),
      '/skills-passport': t('sidebar.skills_passport', 'Skills Passport'),
      '/dashboard/vision-boards': t('sidebar.vision_board', 'Vision Board'),
      '/vision-board': t('sidebar.vision_board', 'Vision Board'),
      '/vision-board-pro/gallery': t('sidebar.vision_board_gallery', 'Vision Board Gallery'),
      '/vision-board-pro/create': t('sidebar.vision_board_editor', 'Vision Board Editor'),
      '/vision-board/view/:id': t('sidebar.vision_board', 'Vision Board'),
      '/dashboard/smaart-toolkit': t('sidebar.toolkit', 'Tool Kit'),
      '/smaart-toolkit': t('sidebar.toolkit', 'Tool Kit'),
      '/dashboard/community': t('sidebar.community', 'Community'),
      '/community': t('sidebar.community', 'Community'),
      '/dashboard/settings': t('sidebar.settings', 'Settings'),
      '/settings': t('sidebar.settings', 'Settings'),
      '/dashboard/support': t('sidebar.help', 'Help & Support'),
      '/tickets': t('sidebar.help', 'Help & Support'),
      '/dashboard/grievances': t('sidebar.grievances', 'Grievance Redressal'),
      '/grievances': t('sidebar.grievances', 'Grievance Redressal'),
      '/dashboard/notifications': t('sidebar.notifications', 'Notifications'),
      '/notifications': t('sidebar.notifications', 'Notifications'),
      '/dashboard/profile': t('sidebar.profile', 'Profile'),
      '/profile': t('sidebar.profile', 'Profile'),
      '/dashboard/notes': t('sidebar.notes', 'My Notes'),
      '/dashboard/library': t('sidebar.library', 'Library'),
      '/library': t('sidebar.library', 'Library'),
      '/dashboard/dictionary': t('sidebar.dictionary', 'Dictionary'),
      '/dictionary': t('sidebar.dictionary', 'Dictionary'),
      '/dashboard/performance': t('sidebar.performance', 'Performance'),
      '/dashboard/certificate': t('sidebar.certificates', 'Certificates'),
      '/certificate': t('sidebar.certificates', 'Certificates'),
      '/skills-vault': t('sidebar.skills_vault', 'Skills Vault'),
      '/dashboard/add-details': t('sidebar.add_details', 'Add Details'),
      '/add-details': t('sidebar.add_details', 'Add Details'),
      '/dashboard/groups': t('sidebar.groups', 'Student Groups'),
      '/dashboard/groups/:id': t('sidebar.group_chat', 'Group Chat'),
      '/dashboard/quotients-grid': t('sidebar.quotients_grid', 'Quotients Grid'),
      '/quotients': t('sidebar.quotients_grid', 'Quotients Grid'),
      '/dashboard/profile-analysis': t('sidebar.profile_analysis', 'AI Profile Analysis'),
      '/dashboard/resume-builder': t('sidebar.resume_builder', 'Resume Builder'),
      '/dashboard/career-data-fetcher': t('sidebar.career_data', 'Career Data'),
    };
    return titleMap[location.pathname] || t('sidebar.dashboard', 'Dashboard');
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
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      }

      if (e.key === 'Escape') {
        setShowSearchResults(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setShowSearchResults(false);
    setActiveSearchIndex(0);
  }, [location.pathname]);

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [searchQuery]);

  const handleSearchNavigation = (item) => {
    if (!item?.path) return;
    setSearchQuery("");
    setShowSearchResults(false);
    navigate(item.path);
  };

  const handleSearchKeyDown = (event) => {
    if (!searchResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSearchResults(true);
      setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setShowSearchResults(true);
      setActiveSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchNavigation(searchResults[activeSearchIndex] || searchResults[0]);
    }
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle();

  return (
    <div className={`min-h-screen bg-[#e8eff8] dark:bg-[#00152E] transition-colors duration-300`}>
      {/* Session Expiry Warning Modal */}
      <SessionExpiryWarning
        isVisible={showWarning}
        secondsLeft={secondsLeft}
        onDismiss={dismissWarning}
      />

      {/* Left Sidebar */}
      {!isFullScreenPage && <LeftSidebar />}

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 min-h-screen bg-[#e8eff8] dark:bg-[#00152E] ${isFullScreenPage ? 'lg:ml-0' : (isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[240px]')
          }`}
      >
        {/* Top Header Bar - Premium AI SaaS Style */}
        {!isFullScreenPage && (
          <header className={`sticky top-0 z-40 backdrop-blur-xl border-none sm:border-b transition-all duration-300
            ${scrolled
              ? 'bg-white/90 dark:bg-[#002147]/92 border-slate-200/40 dark:border-[#1a3884]/25 shadow-[0_1px_16px_rgba(0,0,0,0.07)] dark:shadow-[0_1px_16px_rgba(0,0,0,0.35)]'
              : 'bg-white/40 dark:bg-[#002147]/30 border-transparent shadow-none'
            }`}>
            <div className="flex items-center justify-between px-4 md:px-8 h-[70px] max-w-[1600px] mx-auto">

              {/* LEFT SECTION: Menu Toggle (Mobile) + Page Title & Breadcrumb */}
              <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className="lg:hidden p-2 bg-white dark:bg-[#002A5C] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a3884]/20 text-slate-600 dark:text-slate-300 hover:text-[#1a3884] transition-all"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="flex flex-col min-w-0 shrink">


                  <div className="flex items-center gap-3.5 min-w-0">
                    <motion.h1
                      key={pageTitle}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-lg md:text-[20px] font-bold text-[#0d1f4e] dark:text-white transition-colors duration-300 truncate min-w-0"
                    >
                      {pageTitle}
                    </motion.h1>
                  </div>
                </div>
              </div>

              {/* CENTER SECTION: Premium Search Bar */}
              <div className="hidden lg:flex flex-1 max-w-[480px] mx-10">
                <div className="relative w-full group" ref={searchContainerRef}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#1a3884] transition-colors" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={t('dashboard.search_placeholder')}
                    className="block w-full pl-11 pr-14 py-2.5 bg-[#F1F5F9] dark:bg-slate-800/40 border border-transparent focus:border-[#1a3884]/30 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1a3884]/5 transition-all shadow-inner dark:text-white"
                    aria-label="Search dashboard content"
                    aria-expanded={showSearchResults}
                    aria-controls="dashboard-search-results"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-[#002A5C] rounded-full transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                    <div className="group/key flex items-center justify-center px-2 py-1 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#002147] rounded-md border border-slate-200 border-b-[3px] dark:border-[#1a3884]/30 shadow-sm transition-all duration-200 cursor-default hover:border-b hover:translate-y-[2px] hover:shadow-none hover:bg-slate-50 dark:hover:bg-[#002A5C]">
                      <span className="hidden group-hover/key:block whitespace-nowrap leading-none mt-[1px]">Ctrl + K</span>
                      <div className="flex items-center gap-1 group-hover/key:hidden">
                        <Keyboard className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="leading-none mt-[1px]">K</span>
                      </div>
                    </div>

                  </div>

                  <AnimatePresence>
                    {showSearchResults && (searchQuery.trim() || true) && (
                      <motion.div
                        id="dashboard-search-results"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute top-full left-0 right-0 mt-3 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#002147] shadow-[0_24px_60px_-16px_rgba(15,23,42,0.28)] dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.60)] backdrop-blur-xl z-[100]"
                      >
                        <div className="border-b border-slate-200 dark:border-[#1a3884]/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>{searchQuery.trim() ? "Search results" : "Quick Navigation"}</span>
                          {!searchQuery.trim() && (
                            <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">Click any page to jump there</span>
                          )}
                        </div>

                        {searchResults.length > 0 ? (
                          <div className="max-h-[360px] overflow-y-auto py-2">
                            {searchResults.map((item, index) => (
                              <button
                                key={item.id}
                                type="button"
                                onMouseEnter={() => setActiveSearchIndex(index)}
                                onClick={() => handleSearchNavigation(item)}
                                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${index === activeSearchIndex
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800/85"
                                  }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                      {item.title}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.type === 'Page' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' :
                                      item.type === 'Course' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300' :
                                        item.type === 'Track' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' :
                                          'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'
                                      }`}>
                                      {item.type}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                    {item.subtitle}
                                  </p>
                                </div>
                                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              No matching results found
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Try: "career", "courses", "toolkit", "wallet", "settings"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT SECTION: Unified Dock */}
              <div className="flex items-center gap-4">

                {/* Premium Glassmorphism Dock */}
                <div className="hidden sm:flex items-center p-1.5 bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/60 rounded-full shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]">

                  {/* 1. Live Time Widget */}
                  <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)] border border-slate-100 dark:border-slate-700/50 mr-2">
                    <div className="relative flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <div className="absolute w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 font-mono tracking-tight mt-[1px]">
                      {formatTime(currentTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 pr-1">
                    {/* 2. Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="p-1.5 rounded-full text-slate-400 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 dark:hover:text-white transition-all active:scale-95"
                      aria-label="Toggle Theme"
                    >
                      {theme === 'dark' ? <Sun size={18} stroke={1.5} className="hover:rotate-45 transition-transform duration-300" /> : <Moon size={18} stroke={1.5} className="hover:-rotate-12 transition-transform duration-300" />}
                    </button>

                    {/* 3. Notifications */}
                    <div className="relative" ref={notificationRef}>
                      <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative p-1.5 rounded-full transition-all active:scale-95 group ${showNotifications ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 dark:hover:text-white'
                          }`}
                        aria-label="Notifications"
                      >
                        <Bell size={18} stroke={1.5} className="group-hover:rotate-12 transition-transform duration-300 origin-top" />
                        {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border border-white dark:border-slate-800 rounded-full shadow-sm animate-pulse"></span>
                        )}
                      </button>

                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-[#002147] border border-slate-200/60 dark:border-white/8 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.60)] overflow-hidden z-[100]"
                          >
                            {/* Header */}
                            <div className="px-5 py-4 bg-[#1a3884] flex items-center justify-between">
                              <div className="flex items-center gap-2 text-white">
                                <Bell className="w-4 h-4" />
                                <span className="text-sm font-bold tracking-wide">{t('notifications.title', 'Notifications')}</span>
                              </div>
                              {unreadCount > 0 && (
                                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white backdrop-blur-sm">
                                  {unreadCount} {t('notifications.new', 'New')}
                                </span>
                              )}
                            </div>

                            {/* Content */}
                            <div className="max-h-[360px] overflow-y-auto bg-white dark:bg-[#002147]">
                              {notifications.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {notifications.slice(0, 5).map((n) => (
                                    <div
                                      key={n._id}
                                      onClick={() => {
                                        navigate('/notifications');
                                        setShowNotifications(false);
                                      }}
                                      className={`px-5 py-4 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-slate-50/40 dark:bg-slate-800/20' : ''}`}
                                    >
                                      <div className="flex gap-3">
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'course' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                          n.type === 'assessment' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                            'bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-400'
                                          }`}>
                                          {n.type === 'course' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-3">
                                          <div className="flex items-start gap-2 mb-1">
                                            {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[#1a3884] dark:bg-blue-400 shrink-0 mt-[5px]" />}
                                            <p className={`text-[12px] leading-relaxed ${!n.isRead ? 'font-bold text-[#0d1f4e] dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                                              {n.message}
                                            </p>
                                          </div>
                                          <p className={`text-[10px] text-slate-400 ${!n.isRead ? 'ml-3.5' : ''}`}>
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                  <div className="w-16 h-16 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                    <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                  </div>
                                  <p className="text-sm font-medium">{t('notifications.empty.no_notifications', 'No notifications yet')}</p>
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <button
                              onClick={() => {
                                navigate('/notifications');
                                setShowNotifications(false);
                              }}
                              className="w-full py-3 bg-[#F8FAFC] dark:bg-slate-800/50 border-t border-slate-100 dark:border-[#1a3884]/15 text-xs font-bold text-[#1a3884] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#002A5C] transition-colors flex items-center justify-center gap-2"
                            >
                              {t('notifications.view_all_notifications', 'View all notifications')}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 4. Language Switcher */}
                    <div className="relative" ref={languageRef}>
                      <button
                        onClick={() => setShowLanguages(!showLanguages)}
                        className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all active:scale-95 group ${showLanguages
                          ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 dark:hover:text-white'
                          }`}
                        aria-label="Change Language"
                      >
                        <Globe2 size={18} stroke={1.5} className="group-hover:rotate-[24deg] transition-transform duration-300" />
                        <span className="hidden md:inline text-[11px] font-bold tracking-[0.1em] mt-[1px]">
                          {activeLanguage.shortLabel}
                        </span>
                        <ChevronDown className={`hidden md:block w-3 h-3 transition-transform duration-200 ${showLanguages ? 'rotate-180 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                      </button>

                      <AnimatePresence>
                        {showLanguages && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-[#002147] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-[100]"
                          >
                            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                Language
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {activeLanguage.name}
                              </p>
                            </div>
                            <div className="p-2 space-y-1">
                              {languageOptions.map((lang) => (
                                <button
                                  key={lang.code}
                                  onClick={() => {
                                    i18n.changeLanguage(lang.code);
                                    setShowLanguages(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeLanguageCode === lang.code
                                    ? 'bg-[#1a3884] text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[10px] font-black tracking-[0.18em] ${activeLanguageCode === lang.code ? 'bg-white/16 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/8 dark:text-slate-300'}`}>
                                      {lang.shortLabel}
                                    </span>
                                    <span>{lang.name}</span>
                                  </div>
                                  <span className="text-[10px] opacity-60 font-bold">{lang.native}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 5. Daily Streak Glowing Flame Icon */}
                    <button
                      onClick={() => setShowStreakModal(true)}
                      className="relative p-1.5 rounded-full text-[#1a3884] dark:text-blue-400 hover:text-[#112b6b] dark:hover:text-blue-300 hover:bg-[#1a3884]/8 dark:hover:bg-[#1a3884]/20 transition-all active:scale-95 group"
                      aria-label="Daily Streaks"
                    >
                      <Flame size={18} stroke={1.5} className="animate-pulse filter drop-shadow-[0_0_6px_rgba(26,56,132,0.5)]" />
                      {streakCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-[#1a3884] to-[#4c6ef5] text-white font-extrabold text-[8px] px-1 rounded-full min-w-[14px] text-center border border-white dark:border-slate-800 scale-90 shadow-sm">
                          {streakCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. User Profile Card */}
                <div
                  ref={profileMenuRef}
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <motion.div
                    whileHover={{ y: -2, shadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    className="flex items-center gap-3 pl-2 sm:pr-4 py-1.5 bg-white/50 sm:bg-white dark:bg-slate-800/50 dark:sm:bg-slate-800 border-none sm:border border-slate-100 dark:border-white/10 rounded-2xl shadow-none sm:shadow-sm cursor-pointer group transition-all"
                    onClick={handleProfileClick}
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="relative shrink-0">
                      <div className="absolute -inset-0.5 bg-[#1a3884] rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity" />
                      <div className="relative p-[2px] bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-full">
                        {(profilePhoto || user?.profileImage || user?.profilePicture) ? (
                          <img
                            src={profilePhoto || (user?.profileImage?.startsWith('http') ? user.profileImage : (user?.profileImage ? `${getBackendUrl()}/${user.profileImage}` : user?.profilePicture))}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a3884] to-[#112b6b] flex items-center justify-center text-white text-[15px] font-bold pb-0.5">
                            {(user?.fullName?.charAt(0) || user?.firstName?.charAt(0) || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:block text-left">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1">
                        {t(`dashboard.${getGreeting().toLowerCase().replace(' ', '_')}`)}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1a3884] transition-colors">
                          {user?.fullName || 'User'}
                        </p>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#1a3884] transition-all duration-300 ${isProfileHovered ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </motion.div>

                  {/* Desktop hover profile dropdown */}
                  <AnimatePresence>
                    {isProfileHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-2 z-[100] hidden w-72 pointer-events-auto lg:block"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <ProfileHoverCard user={user} avatarData={avatarData} onLogout={handleLogout} onClose={closeProfileMenu} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mobile tap profile dropdown */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="fixed inset-x-0 top-[70px] bottom-0 z-[90] bg-black/40 lg:hidden"
                          onClick={closeProfileMenu}
                          aria-hidden="true"
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="fixed right-4 top-[78px] z-[100] w-[min(18rem,calc(100vw-2rem))] pointer-events-auto lg:hidden"
                        >
                          <ProfileHoverCard user={user} avatarData={avatarData} onLogout={handleLogout} onClose={closeProfileMenu} />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <div className={isFullScreenPage ? "p-0 h-screen overflow-hidden" : ((location.pathname === '/dashboard/resume-builder' || location.pathname === '/vision-board-pro/create') ? "p-0 lg:h-[calc(100vh-70px)] lg:overflow-hidden" : "")}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={(isFullScreenPage || location.pathname === '/dashboard/resume-builder' || location.pathname === '/vision-board-pro/create') ? "w-full h-full" : "max-w-[1600px]"}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Streak Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative max-w-md w-full bg-white dark:bg-[#002147] rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#1a3884] dark:text-blue-400 animate-pulse" />
                  <span className="text-sm font-bold text-[#1a3884] dark:text-white uppercase tracking-wider">
                    {t('streaks.modal_title', 'My Daily Streaks')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowStreakModal(false);
                    fetchStreak(); // Refresh the badge on close
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <StreaksWidget isModal={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
