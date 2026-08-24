/**
 * NotificationsScreen — the notification centre (SRS Phase 7, FR-SUP-03).
 *
 * Port of `front-end/src/pages/Notifications.jsx` against the same
 * `back-end/routes/notifications.js` endpoints. Replaces the ComingSoon stub.
 *
 * Two behaviours worth knowing:
 *
 *  - Every mutation is optimistic and reverts on failure. On a phone the
 *    request may be travelling over a slow campus network, and a tap that
 *    appears to do nothing for two seconds reads as a broken app. The server
 *    is still the authority — a rejection puts the row back exactly as it was.
 *
 *  - Tapping a notification marks it read AND follows its `link` when the app
 *    has a matching route. Links are authored web-side as paths like
 *    `/dashboard/assessments`, so they are mapped, not navigated to blindly.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  isUnread,
} from '../../api/notifications';

/**
 * Web link path → mobile route. Anything not listed simply marks as read and
 * stays put, which is the right failure mode: never throw a student onto a
 * screen that does not exist on this platform.
 *
 * `tab: true` marks the five screens that live inside MainTabs rather than the
 * root stack. They cannot be navigated to directly from here — they have to be
 * addressed through their navigator, which is the same rule HomeScreen's
 * shortcut tiles follow (`handleShortcutPress`).
 */
const LINK_ROUTES = [
  [/^\/dashboard\/assessments/, 'Assessments', false],
  [/^\/dashboard\/(courses|my-courses|course)/, 'Learning', true],
  [/^\/dashboard\/(placement|jobs)/, 'Career', true],
  [/^\/dashboard\/community/, 'Community', true],
  [/^\/dashboard\/(profile|settings)/, 'Profile', true],
  [/^\/dashboard\/certificates?/, 'Certificates', false],
  [/^\/dashboard\/performance/, 'Performance', false],
  [/^\/dashboard\/(tickets|support|grievances)/, 'Support', false],
  [/^\/dashboard\/notes/, 'Notes', false],
];

/** @returns {{ screen: string, tab: boolean } | null} */
const routeForLink = (link) => {
  if (!link || typeof link !== 'string') return null;
  const match = LINK_ROUTES.find(([re]) => re.test(link));
  return match ? { screen: match[1], tab: match[2] } : null;
};

/** Notification `type` → an icon and a tone. Unknown types fall back to a bell. */
const TYPE_META = {
  assessment: { icon: 'clipboard', tone: 'primaryBright' },
  result: { icon: 'award', tone: 'success' },
  course: { icon: 'book-open', tone: 'primaryBright' },
  badge: { icon: 'award', tone: 'warning' },
  certificate: { icon: 'file-text', tone: 'success' },
  placement: { icon: 'briefcase', tone: 'primaryBright' },
  community: { icon: 'message-circle', tone: 'primaryBright' },
  proctoring: { icon: 'video', tone: 'warning' },
  warning: { icon: 'alert-triangle', tone: 'warning' },
  alert: { icon: 'alert-circle', tone: 'danger' },
  system: { icon: 'settings', tone: 'textMuted' },
};

const metaFor = (n) => TYPE_META[n?.type] || { icon: n?.icon || 'bell', tone: 'primaryBright' };

/** "just now" / "4h ago" / "12 Aug" — short enough for a list row. */
function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

