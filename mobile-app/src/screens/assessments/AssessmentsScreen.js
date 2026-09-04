/**
 * AssessmentsScreen — the T1–T4 stage dashboard.
 *
 * Replaces the `ComingSoon` stub. Mirrors the web's assessment centre: stage
 * status and per-stage attempt history come from `stageresults.js`, the same
 * two calls `AssessmentsDashboard.jsx` makes, and gating follows the same rule
 * (T1 always open, each later stage opens once the previous is complete).
 *
 * Gating shown here is presentation only — `results.js` re-checks it when an
 * attempt actually starts, so a stale client cannot open a locked stage.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import { assessmentApi } from '../../api/assessments';
import {
  STAGE_ACCENT,
  STAGE_ICON,
  STAGE_KEYS,
  STAGE_MAP,
  deriveStageLocks,
} from '../../data/assessmentStages';

function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
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

function StagePressCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function AssessmentsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = user?._id || user?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [attempts, setAttempts] = useState({});

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const statusRes = await assessmentApi.getStageStatus(userId).catch(() => null);
      const statusData = statusRes?.data || statusRes || null;
      setStatus(statusData);

      // Attempt history per stage — drives "2 of 3 attempts used" and the
      // server-side lock after the cap is hit.
      const entries = await Promise.all(
        STAGE_KEYS.map((key) =>
          assessmentApi
            .getStageAttempts(userId, key)
            .then((r) => [key, r?.data || r])
            .catch(() => [key, null])
        )
      );
      setAttempts(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Stage state can change while the player is open, so refresh on return.
  useEffect(() => navigation.addListener('focus', load), [navigation, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const locks = deriveStageLocks(status);
  const completedCount = STAGE_KEYS.filter((k) => locks[k]?.completed).length;

  const openStage = (key) => {
    const lock = locks[key];
    const info = attempts[key];

    if (!lock?.unlocked) {
      const prevIdx = STAGE_KEYS.indexOf(key) - 1;
      Alert.alert(
        'Locked',
        `Complete ${STAGE_MAP[STAGE_KEYS[prevIdx]]?.title || 'the previous stage'} first.`
      );
      return;
    }
    if (info?.locked) {
      Alert.alert('No attempts left', 'You have used every attempt for this stage. Contact your administrator.');
      return;
    }
    navigation.navigate('AssessmentPlayer', { stage: key });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

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
        <View style={styles.header}>
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
            <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Assessment Centre</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>Your Stages</Text>
          </View>
        </View>

        <AnimatedSection delay={0}>
          <View style={[styles.summary, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.summaryValue, { color: themeColors.text }]}>
              {completedCount}
              <Text style={[styles.summaryTotal, { color: themeColors.textMuted }]}> / {STAGE_KEYS.length}</Text>
            </Text>
            <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>stages completed</Text>
            <View style={[styles.summaryTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F7' }]}>
              <View
                style={[
                  styles.summaryFill,
                  {
                    width: `${(completedCount / STAGE_KEYS.length) * 100}%`,
                    backgroundColor: themeColors.primaryBright,
                  },
                ]}
              />
            </View>
          </View>
        </AnimatedSection>

        {loading ? (
          <View style={{ gap: 12 }}>
            {STAGE_KEYS.map((k) => (
              <SkeletonBox key={k} width="100%" height={128} borderRadius={18} />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {STAGE_KEYS.map((key, idx) => {
              const cfg = STAGE_MAP[key];
              const accent = STAGE_ACCENT[key];
              const lock = locks[key] || {};
              const info = attempts[key] || {};
              const used = info.attemptCount ?? 0;
              const isLast = idx === STAGE_KEYS.length - 1;

              const state = lock.completed
                ? { label: 'Completed', color: '#10B981', icon: 'check-circle' }
                : !lock.unlocked
                  ? { label: 'Locked', color: themeColors.textMuted, icon: 'lock' }
                  : info.locked
                    ? { label: 'No attempts left', color: '#EF4444', icon: 'slash' }
                    : used > 0
                      ? { label: 'In progress', color: accent, icon: 'play-circle' }
                      : { label: 'Ready', color: accent, icon: 'circle' };

              return (
                <AnimatedSection key={key} delay={100 + idx * 90}>
                  <View style={styles.row}>
                    <View style={styles.rail}>
                      <View
                        style={[
                          styles.node,
                          {
                            backgroundColor: lock.completed ? '#10B981' : lock.unlocked ? accent : themeColors.card,
                            borderColor: lock.completed ? '#10B981' : lock.unlocked ? accent : themeColors.border,
                          },
                        ]}
                      >
                        {lock.completed ? (
                          <Feather name="check" size={14} color="#FFFFFF" />
                        ) : (
                          <Feather
                            name={STAGE_ICON[key]}
                            size={14}
                            color={lock.unlocked ? '#FFFFFF' : themeColors.textMuted}
                          />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.connector,
                            { backgroundColor: lock.completed ? '#10B981' : themeColors.border },
                          ]}
                        />
                      )}
                    </View>

                    <StagePressCard
                      onPress={() => openStage(key)}
                      style={[
                        styles.card,
                        {
                          backgroundColor: themeColors.card,
                          borderColor: lock.unlocked && !lock.completed ? accent : themeColors.border,
                          borderWidth: lock.unlocked && !lock.completed ? 1.5 : 1,
                          opacity: lock.unlocked ? 1 : 0.6,
                        },
                      ]}
                    >
                      <View style={styles.cardTop}>
                        <Text style={[styles.stageKey, { color: accent }]}>{key} · {cfg.name}</Text>
                        <View style={styles.stateWrap}>
                          <Feather name={state.icon} size={11} color={state.color} />
                          <Text style={[styles.stateText, { color: state.color }]}>{state.label}</Text>
                        </View>
                      </View>

                      <Text style={[styles.cardTitle, { color: themeColors.text }]}>{cfg.title}</Text>

                      <View style={[styles.metaRow, { borderTopColor: themeColors.border }]}>
                        <View style={styles.metaItem}>
                          <Feather name="help-circle" size={11} color={themeColors.textMuted} />
                          <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                            {cfg.questionLimit} questions
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Feather name="clock" size={11} color={themeColors.textMuted} />
                          <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                            {cfg.durationMinutes} min
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Feather name="repeat" size={11} color={themeColors.textMuted} />
                          <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                            {used}/{cfg.maxAttempts}
                          </Text>
                        </View>
                      </View>
                    </StagePressCard>
                  </View>
                </AnimatedSection>
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
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 11.5, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },

  summary: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 22 },
  summaryValue: { fontSize: 32, fontWeight: '900', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  summaryTotal: { fontSize: 18, fontWeight: '700' },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginTop: -2, marginBottom: 12 },
  summaryTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  summaryFill: { height: '100%', borderRadius: 3 },

  list: {},
  row: { flexDirection: 'row' },
  rail: { width: 30, alignItems: 'center' },
  node: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  connector: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },

  card: { flex: 1, borderRadius: 18, padding: 15, marginBottom: 12, marginLeft: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  stageKey: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.7 },
  stateWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stateText: { fontSize: 10, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', gap: 15, borderTopWidth: 1, marginTop: 12, paddingTop: 11 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontWeight: '600' },
});
