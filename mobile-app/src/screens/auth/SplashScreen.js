/**
 * SplashScreen — Animated professional white splash screen.
 *
 * Appears briefly before onboarding/login, displaying a smooth scale & fade
 * animation of the SMAART Institute logo, ambient rings, and tagline.
 * Auto-navigates to 'WelcomeOnboarding' after ~2 seconds.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(ringScale, {
        toValue: 1.15,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('WelcomeOnboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, logoScale, logoOpacity, textOpacity, ringScale]);

  const handleSkip = () => {
    navigation.replace('WelcomeOnboarding');
  };

  return (
    <Pressable style={styles.container} onPress={handleSkip}>
      {/* Background ambient glowing rings */}
      <Animated.View
        style={[
          styles.ring1,
          { transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ring2,
          { transform: [{ scale: ringScale }] },
        ]}
      />

      {/* Main logo and branding */}
      <Animated.View
        style={[
          styles.logoBox,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../../assets/smaart-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.tagline}>AI-Powered Learning & Career Platform</Text>

        <View style={styles.loadingDotsRow}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </Animated.View>

      <Text style={styles.tapNote}>Tap anywhere to continue</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ring1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(26,56,132,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(26,56,132,0.08)',
  },
  ring2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59,130,246,0.05)',
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 260,
    height: 88,
  },
  textBlock: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primaryBright,
    marginHorizontal: 3.5,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.75 },
  dot3: { opacity: 1 },
  tapNote: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedLight,
    letterSpacing: 0.4,
  },
});