export default function NotificationsScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getNotifications({ limit: 50 });
      setItems(Array.isArray(res?.notifications) ? res.notifications : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh whenever the screen regains focus — a result can land while the
  // student is elsewhere in the app, and a stale bell is worse than no bell.
  useEffect(() => navigation.addListener('focus', load), [navigation, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items]);
  const visible = useMemo(
    () => (filter === 'unread' ? items.filter(isUnread) : items),
    [items, filter]
  );

  /** Mark read locally first; put it back if the server disagrees. */
  const openNotification = async (n) => {
    const wasUnread = isUnread(n);
    if (wasUnread) {
      setItems((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: true, read: true } : x))
      );
      try {
        await markRead(n._id);
      } catch {
        setItems((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, isRead: false, read: false } : x))
        );
      }
    }

    const route = routeForLink(n.link);
    if (route) {
      if (route.tab) navigation.navigate('MainTabs', { screen: route.screen });
      else navigation.navigate(route.screen);
    }
  };

  const onMarkAllRead = async () => {
    if (!unreadCount || busy) return;
    const previous = items;
    setBusy(true);
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true, read: true })));
    try {
      await markAllRead();
    } catch {
      setItems(previous);
      Alert.alert("Couldn't update", 'Your notifications are unchanged. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (n) => {
    const previous = items;
    setItems((prev) => prev.filter((x) => x._id !== n._id));
    try {
      await deleteNotification(n._id);
    } catch {
      setItems(previous);
      Alert.alert("Couldn't delete", 'The notification is still there. Please try again.');
    }
  };

  const onClearAll = () => {
    if (!items.length || busy) return;
    Alert.alert('Clear all notifications?', 'This removes every notification. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          const previous = items;
          setBusy(true);
          setItems([]);
          try {
            await clearAllNotifications();
          } catch {
            setItems(previous);
            Alert.alert("Couldn't clear", 'Your notifications are unchanged. Please try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.bg}
      />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderColor: themeColors.border,
            },
          ]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are up to date'}
          </Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Notifications</Text>
        </View>
        {items.length > 0 && (
          <Pressable onPress={onClearAll} hitSlop={10} disabled={busy}>
            <Feather name="trash-2" size={18} color={themeColors.iconMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? themeColors.primaryBright : themeColors.card,
                    borderColor: active ? themeColors.primaryBright : themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.chipText, { color: active ? '#FFFFFF' : themeColors.textMuted }]}
                >
                  {f.label}
                  {f.key === 'unread' && unreadCount > 0 ? ` · ${unreadCount}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {unreadCount > 0 && (
          <Pressable onPress={onMarkAllRead} hitSlop={8} disabled={busy}>
            <Text style={[styles.markAll, { color: themeColors.primaryBright, opacity: busy ? 0.5 : 1 }]}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primaryBright}
            colors={[themeColors.primaryBright]}
          />
        }
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBox key={i} width="100%" height={78} borderRadius={16} />
            ))}
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Feather
              name={filter === 'unread' ? 'check-circle' : 'bell-off'}
              size={30}
              color={themeColors.iconMuted}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              {filter === 'unread'
                ? 'You have read everything. Nice.'
                : 'Results, badges, announcements and placement updates will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {visible.map((n) => {
              const unread = isUnread(n);
              const meta = metaFor(n);
              const tint = themeColors[meta.tone] || themeColors.primaryBright;
              return (
                <Pressable
                  key={n._id}
                  onPress={() => openNotification(n)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: unread ? tint : themeColors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${tint}1A` }]}>
                    <Feather name={meta.icon} size={17} color={tint} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTop}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: themeColors.text, fontWeight: unread ? '800' : '600' },
                        ]}
                        numberOfLines={1}
                      >
                        {n.title || 'Notification'}
                      </Text>
                      {unread && <View style={[styles.dot, { backgroundColor: tint }]} />}
                    </View>

                    {!!n.message && (
                      <Text
                        style={[styles.cardBody, { color: themeColors.textMuted }]}
                        numberOfLines={3}
                      >
                        {n.message}
                      </Text>
                    )}

                    <View style={styles.cardFoot}>
                      <Text style={[styles.time, { color: themeColors.iconMuted }]}>
                        {timeAgo(n.createdAt)}
                      </Text>
                      {!!routeForLink(n.link) && (
                        <Text style={[styles.openHint, { color: tint }]}>Tap to open</Text>
                      )}
                    </View>
                  </View>

                  <Pressable
                    hitSlop={10}
                    onPress={() => remove(n)}
                    style={styles.removeBtn}
                    accessibilityLabel="Delete notification"
                  >
                    <Feather name="x" size={15} color={themeColors.iconMuted} />
                  </Pressable>
                </Pressable>
              );
            })}
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 11.5, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },

  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14,
  },
  filters: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  markAll: { fontSize: 12.5, fontWeight: '800' },

  scroll: { padding: 20, paddingBottom: 40 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: 16, padding: 14,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14.5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardBody: { fontSize: 12.5, fontWeight: '500', lineHeight: 18, marginTop: 3 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  time: { fontSize: 11, fontWeight: '600' },
  openHint: { fontSize: 11, fontWeight: '800' },
  removeBtn: { paddingLeft: 4, paddingTop: 2 },
});
