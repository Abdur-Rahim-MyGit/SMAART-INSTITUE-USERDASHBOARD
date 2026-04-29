import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw,
} from 'lucide-react';
import { NotificationsSkeleton } from '@/components/SkeletonPatterns';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiCall } from '@/services/api';

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
  bell: Bell,
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
  system: 'System',
};

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    wsStatus,
    isLoading,
    pagination,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
    fetchNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  const fetchSummary = useCallback(async () => {
    try {
      const data = await apiCall('/notifications/summary');
      if (data?.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, false, { unreadOnly: filter === 'unread' }).catch((error) => {
      console.error('Error fetching notifications:', error);
    });
  }, [fetchNotifications, filter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = async () => {
    await Promise.all([
      fetchNotifications(1, false, { unreadOnly: filter === 'unread' }),
      fetchSummary(),
    ]);
  };

  const loadMore = () => {
    const nextPage = (pagination?.page || 1) + 1;
    fetchNotifications(nextPage, true, { unreadOnly: filter === 'unread' }).catch((error) => {
      console.error('Error loading more notifications:', error);
    });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (iconName) => ICON_MAP[iconName] || Bell;

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  };

  const groupByDate = useCallback((items) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    items.forEach((notification) => {
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
          day: 'numeric',
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(notification);
    });

    return groups;
  }, []);

  const groupedNotifications = useMemo(
    () => groupByDate(notifications),
    [groupByDate, notifications]
  );

  const hasMore = (pagination?.page || 1) < (pagination?.pages || 1);

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0B1120] text-slate-900 font-sans transition-colors duration-300">
      <main className="container mx-auto max-w-6xl px-3 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      wsStatus === 'connected'
                        ? 'bg-emerald-500'
                        : wsStatus === 'connecting'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span>
                    {wsStatus === 'connected'
                      ? 'Live updates on'
                      : wsStatus === 'connecting'
                        ? 'Connecting'
                        : 'Realtime offline'}
                  </span>
                </div>
                <button
                  onClick={handleRefresh}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  title="Refresh"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear all</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs ${
                      filter === 'unread'
                        ? 'bg-white/20'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="rounded-xl border border-blue-800 bg-gradient-to-br from-blue-900 to-indigo-800 p-5 text-white shadow-lg dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Welcome back, {summary.fullName}!</h2>
                  <p className="mt-1 text-sm text-blue-200 dark:text-slate-400">Here's your daily summary</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-100 dark:text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span>
                    Current Session: {new Date(summary.currentLogin).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-white/10 p-3 dark:bg-slate-700/50">
                  <div className="text-xs uppercase tracking-wide text-blue-200 dark:text-slate-400">Last Login</div>
                  <div className="mt-1 font-semibold text-white">
                    {summary.lastLogin
                      ? new Date(summary.lastLogin).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : 'First login!'}
                  </div>
                </div>

                <div className="rounded-lg bg-white/10 p-3 dark:bg-slate-700/50">
                  <div className="text-xs uppercase tracking-wide text-blue-200 dark:text-slate-400">Badges Earned</div>
                  <div className="mt-1 flex items-center gap-2 font-semibold text-white">
                    <Award className="h-4 w-4" />
                    {summary.badgesEarned}
                  </div>
                </div>

                <div className="rounded-lg bg-white/10 p-3 dark:bg-slate-700/50">
                  <div className="text-xs uppercase tracking-wide text-blue-200 dark:text-slate-400">Today's Sessions</div>
                  <div className="mt-1 flex items-center gap-2 font-semibold text-white">
                    <BookOpen className="h-4 w-4" />
                    {summary.todayCompletedSessions} completed
                  </div>
                </div>

                <div className="rounded-lg bg-white/10 p-3 dark:bg-slate-700/50">
                  <div className="text-xs uppercase tracking-wide text-blue-200 dark:text-slate-400">Enrolled Courses</div>
                  <div className="mt-1 font-semibold text-white">{summary.totalEnrollments}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700/50">
                <Bell className="h-12 w-12 text-slate-400 dark:text-slate-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h2>
              <p className="max-w-sm text-slate-500 dark:text-slate-400">
                {filter === 'unread'
                  ? "You're all caught up! Check back later for new updates."
                  : "When you get notifications, they'll appear here. Stay tuned!"}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <h3 className="mb-3 px-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {dateLabel}
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:divide-slate-700">
                  <AnimatePresence>
                    {items.map((notification) => {
                      const IconComponent = getIcon(notification.icon);

                      return (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`relative group transition-colors ${
                            !notification.isRead
                              ? 'bg-blue-50/50 dark:bg-blue-900/10'
                              : 'bg-white dark:bg-slate-800'
                          } hover:bg-slate-50 dark:hover:bg-slate-700/50`}
                        >
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="flex w-full items-start gap-4 px-4 py-4 text-left"
                          >
                            <div
                              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${notification.color || '#1a3884'}15` }}
                            >
                              <IconComponent
                                className="h-6 w-6"
                                style={{ color: notification.color || '#1a3884' }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                                  <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    {TYPE_LABELS[notification.type] || notification.type}
                                  </span>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {formatTimeAgo(notification.createdAt)}
                                  </span>
                                  {!notification.isRead && (
                                    <div className="ml-auto mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                  )}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{notification.message}</p>
                            </div>
                          </button>

                          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {!notification.isRead && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  markRead(notification._id);
                                }}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Load more notifications
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
