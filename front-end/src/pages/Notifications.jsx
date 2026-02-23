import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Trophy,
  BookOpen,
  Star,
  Users,
  Calendar,
  Headphones,
  Award,
  Clock,
  Megaphone,
  ClipboardCheck,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Icon mapping for notification types
const ICON_MAP = {
  trophy: Trophy,
  'book-open': BookOpen,
  star: Star,
  users: Users,
  calendar: Calendar,
  headphones: Headphones,
  award: Award,
  clock: Clock,
  megaphone: Megaphone,
  'clipboard-check': ClipboardCheck,
  'check-circle': Check,
  bell: Bell
};

const TYPE_LABELS = {
  badge: 'Badges',
  assessment: 'Assessments',
  course: 'Courses',
  achievement: 'Achievements',
  community: 'Community',
  coaching: 'Coaching',
  support: 'Support',
  task: 'Tasks',
  certificate: 'Certificates',
  system: 'System'
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  // Get auth headers
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    
    try {
      const unreadOnly = filter === 'unread' ? 'true' : 'false';
      const response = await fetch(
        `${API_BASE_URL}/notifications?page=${pageNum}&limit=20&unreadOnly=${unreadOnly}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (append) {
            setNotifications(prev => [...prev, ...(data.notifications || [])]);
          } else {
            setNotifications(data.notifications || []);
          }
          setUnreadCount(data.unreadCount || 0);
          setHasMore(data.pagination?.page < data.pagination?.pages);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/summary`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  // Initial fetch and filter change
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, false);
    fetchSummary();
  }, [filter, fetchNotifications, fetchSummary]);

  // Load more
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Get icon component
  const getIcon = (iconName) => {
    return ICON_MAP[iconName] || Bell;
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    
    return 'Just now';
  };

  // Format full date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group notifications by date
  const groupByDate = (notifications) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toDateString();
      let label;
      
      if (date === today) {
        label = 'Today';
      } else if (date === yesterday) {
        label = 'Yesterday';
      } else {
        label = new Date(notification.createdAt).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(notification);
    });

    return groups;
  };

  const groupedNotifications = groupByDate(notifications);

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0B1120] text-slate-900 font-sans transition-colors duration-300">
      <DashboardSidebar />
      
      <div className="min-h-screen transition-all duration-300 pb-20 lg:pb-0">
        <DashboardHeader />

        <main className="container mx-auto px-3 py-4 max-w-6xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchNotifications(1, false)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Clear all</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      filter === 'unread' ? 'bg-white/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Consolidated Summary Card */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-br from-blue-900 to-indigo-800 dark:from-slate-800 dark:to-slate-800 rounded-xl p-5 text-white shadow-lg border border-blue-800 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Welcome back, {summary.fullName}!</h2>
                    <p className="text-blue-200 dark:text-slate-400 text-sm mt-1">Here's your daily summary</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-100 dark:text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span>Current Session: {new Date(summary.currentLogin).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                  {/* Last Login */}
                  <div className="bg-white/10 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="text-blue-200 dark:text-slate-400 text-xs uppercase tracking-wide">Last Login</div>
                    <div className="text-white font-semibold mt-1">
                      {summary.lastLogin 
                        ? new Date(summary.lastLogin).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })
                        : 'First login!'
                      }
                    </div>
                  </div>
                  
                  {/* Badges Earned */}
                  <div className="bg-white/10 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="text-blue-200 dark:text-slate-400 text-xs uppercase tracking-wide">Badges Earned</div>
                    <div className="text-white font-semibold mt-1 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      {summary.badgesEarned}
                    </div>
                  </div>
                  
                  {/* Today's Progress */}
                  <div className="bg-white/10 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="text-blue-200 dark:text-slate-400 text-xs uppercase tracking-wide">Today's Sessions</div>
                    <div className="text-white font-semibold mt-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {summary.todayCompletedSessions} completed
                    </div>
                  </div>
                  
                  {/* Total Enrollments */}
                  <div className="bg-white/10 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="text-blue-200 dark:text-slate-400 text-xs uppercase tracking-wide">Enrolled Courses</div>
                    <div className="text-white font-semibold mt-1">
                      {summary.totalEnrollments}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
            >
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  {filter === 'unread' 
                    ? "You're all caught up! Check back later for new updates."
                    : "When you get notifications, they'll appear here. Stay tuned!"
                  }
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    {dateLabel}
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
                    <AnimatePresence>
                    {items.map((notification) => {
                      const IconComponent = getIcon(notification.icon);
                      
                      return (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`relative group ${
                            !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-800'
                          } hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
                        >
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="w-full text-left px-4 py-4 flex items-start gap-4"
                          >
                            {/* Icon */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${notification.color || '#1a3884'}15` }}
                            >
                              <IconComponent
                                className="w-6 h-6"
                                style={{ color: notification.color || '#1a3884' }}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                    {TYPE_LABELS[notification.type] || notification.type}
                                  </span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {formatTimeAgo(notification.createdAt)}
                                  </span>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full ml-auto mt-1" />
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {notification.message}
                              </p>
                              {/* Hyperlinks removed - display only mode */}
                            </div>
                          </button>

                          {/* Actions on hover */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Load more notifications
                </button>
              </div>
            )}
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;

