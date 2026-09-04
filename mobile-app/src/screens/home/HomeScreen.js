/**
 * HomeScreen — Redesigned SMAART Institute Mobile Dashboard.
 *
 * Specific Enhancements Requested:
 *  1. Card 1 Redesign:
 *     - Minimal, clean, ultra-premium layout displaying ONLY essential current status information.
 *     - Integrated single modern 2D vector illustration (minimal_student.png) with no heavy card outline boxes.
 *     - Clear status text: Current track + completion progress % + elegant progress bar.
 *     - Single prominent CTA button ("Start T1 Assessment →" or "Continue Learning →").
 *  2. Cards 2 & 3:
 *     - Real College Announcement Banners matching web application (CollegeBanners.jsx).
 *     - Dynamic banner image overlay, announcement pill badge, and message.
 *  3. 3-Card Carousel with smooth pagination dots & motion physics.
 *  4. SideDrawer Obsidian Navy Header & White Curved Body Sheet Theme.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDrawer } from '../../context/DrawerContext';
import { useTheme } from '../../context/ThemeContext';
import { getEnrollments } from '../../api/courses';
import { getStageStatus } from '../../api/assessments';
import { getCollegeBanners } from '../../api/colleges';
import { notificationsAPI } from '../../api/notifications';
import { getStreakStatus } from '../../api/streaks';
import { getBadgeStats } from '../../api/badges';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_ROTATE_MS = 6000;

const CATEGORIES = [
  { id: 'all', label: 'All Modules' },
  { id: 'academic', label: 'Academics' },
  { id: 'career', label: 'Career & Skills' },
  { id: 'support', label: 'Support & More' },
];

const SHORTCUTS = [
  {
    key: 'courses',
    title: 'My Courses',
    description: 'Access active learning tracks',
    icon: 'book-open',
    color: '#1478B8',
    category: 'academic',
    screen: 'Learning',
    isTab: true,
  },
  {
    key: 'assessments',
    title: 'Assessments',
    description: 'T1–T4 tests and evaluation',
    icon: 'edit-3',
    color: '#10B981',
    category: 'academic',
    screen: 'Assessments',
    isTab: false,
  },
  {
    key: 'performance',
    title: 'Performance',
    description: 'Track academic analytics',
    icon: 'trending-up',
    color: '#EC4899',
    category: 'academic',
    screen: 'Performance',
    isTab: false,
  },
  {
    key: 'coach',
    title: 'AI Career Coach',
    description: 'AI guidance & path planner',
    icon: 'compass',
    color: '#06B6D4',
    category: 'career',
    screen: 'CareerCoachChat',
    isTab: false,
  },
  {
    key: 'passport',
    title: 'Skills Passport',
    description: 'View verified credentials',
    icon: 'shield',
    color: '#14B8A6',
    category: 'career',
    screen: 'Career',
    isTab: true,
  },
  {
    key: 'placement',
    title: 'Placements',
    description: 'Job postings & career fair',
    icon: 'briefcase',
    color: '#F59E0B',
    category: 'career',
    screen: 'Career',
    isTab: true,
  },
  {
    key: 'community',
    title: 'Community',
    description: 'Interact with peers & mentors',
    icon: 'users',
    color: '#6366F1',
    category: 'support',
    screen: 'Community',
    isTab: true,
  },
  {
    key: 'support',
    title: 'Grievance',
    description: 'Submit support tickets',
    icon: 'alert-circle',
    color: '#EF4444',
    category: 'support',
    screen: 'Support',
    isTab: false,
  },
  {
    key: 'faceverify',
    title: 'Face Verify',
    description: 'AI proctoring calibration',
    icon: 'camera',
    color: '#8B5CF6',
    category: 'support',
    screen: 'FaceVerificationTest',
    isTab: false,
  },
];

function initials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '👋' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '👋' };
  return { text: 'Good Evening', emoji: '👋' };
}

function pickActiveEnrollment(enrollments) {
  if (!enrollments?.length) return null;
  const inProgress = enrollments.filter((e) => e.status === 'in_progress');
  if (inProgress.length) {
    return inProgress.reduce(
      (best, e) => ((e.progress || 0) > (best.progress || 0) ? e : best),
      inProgress[0]
    );
  }
  return enrollments.find((e) => e.status !== 'completed') || enrollments[0];
}

function derivePendingAssessment(stageStatus) {
  if (!stageStatus) return 'T1';
  return ['T1', 'T2', 'T3', 'T4'].find((k) => !stageStatus[k]?.completed) || null;
}

function countCompletedStages(stageStatus) {
  if (!stageStatus) return 1;
  return ['T1', 'T2', 'T3', 'T4'].filter((k) => stageStatus[k]?.completed).length || 1;
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

/**
 * Hero illustration for the signed-in student.
 *
 * Reads the `gender` recorded at registration — `Student.gender` is an enum of
 * 'male' | 'female' | 'other' and rides on the login payload (see
 * `back-end/routes/auth.js`, where `userResponse.gender` is set) — rather than
 * inferring it from the name.
 *
 * The earlier version guessed from a keyword list plus "name ends with a or i",
 * which read Aditya, Krishna, Ravi and Surya as female and defaulted an unknown
 * name to female outright. No spelling rule reliably encodes gender, so when
 * the field is absent or recorded as 'other' this returns the neutral student
 * illustration instead of guessing.
 */
