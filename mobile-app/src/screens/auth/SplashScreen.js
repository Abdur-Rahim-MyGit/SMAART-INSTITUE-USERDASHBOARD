/**
 * SplashScreen — the JS half of the launch splash.
 *
 * The native splash (app.json's expo-splash-screen config) already shows this
 * exact navy background + logo before the JS bundle even runs, and
 * RootNavigator's bootstrap view matches it too — so the logo here stays
 * static from frame one (no scale/fade-in) to avoid a flicker where the logo
 * would otherwise vanish and re-pop. The "animation" lives in the chrome
 * around it: a continuously breathing glow behind the logo, a slow orbiting
 * ring, and the tagline/dots fading in on top.
 * Auto-navigates to 'WelcomeOnboarding' after ~2 seconds.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

export default function SplashScreen({ navigation }) {
  const textOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const dot1Pulse = useRef(new Animated.Value(0.4)).current;
  const dot2Pulse = useRef(new Animated.Value(0.75)).current;
  const dot3Pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const makeDotLoop = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.35, duration: 450, useNativeDriver: true }),
        ])
      );

    const dotAnimation = Animated.parallel([
      makeDotLoop(dot1Pulse, 0),
      makeDotLoop(dot2Pulse, 150),
      makeDotLoop(dot3Pulse, 300),
    ]);
    dotAnimation.start();

    return () => dotAnimation.stop();
  }, [dot1Pulse, dot2Pulse, dot3Pulse]);

  useEffect(() => {
    // Continuous breathing glow behind the logo.
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    // Slow, continuous ring rotation for an "alive" feel.
    const rotateLoop = Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    );
    rotateLoop.start();

    // Tagline/dots fade in on top of the already-visible logo.
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 700,
      delay: 250,
      useNativeDriver: true,
    }).start();

    // Auto-advance after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('WelcomeOnboarding');
    }, 2000);

    return () => {
      clearTimeout(timer);
      glowLoop.stop();
      rotateLoop.stop();
    };
  }, [navigation, textOpacity, glowPulse, ringRotate]);

  const ringSpin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const handleSkip = () => {
    navigation.replace('WelcomeOnboarding');
  };

  return (
    <Pressable style={styles.container} onPress={handleSkip}>
      {/* Background ambient rings — slow continuous rotation + breathing glow */}
      <Animated.View style={[styles.ring1, { transform: [{ rotate: ringSpin }] }]} />
      <Animated.View
        style={[
          styles.ring2,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Main logo — static, matches the native splash and RootNavigator's
          bootstrap view exactly, so there's no flicker on handoff */}
      <View style={styles.logoBox}>
        <Image
          source={require('../../../assets/smaart-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.tagline}>AI-Powered Learning & Career Platform</Text>

        <View style={styles.loadingDotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1Pulse }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Pulse }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Pulse }]} />
        </View>
      </Animated.View>

      <Text style={styles.tapNote}>Tap anywhere to continue</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDarkest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ring1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.06)',
    borderTopColor: 'rgba(96, 165, 250, 0.35)',
    borderLeftColor: 'rgba(96, 165, 250, 0.2)',
  },
  ring2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
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
    color: '#FFFFFF',
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
  tapNote: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.4,
  },
});
