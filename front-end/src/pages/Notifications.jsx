import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ArrowLeft,
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
  badge: 'notifications.types.badge',
  assessment: 'notifications.types.assessment',
  course: 'notifications.types.course',
  achievement: 'notifications.types.achievement',
  community: 'notifications.types.community',
  coaching: 'notifications.types.coaching',
  support: 'notifications.types.support',
  task: 'notifications.types.task',
  certificate: 'notifications.types.certificate',
  system: 'notifications.types.system',
};

const Notifications = () => {
  const { t, i18n } = useTranslation();
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
  const [dateRange, setDateRange] = useState('all_time');
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
    const options = { unreadOnly: filter === 'unread' };
    if (dateRange === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      options.startDate = start.toISOString();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      options.endDate = end.toISOString();
    } else if (dateRange === 'last_7_days') {
      const start = new Date(); start.setDate(start.getDate() - 7);
      options.startDate = start.toISOString();
    } else if (dateRange === 'last_30_days') {
      const start = new Date(); start.setDate(start.getDate() - 30);
      options.startDate = start.toISOString();
    }

    fetchNotifications(1, false, options).catch((error) => {
      console.error('Error fetching notifications:', error);
    });
  }, [fetchNotifications, filter, dateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = async () => {
    const options = { unreadOnly: filter === 'unread' };
    if (dateRange === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      options.startDate = start.toISOString();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      options.endDate = end.toISOString();
    } else if (dateRange === 'last_7_days') {
      const start = new Date(); start.setDate(start.getDate() - 7);
      options.startDate = start.toISOString();
    } else if (dateRange === 'last_30_days') {
      const start = new Date(); start.setDate(start.getDate() - 30);
      options.startDate = start.toISOString();
    }
    await fetchNotifications(1, false, options);
  };

  const loadMore = () => {
    const nextPage = (pagination?.page || 1) + 1;
    
    const options = { unreadOnly: filter === 'unread' };
    if (dateRange === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      options.startDate = start.toISOString();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      options.endDate = end.toISOString();
    } else if (dateRange === 'last_7_days') {
      const start = new Date(); start.setDate(start.getDate() - 7);
      options.startDate = start.toISOString();
    } else if (dateRange === 'last_30_days') {
      const start = new Date(); start.setDate(start.getDate() - 30);
      options.startDate = start.toISOString();
    }

    fetchNotifications(nextPage, true, options).catch((error) => {
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
        const key = interval > 1 ? `${unit}_plural` : unit;
        return t(`notifications.time.${key}`, { count: interval }, `${interval} ${unit}${interval > 1 ? 's' : ''} ago`);
      }
    }

    return t('notifications.time.just_now', 'Just now');
  };

  const groupByDate = useCallback((items) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    items.forEach((notification) => {
      const date = new Date(notification.createdAt).toDateString();
      let label;

      if (date === today) {
        label = t('notifications.groups.today', 'Today');
      } else if (date === yesterday) {
        label = t('notifications.groups.yesterday', 'Yesterday');
      } else {
        label = new Date(notification.createdAt).toLocaleDateString(i18n.language || 'en-US', {
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
  }, [t, i18n.language]);

  const groupedNotifications = useMemo(
    () => groupByDate(notifications),
    [groupByDate, notifications]
  );

  const hasMore = (pagination?.page || 1) < (pagination?.pages || 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] text-slate-900 font-sans transition-colors duration-300">
      <main className="container mx-auto max-w-6xl px-3 py-4">
        {/* Back Button - Mobile Only */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </div>
            {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#002147]"
        >
          {/* Header & Filters Section */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#1a3884] shadow-sm">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-[#0d1f4e] dark:text-white">{t('notifications.title', 'Notifications')}</h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {unreadCount > 0 ? t('notifications.unread_count', '{{count}} unread notifications', { count: unreadCount }) : t('notifications.all_caught_up', 'All caught up!')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#1a3884] dark:text-slate-400 dark:hover:bg-[#1a3884]/20 dark:hover:text-blue-400"
                  title={t('notifications.actions.refresh', 'Refresh')}
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1a3884] transition-colors hover:bg-[#1a3884]/10 dark:text-blue-400 dark:hover:bg-[#1a3884]/20"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('notifications.actions.mark_all_read', 'Mark all read')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${filter === 'all'
                      ? 'bg-[#1a3884] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a3884]/20'
                    }`}
                >
                  {t('notifications.filters.all', 'All')}
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${filter === 'unread'
                      ? 'bg-[#1a3884] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a3884]/20'
                    }`}
                >
                  {t('notifications.filters.unread', 'Unread')}
                  {unreadCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === 'unread'
                          ? 'bg-white/20'
                          : 'bg-blue-100 text-[#1a3884] dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 shadow-sm outline-none transition-colors focus:border-[#1a3884] focus:ring-1 focus:ring-[#1a3884] dark:border-white/10 dark:bg-[#002A5C] dark:text-slate-200"
                >
                  <option value="all_time">All Time</option>
                  <option value="today">Today</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="border-t border-slate-200 bg-slate-50/30 dark:border-white/10 dark:bg-[#00152E]/30">
            {isLoading ? (
              <div className="p-4"><NotificationsSkeleton /></div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50">
                  <Bell className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {filter === 'unread' ? t('notifications.empty.no_unread', 'No unread notifications') : t('notifications.empty.no_notifications', 'No notifications yet')}
                </h2>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {filter === 'unread'
                    ? t('notifications.empty.unread_desc', "You're all caught up! Check back later for new updates.")
                    : t('notifications.empty.notifications_desc', "When you get notifications, they'll appear here. Stay tuned!")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {Object.entries(groupedNotifications).map(([dateLabel, items], index) => (
                  <div key={dateLabel} className="flex flex-col">
                    <div className={`border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-white/5 dark:bg-[#00152E]/80 ${index !== 0 ? 'border-t' : ''}`}>
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {dateLabel}
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white dark:divide-white/5 dark:bg-[#002147]">
                      <AnimatePresence>
                        {items.map((notification) => {
                          const IconComponent = getIcon(notification.icon);

                          return (
                            <motion.div
                              key={notification._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`relative group transition-colors ${!notification.isRead
                                  ? 'bg-blue-50/50 dark:bg-[#1a3884]/20'
                                  : 'bg-white dark:bg-[#002147]'
                                } hover:bg-slate-50 dark:hover:bg-[#1a3884]/40`}
                            >
                              <button
                                onClick={() => handleNotificationClick(notification)}
                                className="flex w-full items-start gap-4 px-4 py-4 text-left"
                              >
                                <div
                                  className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl"
                                  style={{ backgroundColor: `${notification.color || '#1a3884'}15` }}
                                >
                                  <IconComponent
                                    className="h-5 w-5 sm:h-6 sm:w-6"
                                    style={{ color: notification.color || '#1a3884' }}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-[14px] font-bold text-[#0d1f4e] dark:text-white leading-tight mb-0.5">{notification.title}</p>
                                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1a3884]/60 dark:text-blue-400">
                                        {t(TYPE_LABELS[notification.type] || notification.type, notification.type)}
                                      </span>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                        {formatTimeAgo(notification.createdAt)}
                                      </span>
                                      {!notification.isRead && (
                                        <div className="ml-auto mt-1 h-1.5 w-1.5 rounded-full bg-[#1a3884] dark:bg-blue-400" />
                                      )}
                                    </div>
                                  </div>
                                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{notification.message}</p>
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
                                    title={t('notifications.actions.mark_as_read', 'Mark as read')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="flex justify-center border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#002147]">
                    <button
                      onClick={loadMore}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-[#F8FAFC] dark:border-white/10 dark:bg-[#002A5C] dark:text-slate-300 dark:hover:bg-[#1a3884]/30"
                    >
                      {t('notifications.actions.load_more', 'Load more notifications')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Notifications;
