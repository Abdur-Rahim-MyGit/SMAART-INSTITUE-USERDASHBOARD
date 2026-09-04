/**
 * PerformanceScreen — cross-app progression & usage analytics (FR mirrors
 * web's `front-end/src/pages/Performance.jsx` -> `StudentAnalyticsView` in
 * `front-end/src/components/AnalyticsCharts.jsx`).
 *
 * Distinct from AssessmentsScreen.js: that screen is the T1-T4 stage
 * dashboard (take/track assessments); this screen is the separate
 * "Performance" sidebar destination web splits out — a read-only snapshot of
 * course progress, hours spent, and a usage trend, sourced from the single
 * `GET /analytics/student` endpoint (`back-end/controllers/analyticsController.js
 * #getStudentAnalytics`).
 *
 * Deliberately NOT ported: the web page's date-picker'd historical explorer,
 * its hardcoded-minute per-category time breakdown, and its reconstructed
 * activity-event timeline sourced from browser localStorage session logs —
 * none of those are real tracked-on-the-server data (see mobile audit notes).
 * This screen renders only the three fields that are: `metrics`, `courses`,
 * and `timeline`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { getStudentAnalytics } from '../../api/analytics';

const STATUS_META = {
  completed: { label: 'Completed', color: '#10B981', icon: 'check-circle' },
  in_progress: { label: 'In progress', color: '#1478B8', icon: 'play-circle' },
  enrolled: { label: 'Enrolled', color: '#F59E0B', icon: 'circle' },
};

function statusMeta(status, themeColors) {
  return (
    STATUS_META[status] || { label: status || 'Unknown', color: themeColors.textMuted, icon: 'circle' }
  );
}

function formatShortDate(value) {
  if (!value) return '';
  // Timeline dates can carry a trailing "HH:MM" (see analyticsController's
  // getStudentTimeline) — only the calendar date matters for display.
  const datePart = String(value).split(' ')[0];
  const d = new Date(datePart);
  if (Number.isNaN(d.getTime())) return datePart;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function formatHours(minutesOrHours, isHours = false) {
  const hours = isHours ? minutesOrHours : (minutesOrHours || 0) / 60;
  if (!hours) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`;
}

function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function PressCard({ onPress, disabled, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function PerformanceScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getStudentAnalytics();
      setMetrics(res?.metrics || null);
      setCourses(Array.isArray(res?.courses) ? res.courses : []);
      setTimeline(Array.isArray(res?.timeline) ? res.timeline : []);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not load your performance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => navigation.addListener('focus', load), [navigation, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  const maxTimelineProgress = Math.max(1, ...timeline.map((t) => t.progress || 0));

  const tiles = metrics
    ? [
        { key: 'avgProgress', label: 'Avg. progress', value: `${metrics.avgProgress ?? 0}%`, icon: 'trending-up', color: '#1478B8' },
        { key: 'hours', label: 'Hours spent', value: formatHours(metrics.totalHoursSpent, true), icon: 'clock', color: '#F59E0B' },
        { key: 'completed', label: 'Completed', value: `${metrics.completedCourses ?? 0}`, icon: 'check-circle', color: '#10B981' },
        { key: 'inProgress', label: 'In progress', value: `${metrics.inProgressCourses ?? 0}`, icon: 'play-circle', color: '#8B5CF6' },
      ]
    : [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Progress & usage</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Performance</Text>
        </View>
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
            <View style={styles.tileGrid}>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBox key={i} width="47%" height={92} borderRadius={16} />
              ))}
            </View>
            <SkeletonBox width="100%" height={140} borderRadius={18} />
            {[0, 1, 2].map((i) => (
              <SkeletonBox key={`c${i}`} width="100%" height={84} borderRadius={16} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Feather name="alert-triangle" size={26} color={themeColors.danger} />
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{error}</Text>
            <PressCard
              onPress={retry}
              style={[styles.retryBtn, { backgroundColor: themeColors.primaryBright }]}
            >
              <Feather name="refresh-cw" size={13} color="#FFFFFF" />
              <Text style={styles.retryText}>Try again</Text>
            </PressCard>
          </View>
        ) : (
          <>
            <AnimatedSection delay={0}>
            <View style={styles.tileGrid}>
              {tiles.map((tile) => (
                <View
                  key={tile.key}
                  style={[styles.tile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                >
                  <View style={[styles.tileIcon, { backgroundColor: `${tile.color}1F` }]}>
                    <Feather name={tile.icon} size={15} color={tile.color} />
                  </View>
                  <Text style={[styles.tileValue, { color: themeColors.text }]}>{tile.value}</Text>
                  <Text style={[styles.tileLabel, { color: themeColors.textMuted }]}>{tile.label}</Text>
                </View>
              ))}
            </View>
            </AnimatedSection>

            {timeline.length > 0 && (
              <AnimatedSection delay={80}>
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>RECENT TREND</Text>
                <View
                  style={[styles.trendCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendRow}>
                    {timeline.map((point, idx) => {
                      const pct = Math.max(0.04, (point.progress || 0) / maxTimelineProgress);
                      return (
                        <View key={`${point.date}-${idx}`} style={styles.trendBarWrap}>
                          <Text style={[styles.trendValue, { color: themeColors.text }]}>{point.progress ?? 0}%</Text>
                          <View style={[styles.trendTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEF2F7' }]}>
                            <View
                              style={[
                                styles.trendFill,
                                { height: `${Math.round(pct * 100)}%`, backgroundColor: themeColors.primaryBright },
                              ]}
                            />
                          </View>
                          <Text style={[styles.trendDate, { color: themeColors.textMuted }]}>
                            {formatShortDate(point.date)}
                          </Text>
                          <Text style={[styles.trendHours, { color: themeColors.textMuted }]}>
                            {formatHours(point.hoursSpent, true)}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
              </AnimatedSection>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>COURSE PROGRESS</Text>

              {courses.length === 0 ? (
                <View style={styles.empty}>
                  <Feather name="bar-chart-2" size={30} color={themeColors.iconMuted} />
                  <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No courses yet</Text>
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                    Enroll in a course from Learning to start tracking your progress here.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {courses.map((c, idx) => {
                    const meta = statusMeta(c.status, themeColors);
                    const title = c.course?.title || c.course?.courseCode || c.course?.code || 'Course';
                    const progress = Math.max(0, Math.min(100, c.progress || 0));
                    return (
                      <AnimatedSection key={c._id} delay={140 + idx * 50}>
                      <View
                        style={[styles.courseCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                      >
                        <View style={styles.courseTop}>
                          <Text style={[styles.courseTitle, { color: themeColors.text }]} numberOfLines={2}>
                            {title}
                          </Text>
                          <View style={styles.statusWrap}>
                            <Feather name={meta.icon} size={11} color={meta.color} />
                            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                          </View>
                        </View>

                        <View style={[styles.courseTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F7' }]}>
                          <View
                            style={[
                              styles.courseFill,
                              { width: `${progress}%`, backgroundColor: meta.color },
                            ]}
                          />
                        </View>

                        <View style={styles.courseMetaRow}>
                          <Text style={[styles.courseMetaText, { color: themeColors.textMuted }]}>
                            {progress}% complete
                          </Text>
                          <View style={styles.courseMetaItem}>
                            <Feather name="clock" size={11} color={themeColors.textMuted} />
                            <Text style={[styles.courseMetaText, { color: themeColors.textMuted }]}>
                              {formatHours(c.totalTimeSpent)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      </AnimatedSection>
                    );
                  })}
                </View>
              )}
            </View>
          </>
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

  scroll: { padding: 20, paddingBottom: 40 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  tile: { width: '47%', borderWidth: 1, borderRadius: 16, padding: 14 },
  tileIcon: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  tileValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  tileLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  section: { marginBottom: 22 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12 },

  trendCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  trendRow: { flexDirection: 'row', gap: 18, alignItems: 'flex-end', paddingRight: 4 },
  trendBarWrap: { alignItems: 'center', width: 42 },
  trendValue: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  trendTrack: { width: 14, height: 80, borderRadius: 7, overflow: 'hidden', justifyContent: 'flex-end' },
  trendFill: { width: '100%', borderRadius: 7 },
  trendDate: { fontSize: 10, fontWeight: '700', marginTop: 8 },
  trendHours: { fontSize: 9.5, fontWeight: '600', marginTop: 1 },

  courseCard: { borderWidth: 1, borderRadius: 16, padding: 15 },
  courseTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  courseTitle: { flex: 1, fontSize: 14.5, fontWeight: '800', lineHeight: 19 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  courseTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  courseFill: { height: '100%', borderRadius: 3 },
  courseMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  courseMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  courseMetaText: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 50, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, marginTop: 4,
  },
  retryText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
});