function selectAvatarSource(user) {
  const gender = String(user?.gender || '').trim().toLowerCase();
  if (gender === 'male' || gender === 'm') return require('../../../assets/avatar_boy1.png');
  if (gender === 'female' || gender === 'f') return require('../../../assets/avatar_girl.png');
  return require('../../../assets/minimal_student.png');
}

function PressCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { openDrawer } = useDrawer();
  const { theme, toggleTheme, colors } = useTheme();

  const isDark = theme === 'dark';
  const firstName = user?.fullName?.split(' ')[0] || 'Student';
  const greeting = timeOfDayGreeting();
  const collegeName = user?.college?.collegeName || user?.collegeName || 'SMAART Institute';

  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeEnrollment, setActiveEnrollment] = useState(null);
  const [stageStatus, setStageStatus] = useState(null);
  const [banners, setBanners] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  // Real quick-stats data (previously hardcoded placeholders).
  const [streakDays, setStreakDays] = useState(0);
  const [badgeStats, setBadgeStats] = useState(null);

  // Carousel & Scroll animations
  const carouselRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bobAnim]);

  const characterTranslateY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const characterScale = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const filteredShortcuts = SHORTCUTS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleShortcutPress = (item) => {
    if (item.isTab) {
      navigation.navigate('MainTabs', { screen: item.screen });
    } else {
      navigation.navigate(item.screen);
    }
  };

  const userId = user?._id || user?.id;
  const collegeId = user?.college?._id || user?.college?.id || user?.college || user?.collegeId;

  const fetchData = useCallback(async () => {
    const [enrollRes, stageRes, bannerRes, streakRes, badgeRes] = await Promise.allSettled([
      userId ? getEnrollments(userId) : Promise.resolve(null),
      userId ? getStageStatus(userId) : Promise.resolve(null),
      collegeId ? getCollegeBanners(collegeId) : Promise.resolve(null),
      getStreakStatus(),
      userId ? getBadgeStats(userId) : Promise.resolve(null),
    ]);

    if (enrollRes.status === 'fulfilled' && enrollRes.value?.data) {
      const list = enrollRes.value.data;
      setEnrolledCount(list.length);
      setActiveEnrollment(pickActiveEnrollment(list));
    }
    if (stageRes.status === 'fulfilled' && stageRes.value?.data) {
      setStageStatus(stageRes.value.data);
    }
    if (bannerRes.status === 'fulfilled' && bannerRes.value?.data) {
      setBanners(bannerRes.value.data);
    }
    if (streakRes.status === 'fulfilled' && streakRes.value?.data) {
      setStreakDays(streakRes.value.data.currentStreak ?? 0);
    }
    if (badgeRes.status === 'fulfilled' && badgeRes.value?.data) {
      setBadgeStats(badgeRes.value.data);
    }
  }, [userId, collegeId]);

  useEffect(() => {
    let cancelled = false;
    fetchData().then(() => {
      if (!cancelled) setLoadingData(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Cheap, on its own — refreshed every time Home regains focus (e.g. coming
  // back from the Notifications screen after reading something) without
  // re-running the full dashboard fetch above.
  useFocusEffect(
    useCallback(() => {
      notificationsAPI
        .getUnreadCount()
        .then((res) => setUnreadCount(res?.unreadCount || 0))
        .catch(() => {});
    }, [])
  );

  const completedCount = countCompletedStages(stageStatus);
  const pendingAssessment = derivePendingAssessment(stageStatus);

  // Fallback announcement banners if web college banners aren't configured yet
  const defaultBanners = [
    {
      _id: 'b1',
      title: 'Placement Drive 2026',
      message: 'Exclusive Campus Placement & AI Skill Assessments now open for all students.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop',
    },
    {
      _id: 'b2',
      title: 'AI Career Coach',
      message: 'Get personalized career roadmaps and 1-on-1 AI mock interview feedback.',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  const activeAnnouncementBanners = banners.length > 0 ? banners : defaultBanners;

  // Derive Essential Hero Data
  const courseTitle = activeEnrollment?.course?.title || 'Capacity: Foundations';
  const progressPct = pendingAssessment ? 0 : Math.round(activeEnrollment?.progress || 0);
  const ctaLabel = pendingAssessment ? `Start ${pendingAssessment} Assessment` : 'Continue Learning';

  // Smooth Animated Progress Bar Fill
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPct, progressAnim]);

  // Slides configuration (Slide 1: Current Status Card, Slide 2 & 3: Announcement Banners)
  const carouselSlides = [
    { type: 'progress' },
    ...activeAnnouncementBanners.map((b) => ({ type: 'banner', data: b })),
  ];

  const slideWidthWithGap = SCREEN_WIDTH - 40 + 12;

  const handleScroll = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / slideWidthWithGap);
    if (index !== activeCarouselIndex && index >= 0 && index < carouselSlides.length) {
      setActiveCarouselIndex(index);
    }
  };

  useEffect(() => {
    if (carouselSlides.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeCarouselIndex + 1) % carouselSlides.length;
      carouselRef.current?.scrollTo({
        x: nextIndex * slideWidthWithGap,
        animated: true,
      });
      setActiveCarouselIndex(nextIndex);
    }, BANNER_ROTATE_MS);
    return () => clearInterval(interval);
  }, [activeCarouselIndex, carouselSlides.length]);

  const dotWidth = (idx) => {
    const inputRange = [
      (idx - 1) * slideWidthWithGap,
      idx * slideWidthWithGap,
      (idx + 1) * slideWidthWithGap,
    ];
    return scrollX.interpolate({
      inputRange,
      outputRange: [6, 18, 6],
      extrapolate: 'clamp',
    });
  };

  const dotOpacity = (idx) => {
    const inputRange = [
      (idx - 1) * slideWidthWithGap,
      idx * slideWidthWithGap,
      (idx + 1) * slideWidthWithGap,
    ];
    return scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });
  };

  const renderSlide = (slide, index) => {
    if (slide.type === 'progress') {
      return (
        <View key="progress" style={styles.carouselSlideContainer}>
          <PressCard
            onPress={() => {
              if (pendingAssessment) {
                navigation.navigate('Assessments');
              } else {
                navigation.navigate('MainTabs', { screen: 'Learning' });
              }
            }}
            style={[
              styles.minimalHeroCard,
              {
                backgroundColor: isDark ? colors.card : '#072036',
              },
            ]}
          >
            <View style={styles.minimalCardContent}>
              <View style={styles.minimalLeftWrap}>
                <View style={styles.minimalStatusBadge}>
                  <Text style={styles.minimalStatusBadgeText}>CURRENT TRACK</Text>
                </View>
                <Text style={styles.minimalGreetingTitle} numberOfLines={2}>
                  {firstName}
                </Text>
                <Text style={styles.minimalSubtext}>
                  You're doing great! Keep up the momentum.
                </Text>

                <View style={styles.minimalStatusBox}>
                  <View style={styles.minimalStatusHeader}>
                    <Text style={styles.minimalCourseName} numberOfLines={1}>
                      {courseTitle}
                    </Text>
                    <Text style={styles.minimalPctText}>{progressPct}%</Text>
                  </View>
                  <View style={styles.minimalProgressTrack}>
                    <Animated.View
                      style={[
                        styles.minimalProgressFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.minimalCtaButton, { backgroundColor: '#045C9A' }]}
                  onPress={() => {
                    if (pendingAssessment) {
                      navigation.navigate('Assessments');
                    } else {
                      navigation.navigate('MainTabs', { screen: 'Learning' });
                    }
                  }}
                >
                  <Text style={styles.minimalCtaButtonText}>{ctaLabel}</Text>
                  <Feather name="arrow-right" size={13} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>

              <View style={styles.minimalIllustrationContainer}>
                <Animated.View
                  style={[
                    styles.characterAnimatedWrapper,
                    {
                      transform: [
                        { translateY: characterTranslateY },
                        { scale: characterScale },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={selectAvatarSource(user)}
                    style={styles.minimalStudentImg}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>
            </View>
          </PressCard>
        </View>
      );
    } else {
      const bannerItem = slide.data;
      return (
        <View key={bannerItem._id || index} style={styles.carouselSlideContainer}>
          <PressCard
            onPress={() => navigation.navigate('MainTabs', { screen: 'Learning' })}
            style={styles.webAnnouncementCard}
          >
            {bannerItem?.image ? (
              <Image source={{ uri: bannerItem.image }} style={styles.announcementImg} resizeMode="cover" />
            ) : (
              <View style={styles.announcementFallback} />
            )}
            <View style={styles.announcementOverlay}>
              <View style={[styles.announcementTextContainer, { backgroundColor: 'rgba(5, 15, 35, 0.78)' }]}>
                <View style={styles.announcementBadgePill}>
                  <Feather name="bookmark" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.announcementBadgeText}>COLLEGE ANNOUNCEMENT</Text>
                </View>
                <Text style={styles.announcementMessage} numberOfLines={2}>
                  {bannerItem?.message || bannerItem?.title || 'Unlock exclusive campus placements, resources and AI coaching.'}
                </Text>
                <View style={styles.announcementCtaRow}>
                  <Text style={styles.announcementCtaText}>View Details</Text>
                  <Feather name="chevron-right" size={12} color="#6EC6EA" style={{ marginLeft: 3 }} />
                </View>
              </View>
            </View>
          </PressCard>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryBright}
            colors={[colors.primaryBright]}
          />
        }
      >
        {/* ── Top Header (Inside ScrollView, now theme-adaptive and scrollable) ── */}
        <View style={[styles.headerContainer, { backgroundColor: colors.bg }]}>
          <View style={styles.headerTopRow}>
            {/* Left Side: Drawer Toggle + Bold User Greeting */}
            <View style={styles.headerLeft}>
              <Pressable
                onPress={openDrawer}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name="menu" size={20} color={colors.text} />
              </Pressable>

              <View style={styles.userGreetingWrap}>
                <Text style={[styles.greetingSubText, { color: colors.textMuted }]}>
                  {greeting.text} {greeting.emoji}
                </Text>
                <Text style={[styles.greetingNameText, { color: colors.text }]}>
                  {firstName}
                </Text>
              </View>
            </View>

            {/* Right Side: Notification Bell + Theme Toggle + Avatar Ring */}
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    marginRight: 8,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name="bell" size={18} color={colors.text} />
                {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
              </Pressable>

              <Pressable
                onPress={toggleTheme}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    marginRight: 10,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name={isDark ? 'sun' : 'moon'} size={18} color={isDark ? '#FACC15' : colors.text} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Profile')}
                style={({ pressed }) => [
                  styles.avatarRingWrap,
                  { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)', opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.avatarInnerCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Institution Badge Row */}
          <View style={styles.institutionBadgeRow}>
            <View
              style={[
                styles.institutionBadgePill,
                {
                  backgroundColor: colors.pillBg,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(4,92,154,0.05)',
                },
              ]}
            >
              <Feather name="shield" size={13} color={colors.primaryBright} style={{ marginRight: 6 }} />
              <Text style={[styles.institutionBadgeText, { color: colors.text }]} numberOfLines={1}>
                {collegeName}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3-Card Announcement Banner Carousel (Horizontal Swipeable with Animated Dots) ── */}
        <AnimatedSection delay={60}>
          <View style={styles.heroCarouselWrapper}>
            <Animated.ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={slideWidthWithGap}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 12,
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false, listener: handleScroll }
              )}
              scrollEventThrottle={16}
              style={styles.carouselScrollView}
            >
              {carouselSlides.map((slide, idx) => renderSlide(slide, idx))}
            </Animated.ScrollView>

            {/* Carousel Dot Indicators */}
            <View style={styles.carouselDotsRow}>
              {carouselSlides.map((_, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.dotIndicator,
                    {
                      width: dotWidth(idx),
                      opacity: dotOpacity(idx),
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </AnimatedSection>

        {/* ── Search Bar & Filter Button ── */}
        <AnimatedSection delay={120}>
          <View style={styles.searchWrap}>
            <View
              style={[
                styles.searchInner,
                {
                  backgroundColor: isDark ? '#0E3555' : '#DDEFF8',
                },
              ]}
            >
              <Feather name="search" size={19} color={isDark ? '#94A3B8' : '#1478B8'} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#072036' }]}
                placeholder="Search modules, courses, skills..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Feather name="x-circle" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                </Pressable>
              )}
            </View>

            <TouchableOpacity
              style={[styles.filterActionBtn, { backgroundColor: '#045C9A' }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Learning' })}
            >
              <Feather name="sliders" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        {/* ── Quick Stats Metric Row ── */}
        <AnimatedSection delay={180}>
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [
              styles.statsRowCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                opacity: pressed ? 0.95 : 1,
              },
            ]}
          >
            {/* Column 1: Daily Streak */}
            <View style={styles.statMetricCell}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)' }]}>
                <MaterialCommunityIcons name="fire" size={22} color="#F97316" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {streakDays} Day{streakDays === 1 ? '' : 's'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Daily Streak</Text>
            </View>

            <View style={[styles.statDividerVertical, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />

            {/* Column 2: XP Level */}
            <View style={styles.statMetricCell}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.08)' }]}>
                <MaterialCommunityIcons name="star-circle" size={22} color="#EAB308" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {badgeStats?.totalXP ?? 0} XP
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Experience</Text>
            </View>

            <View style={[styles.statDividerVertical, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />

            {/* Column 3: Achievements */}
            <View style={styles.statMetricCell}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)' }]}>
                <MaterialCommunityIcons name="trophy" size={21} color="#6366F1" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {badgeStats?.totalEarned ?? 0} Badge{(badgeStats?.totalEarned ?? 0) === 1 ? '' : 's'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Achievements</Text>
            </View>
          </Pressable>
        </AnimatedSection>

        {/* ── Recommended Section ── */}
        <AnimatedSection delay={240}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#072036' }]}>
              Recommended for you
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Learning' })}>
              <Text style={[styles.seeAllText, { color: '#045C9A' }]}>See all →</Text>
            </TouchableOpacity>
          </View>

          {/* Driven by the student's real enrolment + stage data (the old
              cards here were hardcoded marketing filler). */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedScroll}>
            {/* Card 1: continue (or start) learning */}
            <PressCard
              onPress={() => navigation.navigate('MainTabs', { screen: 'Learning' })}
              style={[
                styles.recCard,
                {
                  backgroundColor: isDark ? '#0E3555' : '#E0F2FE',
                },
              ]}
            >
              <View style={styles.recCardHeader}>
                <View style={styles.recCardTitleWrap}>
                  <Text style={[styles.recCardCategory, { color: isDark ? '#93C5FD' : '#0369A1' }]}>
                    {activeEnrollment ? 'CONTINUE LEARNING' : 'GET STARTED'}
                  </Text>
                  <Text style={[styles.recCardTitle, { color: isDark ? '#FFFFFF' : '#0C4A6E' }]} numberOfLines={2}>
                    {activeEnrollment?.course?.title || 'Explore the catalogue'}
                  </Text>
                  <Text style={[styles.recCardSub, { color: isDark ? '#94A3B8' : '#0284C7' }]}>
                    {activeEnrollment
                      ? `${Math.round(activeEnrollment.progress || 0)}% complete`
                      : 'Pick your first course'}
                  </Text>
                </View>
                <Image source={require('../../../assets/course_brain.png')} style={styles.recCardImg} resizeMode="contain" />
              </View>

              <View style={styles.recPillTagsRow}>
                <View style={[styles.recPillTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }]}>
                  <Text style={[styles.recPillTagText, { color: isDark ? '#E2E8F0' : '#0369A1' }]}>Self-paced</Text>
                </View>
                {enrolledCount > 0 && (
                  <View style={[styles.recPillTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }]}>
                    <Text style={[styles.recPillTagText, { color: isDark ? '#E2E8F0' : '#0369A1' }]}>
                      {enrolledCount} enrolled
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.recCardFooterRow}>
                <Text style={[styles.recPriceBadge, { color: isDark ? '#2B8FCC' : '#0369A1' }]}>Included in Tier</Text>
                <TouchableOpacity
                  style={[styles.recDetailsBtn, { backgroundColor: isDark ? '#2B8FCC' : '#072036' }]}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Learning' })}
                >
                  <Text style={styles.recDetailsBtnText}>
                    {activeEnrollment ? 'Continue' : 'Browse'}
                  </Text>
                </TouchableOpacity>
              </View>
            </PressCard>

            {/* Card 2: next assessment stage */}
            <PressCard
              onPress={() => navigation.navigate('Assessments')}
              style={[
                styles.recCard,
                {
                  backgroundColor: isDark ? '#0E3555' : '#F3E8FF',
                },
              ]}
            >
              <View style={styles.recCardHeader}>
                <View style={styles.recCardTitleWrap}>
                  <Text style={[styles.recCardCategory, { color: isDark ? '#C084FC' : '#7E22CE' }]}>ASSESSMENTS</Text>
                  <Text style={[styles.recCardTitle, { color: isDark ? '#FFFFFF' : '#581C87' }]}>
                    {pendingAssessment ? `${pendingAssessment} Test up next` : 'All stages cleared'}
                  </Text>
                  <Text style={[styles.recCardSub, { color: isDark ? '#94A3B8' : '#7E22CE' }]}>
                    {completedCount} of 4 stages cleared
                  </Text>
                </View>
                <Image source={require('../../../assets/home_hero.png')} style={styles.recCardImg} resizeMode="contain" />
              </View>

              <View style={styles.recPillTagsRow}>
                <View style={[styles.recPillTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }]}>
                  <Text style={[styles.recPillTagText, { color: isDark ? '#E2E8F0' : '#7E22CE' }]}>Proctored</Text>
                </View>
                <View style={[styles.recPillTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }]}>
                  <Text style={[styles.recPillTagText, { color: isDark ? '#E2E8F0' : '#7E22CE' }]}>T1–T4 journey</Text>
                </View>
              </View>

              <View style={styles.recCardFooterRow}>
                <Text style={[styles.recPriceBadge, { color: isDark ? '#C084FC' : '#6B21A8' }]}>
                  {pendingAssessment ? 'Ready when you are' : 'Great work! 🎉'}
                </Text>
                <TouchableOpacity
                  style={[styles.recDetailsBtn, { backgroundColor: isDark ? '#A855F7' : '#072036' }]}
                  onPress={() => navigation.navigate('Assessments')}
                >
                  <Text style={styles.recDetailsBtnText}>{pendingAssessment ? 'Start' : 'View results'}</Text>
                </TouchableOpacity>
              </View>
            </PressCard>
          </ScrollView>
        </AnimatedSection>

        {/* ── Assessment Journey Card ── */}
        <AnimatedSection delay={300}>
          <PressCard
            onPress={() => navigation.navigate('Assessments')}
            style={[
              styles.journeyCardContainer,
              {
                backgroundColor: isDark ? '#0E3555' : '#FFFFFF',
              },
            ]}
          >
            <View style={styles.journeyTopRow}>
              {/* Left: Progress score ring */}
              <View style={[styles.ringContainer, { borderColor: isDark ? 'rgba(20,120,184,0.2)' : '#EAF7FD' }]}>
                <Text style={[styles.ringPctText, { color: '#045C9A' }]}>{completedCount * 25}%</Text>
              </View>

              <View style={styles.journeyTextWrap}>
                <Text style={[styles.journeyMainHeading, { color: isDark ? '#FFFFFF' : '#072036' }]}>
                  Assessment Journey
                </Text>
                <Text style={[styles.journeySubHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {completedCount} of 4 Stage Milestones Cleared
                </Text>
              </View>

              {/* Rocket Graphic */}
              <Image source={require('../../../assets/assessment_rocket.png')} style={styles.rocketGraphic} resizeMode="contain" />
            </View>

            {/* Stepper Nodes */}
            <View style={styles.stepperTrackRow}>
              <View style={[styles.stepperLineBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} />

              {['Baseline', 'Capacity', 'Capability', 'Leadership'].map((stgLabel, idx) => {
                const isDone = completedCount > idx;
                const isCurrent = completedCount === idx;

                return (
                  <View key={stgLabel} style={styles.nodeItem}>
                    <View
                      style={[
                        styles.nodeCircle,
                        {
                          backgroundColor: isDark ? '#072036' : '#EAF7FD',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1',
                        },
                        isDone && { backgroundColor: '#10B981', borderColor: '#10B981' },
                        isCurrent && { borderColor: '#045C9A', borderWidth: 2.5 },
                      ]}
                    >
                      {isDone ? (
                        <Feather name="check" size={11} color="#FFFFFF" />
                      ) : !isDone && !isCurrent ? (
                        <Feather name="lock" size={9} color={isDark ? '#64748B' : '#94A3B8'} />
                      ) : (
                        <Text style={[styles.nodeNumText, { color: '#045C9A' }]}>{idx + 1}</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.nodeLabelText,
                        {
                          color: isCurrent || isDone ? (isDark ? '#FFFFFF' : '#072036') : (isDark ? '#64748B' : '#94A3B8'),
                          fontWeight: isCurrent || isDone ? '800' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {stgLabel}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.journeyCtaButton, { backgroundColor: '#045C9A' }]}
              onPress={() => navigation.navigate('Assessments')}
            >
              <Text style={styles.journeyCtaText}>Continue Assessment Stage</Text>
              <Feather name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </PressCard>
        </AnimatedSection>

        {/* ── Explore Modules Category Filters & 2-Column Grid ── */}
        <AnimatedSection delay={360}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#072036' }, styles.gridSectionHeader]}>
            Explore Modules
          </Text>

          {/* Category Chips Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[
                    styles.chipPill,
                    active
                      ? {
                          backgroundColor: '#045C9A',
                          shadowColor: '#045C9A',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 3,
                        }
                      : {
                          backgroundColor: isDark ? '#0E3555' : '#DDEFF8',
                          borderWidth: 0,
                        },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B') }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 2-Column Grid */}
          <View style={{ paddingHorizontal: 14 }}>
            <View style={styles.moduleGridContainer}>
              {filteredShortcuts.map((item) => (
                <View key={item.key} style={styles.gridColumnCell}>
                  <PressCard
                    onPress={() => handleShortcutPress(item)}
                    style={[
                      styles.moduleGridCard,
                      {
                        backgroundColor: isDark ? '#0E3555' : '#FFFFFF',
                      },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                        <Feather name={item.icon} size={20} color={item.color} />
                      </View>
                      <View style={[styles.arrowCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#DDEFF8' }]}>
                        <Feather name="arrow-right" size={13} color={item.color} />
                      </View>
                    </View>
                    <Text style={[styles.moduleCardTitle, { color: isDark ? '#FFFFFF' : '#072036' }]}>{item.title}</Text>
                    <Text style={[styles.moduleCardSub, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </PressCard>
                </View>
              ))}
            </View>
          </View>
        </AnimatedSection>

        {/* Bottom padding to clear floating navigation bar */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Top Header ──
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  userGreetingWrap: {
    marginLeft: 12,
  },
  greetingSubText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  greetingNameText: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: -2,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1478B8',
  },
  avatarRingWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  institutionBadgeRow: {
    marginTop: 2,
  },
  institutionBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  institutionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Scroll Container ──
  scrollContainer: {
    paddingBottom: 24,
  },

  // ── Carousel Wrapper ──
  heroCarouselWrapper: {
    marginBottom: 22,
  },
  carouselScrollView: {
    width: SCREEN_WIDTH,
    overflow: 'visible',
  },
  carouselSlideContainer: {
    width: SCREEN_WIDTH - 40,
  },

  // ── Card 1: Clean, Minimal, Premium Status Card ──
  minimalHeroCard: {
    height: 235,
    borderRadius: 26,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#072036',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  minimalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minimalLeftWrap: {
    flex: 1.25,
    paddingRight: 6,
  },
  minimalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  minimalStatusBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  minimalGreetingTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  minimalSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 16,
  },
  minimalStatusBox: {
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  minimalStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  minimalCourseName: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  minimalPctText: {
    color: '#6EC6EA',
    fontSize: 12.5,
    fontWeight: '900',
  },
  minimalProgressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  minimalProgressFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: '#1478B8',
  },
  minimalCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#045C9A',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: '#045C9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  minimalCtaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  minimalIllustrationContainer: {
    flex: 0.8,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  characterAnimatedWrapper: {
    width: 94,
    height: 94,
    borderRadius: 47,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  minimalStudentImg: {
    width: '100%',
    height: '100%',
  },

  // ── Web Announcement Card ──
  webAnnouncementCard: {
    height: 235,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#072036',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  announcementImg: {
    width: '100%',
    height: '100%',
  },
  announcementFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#072036',
  },
  announcementOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  announcementTextContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  announcementBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#045C9A',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 8,
  },
  announcementBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  announcementMessage: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementCtaText: {
    color: '#6EC6EA',
    fontSize: 12,
    fontWeight: '800',
  },

  carouselDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dotIndicator: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },

  // ── Search & Filter ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 20,
  },
  searchInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
  },
  filterActionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#045C9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Stats Row ──
  statsRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 0,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#072036',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  statMetricCell: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDividerVertical: {
    width: 1,
    height: 46,
  },

  // ── Recommended Section ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  seeAllText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  recommendedScroll: {
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 26,
  },
  recCard: {
    width: SCREEN_WIDTH * 0.74,
    borderRadius: 26,
    borderWidth: 0,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 2,
  },
  recCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recCardTitleWrap: {
    flex: 1,
    paddingRight: 6,
  },
  recCardCategory: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  recCardTitle: {
    fontSize: 17.5,
    fontWeight: '800',
  },
  recCardSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  recCardImg: {
    width: 54,
    height: 54,
  },
  recPillTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  recPillTag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  recPillTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recCardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recPriceBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  recDetailsBtn: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  recDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // ── Journey Card ──
  journeyCardContainer: {
    borderRadius: 26,
    borderWidth: 0,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
  },
  journeyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  ringContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPctText: {
    fontSize: 13,
    fontWeight: '900',
  },
  journeyTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  journeyMainHeading: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  journeySubHeading: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  rocketGraphic: {
    width: 52,
    height: 52,
  },
  stepperTrackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  stepperLineBg: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    top: 13,
  },
  nodeItem: {
    alignItems: 'center',
    width: 62,
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeNumText: {
    fontSize: 10,
    fontWeight: '900',
  },
  nodeLabelText: {
    fontSize: 9.5,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  journeyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 12,
  },
  journeyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Category Chips & Grid ──
  gridSectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categoryChipsScroll: {
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  chipPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  moduleGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridColumnCell: {
    width: '50%',
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  moduleGridCard: {
    borderRadius: 22,
    borderWidth: 0,
    padding: 16,
    minHeight: 132,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  moduleCardSub: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 15,
  },
});

