/**
 * VisionBoardDetailScreen — read-only view of one vision board.
 *
 * Port of the "presentation" half of
 * `front-end/src/features/visionBoard/pages/VisionBoardView.jsx`: hero cover
 * image, title/description, then Short-Term / Long-Term goal lists. The web
 * page's canvas-editor state (slotImages/textOverlays/assetOverlays) only
 * makes sense inside the drag-and-drop editor's coordinate system and is
 * deliberately NOT rendered here — no canvas, no drag, read-only goals only.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
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
import { visionBoardAPI } from '../../api/visionBoard';

function formatDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
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

function GoalList({ label, icon, goals, themeColors }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHead}>
        <Feather name={icon} size={13} color={themeColors.primaryBright} />
        <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{label}</Text>
      </View>
      {goals.length === 0 ? (
        <Text style={[styles.noGoals, { color: themeColors.iconMuted }]}>No goals added yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {goals.map((goal, i) => (
            <View
              key={`${label}-${i}`}
              style={[styles.goalRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            >
              <View style={[styles.goalDot, { backgroundColor: themeColors.pillBg }]}>
                <Feather name="check" size={11} color={themeColors.primaryBright} />
              </View>
              <Text style={[styles.goalText, { color: themeColors.text }]}>{goal}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function VisionBoardDetailScreen({ navigation, route }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';
  const boardId = route?.params?.id;

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!boardId) {
      setError('Missing vision board id.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await visionBoardAPI.getVisionBoard(boardId);
      setBoard(res?.data || null);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not load this vision board.');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Presentation view</Text>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {board?.title || 'Vision Board'}
          </Text>
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
          <View style={{ gap: 14 }}>
            <SkeletonBox width="100%" height={220} borderRadius={20} />
            <SkeletonBox width="60%" height={20} borderRadius={8} />
            <SkeletonBox width="100%" height={80} borderRadius={12} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Feather name="alert-triangle" size={26} color={themeColors.danger} />
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{error}</Text>
            <Pressable
              onPress={load}
              style={[styles.retryBtn, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
            >
              <Feather name="refresh-cw" size={13} color={themeColors.text} />
              <Text style={[styles.retryText, { color: themeColors.text }]}>Retry</Text>
            </Pressable>
          </View>
        ) : !board ? (
          <View style={styles.empty}>
            <Feather name="image" size={30} color={themeColors.iconMuted} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Vision board not found</Text>
          </View>
        ) : (
          <View style={{ gap: 22 }}>
            <AnimatedSection delay={0}>
              <View
                style={[
                  styles.hero,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#DDEFF8', borderColor: themeColors.border },
                ]}
              >
                {board.collageImage ? (
                  <Image source={{ uri: board.collageImage }} style={styles.heroImg} resizeMode="cover" />
                ) : (
                  <View style={styles.heroEmpty}>
                    <Feather name="image" size={30} color={themeColors.iconMuted} />
                    <Text style={[styles.heroEmptyText, { color: themeColors.iconMuted }]}>
                      This vision board is empty
                    </Text>
                  </View>
                )}
              </View>
            </AnimatedSection>

            <AnimatedSection delay={80}>
              <View style={{ gap: 8 }}>
                <Text style={[styles.boardTitle, { color: themeColors.text }]}>{board.title}</Text>
                <View style={styles.metaRow}>
                  <Feather name="calendar" size={12} color={themeColors.iconMuted} />
                  <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                    Created {formatDate(board.createdAt)}
                  </Text>
                </View>
                {!!board.description && (
                  <Text style={[styles.boardDesc, { color: themeColors.textMuted }]}>{board.description}</Text>
                )}
              </View>
            </AnimatedSection>

            <AnimatedSection delay={140}>
              <GoalList
                label="Short-Term Goals"
                icon="zap"
                goals={Array.isArray(board.shortTermGoals) ? board.shortTermGoals : []}
                themeColors={themeColors}
              />
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <GoalList
                label="Long-Term Goals"
                icon="flag"
                goals={Array.isArray(board.longTermGoals) ? board.longTermGoals : []}
                themeColors={themeColors}
              />
            </AnimatedSection>
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

  scroll: { padding: 20, paddingBottom: 40 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
  },
  retryText: { fontSize: 12.5, fontWeight: '700' },

  hero: { width: '100%', height: 260, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%' },
  heroEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroEmptyText: { fontSize: 12.5, fontWeight: '600' },

  boardTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '600' },
  boardDesc: { fontSize: 13.5, lineHeight: 21, marginTop: 4 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  noGoals: { fontSize: 12.5, fontStyle: 'italic' },

  goalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12,
  },
  goalDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  goalText: { flex: 1, fontSize: 13.5, fontWeight: '600', lineHeight: 19 },
});
