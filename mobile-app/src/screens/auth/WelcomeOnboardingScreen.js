/**
 * WelcomeOnboardingScreen — Elevated Premium Redesign.
 *
 * Visual & Motion Updates:
 *  - Removed the glassmorphic center badge that was clashing with student faces
 *  - Added a clean styled "SMAART Institute" branding header ABOVE the avatar cluster
 *  - Implemented infinite gentle Floating translation loop on the avatar cluster
 *  - Implemented infinite glowing Breathing/Pulse loop on the background ambient dots
 *  - Implemented spring staggered entrance animations where avatars slide in from left/right/bottom on load
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeOnboardingScreen({ navigation }) {
  const { college } = useAuth();

  // Entrance & Loop animations
  const leftBoyX = useRef(new Animated.Value(-120)).current;
  const rightBoyX = useRef(new Animated.Value(120)).current;
  const girlY = useRef(new Animated.Value(120)).current;
  const avatarsOpacity = useRef(new Animated.Value(0)).current;

  const cardTranslateY = useRef(new Animated.Value(120)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // 1. Entrance springs and timings
    Animated.parallel([
      Animated.spring(leftBoyX, {
        toValue: 0,
        friction: 6.5,
        tension: 32,
        useNativeDriver: true,
      }),
      Animated.spring(rightBoyX, {
        toValue: 0,
        friction: 6.5,
        tension: 32,
        useNativeDriver: true,
      }),
      Animated.spring(girlY, {
        toValue: 0,
        friction: 6.5,
        tension: 32,
        useNativeDriver: true,
      }),
      Animated.timing(avatarsOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Floating Loop for Avatar Cluster
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Continuous Breathing Pulse Loop for Background Dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStart = () => {
    if (college) {
      navigation.navigate('Login');
    } else {
      navigation.navigate('InstitutionSelector');
    }
  };

  const handleSearchCollege = () => {
    navigation.navigate('InstitutionSelector');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0A0F1D" />

      {/* Top Dark Header with Avatars */}
      <View style={styles.topSection}>
        {/* Ambient background pulsing dots */}
        <Animated.View style={[styles.dot, styles.dotPink, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.dot, styles.dotGreen, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.dot, styles.dotYellow, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.dot, styles.dotWhiteSmall, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.dot, styles.dotCyanSmall, { opacity: pulseAnim }]} />

        {/* Clean branding text block above the avatars */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>SMAART</Text>
          <Text style={styles.brandSubtitle}>INSTITUTE</Text>
        </View>

        {/* Floating 3D Avatars Cluster */}
        <Animated.View
          style={[
            styles.avatarCluster,
            {
              opacity: avatarsOpacity,
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Top Left Avatar */}
          <Animated.View
            style={[
              styles.avatarCircle,
              styles.avatarCircleLeft,
              { transform: [{ translateX: leftBoyX }] },
            ]}
          >
            <Image
              source={require('../../../assets/avatar_boy1.png')}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Top Right Avatar */}
          <Animated.View
            style={[
              styles.avatarCircle,
              styles.avatarCircleRight,
              { transform: [{ translateX: rightBoyX }] },
            ]}
          >
            <Image
              source={require('../../../assets/avatar_boy2.png')}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Bottom Center Avatar */}
          <Animated.View
            style={[
              styles.avatarCircle,
              styles.avatarCircleBottom,
              { transform: [{ translateY: girlY }] },
            ]}
          >
            <Image
              source={require('../../../assets/avatar_girl.png')}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Let’s get you{'\n'}signed in!</Text>
      </View>

      {/* White Curved Bottom Sheet Card */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
      >
        <Text style={styles.cardHeaderNote}>Select your college to get started</Text>

        {/* Selected College Preview (if previously chosen) */}
        {college ? (
          <View style={styles.collegeSelectedBox}>
            <View style={styles.collegeIcon}>
              <Feather name="home" size={16} color={colors.primaryBright} />
            </View>
            <View style={styles.collegeTextWrap}>
              <Text style={styles.collegeSelectedLabel}>SELECTED COLLEGE</Text>
              <Text style={styles.collegeSelectedName} numberOfLines={1}>
                {college.collegeName}
              </Text>
            </View>
            <Pressable onPress={handleSearchCollege} hitSlop={8}>
              <Text style={styles.changeBtn}>CHANGE</Text>
            </Pressable>
          </View>
        ) : (
          /* Search College Preview Trigger */
          <Pressable
            style={({ pressed }) => [styles.searchTrigger, pressed && styles.searchTriggerPressed]}
            onPress={handleSearchCollege}
          >
            <Feather name="search" size={18} color={colors.muted} />
            <Text style={styles.searchTriggerText}>Search & select your college...</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedLight} />
          </Pressable>
        )}

        <Text style={styles.cardDesc}>
          Connect to your institution to access your personalized courses, AI assessments, and career passport.
        </Text>

        {/* Primary Action CTA Button */}
        <Pressable
          style={({ pressed }) => [styles.mainButton, pressed && styles.mainButtonPressed]}
          onPress={handleStart}
        >
          <Text style={styles.mainButtonText}>
            {college ? 'Continue to Sign In' : 'Search College & Continue'}
          </Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={styles.buttonIcon} />
        </Pressable>

        <Text style={styles.footerNote}>
          Need help? <Text style={styles.footerLink} onPress={handleSearchCollege}>Find College</Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDarkest,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 14,
    position: 'relative',
  },

  // Ambient dots
  dot: {
    position: 'absolute',
    borderRadius: 50,
  },
  dotPink: {
    top: 40,
    left: 24,
    width: 22,
    height: 22,
    backgroundColor: '#F472B6',
  },
  dotGreen: {
    top: 30,
    right: 32,
    width: 28,
    height: 28,
    backgroundColor: '#86EFAC',
  },
  dotYellow: {
    bottom: 40,
    right: 28,
    width: 14,
    height: 14,
    backgroundColor: '#FDE047',
  },
  dotWhiteSmall: {
    top: 140,
    left: 48,
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
  },
  dotCyanSmall: {
    top: 180,
    right: 40,
    width: 12,
    height: 12,
    backgroundColor: '#38BDF8',
  },

  // Branding above avatars
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSubtitle: {
    color: colors.primaryBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },

  // Avatars Cluster
  avatarCluster: {
    width: 210,
    height: 190,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  avatarCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatarCircleLeft: {
    top: 0,
    left: 12,
    backgroundColor: '#FBCFE8',
  },
  avatarCircleRight: {
    top: 0,
    right: 12,
    backgroundColor: '#BAE6FD',
  },
  avatarCircleBottom: {
    bottom: 0,
    backgroundColor: '#FED7AA',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  // Title
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.6,
  },

  // White Curved Card
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    alignItems: 'center',
    ...shadow.card,
    shadowOpacity: 0.15,
  },
  cardHeaderNote: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 16,
  },
  searchTrigger: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchTriggerPressed: {
    backgroundColor: '#E2E8F0',
  },
  searchTriggerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    marginLeft: 10,
  },

  collegeSelectedBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  collegeIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  collegeTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  collegeSelectedLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primaryBright,
    letterSpacing: 0.6,
  },
  collegeSelectedName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 1,
  },
  changeBtn: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryBright,
    letterSpacing: 0.5,
  },

  cardDesc: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  // Main CTA Button
  mainButton: {
    width: '100%',
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
    shadowColor: colors.primary,
  },
  mainButtonPressed: {
    backgroundColor: colors.primaryBright,
    transform: [{ scale: 0.98 }],
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },

  footerNote: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 18,
  },
  footerLink: {
    color: colors.navy,
    fontWeight: '800',
  },
});
