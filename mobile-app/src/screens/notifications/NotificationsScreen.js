/**
 * NotificationsScreen — real notification center.
 *
 * Port of `front-end/src/pages/Notifications.jsx` against the same
 * `back-end/routes/notifications.js` endpoints. Deliberately dropped from the
 * web version: the Socket.io live feed (IMPLEMENTATION_MAP.md explicitly asks
 * for REST + native push instead, not a 1:1 Socket.io port) and the date-range
 * filter — this refreshes on pull-to-refresh and on screen focus instead,
 * which covers the same "did anything change" need without a persistent
 * socket connection. Tapping a notification marks it read; it does not deep
 * link into web-only routes some notifications point at.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import { notificationsAPI } from '../../api/notifications';

const ICON_MAP = {
  trophy: 'award',
  'book-open': 'book-open',
  star: 'star',
  users: 'users',
  calendar: 'calendar',
  headphones: 'headphones',
  award: 'award',
  clock: 'clock',
  megaphone: 'volume-2',
  'clipboard-check': 'clipboard',
  'check-circle': 'check-circle',
  bell: 'bell',
};

const TYPE_ACCENTS = {
  badge: '#d97706',
  assessment: '#7c3aed',
  course: '#059669',
  achievement: '#1a3884',
  community: '#db2777',
  coaching: '#0d9488',
  support: '#ea580c',
  task: '#4f46e5',
  certificate: '#0891b2',
  system: '#64748b',
};

function accentFor(notification) {
  return notification.color || TYPE_ACCENTS[notification.type] || TYPE_ACCENTS.system;
}

function iconFor(notification) {
  return ICON_MAP[notification.icon] || 'bell';
}

function formatTimeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [label, secondsInUnit] of units) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) return `${interval}${label[0]} ago`;
  }
  return 'Just now';
}

function groupByDate(items) {
  const groups = [];
  const index = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  items.forEach((item) => {
    const date = new Date(item.createdAt).toDateString();
    let label;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';
    else label = new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (!(label in index)) {
      index[label] = [];
      groups.push({ label, items: index[label] });
    }
    index[label].push(item);
  });

  return groups;
}

export default function NotificationsScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (page = 1, append = false, unreadOnly = filter === 'unread') => {
    try {
      const res = await notificationsAPI.getNotifications({ page, limit: 20, unreadOnly });
      setNotifications((prev) => {
        if (!append) return res.notifications || [];
        const seen = new Set(prev.map((n) => n._id));
        return [...prev, ...(res.notifications || []).filter((n) => !seen.has(n._id))];
      });
      setUnreadCount(res.unreadCount || 0);
      setPagination(res.pagination || { page: 1, pages: 1 });
    } catch {
      if (!append) setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load(1, false);
  }, [filter, load]);

  useFocusEffect(
    useCallback(() => {
      load(1, false);
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, false);
  }, [load]);

  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    load((pagination.page || 1) + 1, true);
  }, [load, loadingMore, pagination.page]);

  const handleTap = async (notification) => {
    if (notification.isRead) return;
    setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationsAPI.markRead(notification._id);
    } catch {
      // Local state already reflects the tap; a silent failure here just means
      // the read receipt didn't reach the server — next load() reconciles it.
    }
  };

  const markAllRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsAPI.markAllRead();
    } catch {
      setNotifications(previous);
      Alert.alert("Couldn't update", 'Please try again.');
    }
  };

  const deleteOne = (notification) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
    if (!notification.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
    notificationsAPI.deleteNotification(notification._id).catch(() => {
      setNotifications(previous);
      Alert.alert("Couldn't delete", 'Please try again.');
    });
  };

  const clearAll = () => {
    Alert.alert('Clear all notifications?', 'This removes every notification from this list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          const previous = notifications;
          setNotifications([]);
          setUnreadCount(0);
          try {
            await notificationsAPI.clearAll();
          } catch {
            setNotifications(previous);
            Alert.alert("Couldn't clear", 'Please try again.');
          }
        },
      },
    ]);
  };

  const grouped = useMemo(() => groupByDate(notifications), [notifications]);
  const hasMore = (pagination.page || 1) < (pagination.pages || 1);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: themeColors.border }]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: themeColors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Text>
        </View>
        <Pressable onPress={onRefresh} hitSlop={10} style={styles.iconAction}>
          <Feather name="refresh-cw" size={18} color={themeColors.iconMuted} />
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {['all', 'unread'].map((f) => {
            const selected = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  { borderColor: themeColors.border, backgroundColor: selected ? themeColors.primaryBright : 'transparent' },
                ]}
              >
                <Text style={[styles.filterText, { color: selected ? '#FFFFFF' : themeColors.textMuted }]}>
                  {f === 'all' ? 'All' : 'Unread'}
                  {f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.toolbarActions}>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead} hitSlop={8} style={styles.textAction}>
              <Feather name="check-circle" size={13} color={themeColors.primaryBright} />
              <Text style={[styles.textActionLabel, { color: themeColors.primaryBright }]}>Mark all read</Text>
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable onPress={clearAll} hitSlop={8} style={styles.textAction}>
              <Feather name="trash-2" size={13} color={themeColors.danger} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primaryBright} colors={[themeColors.primaryBright]} />
        }
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBox key={i} width="100%" height={78} borderRadius={16} />
            ))}
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Feather name={filter === 'unread' ? 'check' : 'bell'} size={28} color={themeColors.primaryBright} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              {filter === 'unread'
                ? 'Nothing new right now. Check back later for updates.'
                : 'Course milestones, assessment results, and community activity will show up here the moment they happen.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            {grouped.map((group) => (
              <View key={group.label} style={{ gap: 10 }}>
                <Text style={[styles.groupLabel, { color: themeColors.textMuted }]}>{group.label.toUpperCase()}</Text>
                <View style={{ gap: 10 }}>
                  {group.items.map((notification) => {
                    const accent = accentFor(notification);
                    return (
                      <Pressable
                        key={notification._id}
                        onPress={() => handleTap(notification)}
                        style={[
                          styles.card,
                          {
                            backgroundColor: notification.isRead ? themeColors.card : `${themeColors.primaryBright}14`,
                            borderColor: themeColors.border,
                          },
                        ]}
                      >
                        <View style={[styles.cardIcon, { backgroundColor: `${accent}20` }]}>
                          <Feather name={iconFor(notification)} size={18} color={accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.cardTop}>
                            <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>
                              {notification.title}
                            </Text>
                            <Text style={[styles.cardTime, { color: themeColors.textMuted }]}>
                              {formatTimeAgo(notification.createdAt)}
                            </Text>
                          </View>
                          <Text style={[styles.cardMessage, { color: themeColors.textMuted }]} numberOfLines={2}>
                            {notification.message}
                          </Text>
                        </View>
                        <View style={styles.cardActions}>
                          {!notification.isRead && <View style={[styles.dot, { backgroundColor: themeColors.primaryBright }]} />}
                          <Pressable onPress={() => deleteOne(notification)} hitSlop={10}>
                            <Feather name="x" size={14} color={themeColors.iconMuted} />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            {hasMore && (
              <Pressable
                onPress={loadMore}
                disabled={loadingMore}
                style={[styles.loadMore, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={themeColors.primaryBright} />
                ) : (
                  <Text style={[styles.loadMoreText, { color: themeColors.text }]}>Load more notifications</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  iconAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  filterText: { fontSize: 12.5, fontWeight: '700' },
  toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  textAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  textActionLabel: { fontSize: 12, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 40 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 70, paddingHorizontal: 30 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  groupLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: 16, padding: 14,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  cardTime: { fontSize: 10.5, fontWeight: '600' },
  cardMessage: { fontSize: 12.5, fontWeight: '500', lineHeight: 18, marginTop: 3 },
  cardActions: { alignItems: 'center', gap: 8, paddingTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  loadMore: { alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  loadMoreText: { fontSize: 13, fontWeight: '700' },
});
