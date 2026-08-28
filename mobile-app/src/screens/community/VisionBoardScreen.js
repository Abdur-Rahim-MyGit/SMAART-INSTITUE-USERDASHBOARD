/**
 * VisionBoardScreen — gallery of the student's saved vision boards.
 *
 * Port of the read side of `front-end/src/features/visionBoard/pages/VisionBoardGalleryPro.jsx`
 * against the same `/api/vision-board-pro` endpoints. This is a plain scrollable
 * list of cards, NOT the drag-and-drop canvas editor — creating/viewing a board's
 * canvas layout (slotImages/textOverlays/assetOverlays) is intentionally out of
 * scope for mobile; see VisionBoardCreateScreen/VisionBoardDetailScreen.
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
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import { visionBoardAPI } from '../../api/visionBoard';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
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

export default function VisionBoardScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [boards, setBoards] = useState([]);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await visionBoardAPI.getAllVisionBoards();
      setBoards(Array.isArray(res?.data) ? res.data : []);
      setMaxAllowed(res?.maxAllowed ?? 3);
      setCanCreateMore(res?.canCreateMore !== false);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not load your vision boards.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch every time the gallery regains focus — catches boards created via
  // VisionBoardCreateScreen without wiring a manual refresh callback through params.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const goCreate = () => {
    if (!canCreateMore) return;
    navigation.navigate('VisionBoardCreate');
  };

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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Manifest your future</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Vision Board</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: themeColors.pillBg }]}>
          <Feather name="grid" size={12} color={themeColors.primaryBright} />
          <Text style={[styles.countText, { color: themeColors.primaryBright }]}>
            {boards.length}/{maxAllowed}
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
        <PressCard
          onPress={goCreate}
          disabled={!canCreateMore}
          style={[
            styles.newBtn,
            {
              backgroundColor: canCreateMore ? themeColors.primaryBright : themeColors.card,
              borderColor: canCreateMore ? themeColors.primaryBright : themeColors.border,
              opacity: canCreateMore ? 1 : 0.6,
            },
          ]}
        >
          <Feather name="plus" size={16} color={canCreateMore ? '#FFFFFF' : themeColors.textMuted} />
          <Text style={[styles.newBtnText, { color: canCreateMore ? '#FFFFFF' : themeColors.textMuted }]}>
            {canCreateMore ? 'New Vision Board' : `Limit reached (${maxAllowed} max)`}
          </Text>
        </PressCard>

        {loading ? (
          <View style={{ gap: 14, marginTop: 16 }}>
            {[0, 1].map((i) => (
              <SkeletonBox key={i} width="100%" height={210} borderRadius={20} />
            ))}
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
        ) : boards.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="image" size={30} color={themeColors.iconMuted} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No vision boards yet</Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              Create a board with your short and long-term goals to keep your future front of mind.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14, marginTop: 16 }}>
            {boards.map((board, index) => {
              const goalCount =
                (board.shortTermGoals?.length || 0) + (board.longTermGoals?.length || 0);
              return (
                <AnimatedSection key={board._id} delay={index * 60}>
                  <PressCard
                    onPress={() => navigation.navigate('VisionBoardDetail', { id: board._id })}
                    style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                  >
                    <View style={[styles.cover, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#DDEFF8' }]}>
                      {board.collageImage ? (
                        <Image source={{ uri: board.collageImage }} style={styles.coverImg} resizeMode="cover" />
                      ) : (
                        <Feather name="image" size={34} color={themeColors.iconMuted} />
                      )}
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.cardRow}>
                        <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>
                          {board.title || 'Untitled Vision Board'}
                        </Text>
                        {goalCount > 0 && (
                          <View style={[styles.goalPill, { backgroundColor: themeColors.pillBg }]}>
                            <Text style={[styles.goalPillText, { color: themeColors.primaryBright }]}>
                              {goalCount} goal{goalCount === 1 ? '' : 's'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {!!board.description && (
                        <Text style={[styles.cardDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                          {board.description}
                        </Text>
                      )}

                      <Text style={[styles.cardDate, { color: themeColors.iconMuted }]}>
                        Created {formatDate(board.createdAt)}
                      </Text>
                    </View>
                  </PressCard>
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
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  countText: { fontSize: 11, fontWeight: '800' },

  scroll: { padding: 20, paddingBottom: 40 },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 16, paddingVertical: 14,
  },
  newBtnText: { fontSize: 14, fontWeight: '800' },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
  },
  retryText: { fontSize: 12.5, fontWeight: '700' },

  card: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  cover: { width: '100%', height: 150, alignItems: 'center', justifyContent: 'center' },
  coverImg: { width: '100%', height: '100%' },
  cardBody: { padding: 15, gap: 5 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15.5, fontWeight: '800' },
  goalPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  goalPillText: { fontSize: 10, fontWeight: '800' },
  cardDesc: { fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  cardDate: { fontSize: 10.5, fontWeight: '600', marginTop: 4, letterSpacing: 0.3 },
});
