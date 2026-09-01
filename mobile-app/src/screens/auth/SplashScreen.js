/**
 * SplashScreen — enhanced JS splash with particle burst + logo scale entrance.
 *
 * Native splash (app.json expo-splash-screen) already shows navy bg + logo
 * before JS bundle loads. This JS layer adds:
 *   - Logo scale-in entrance (0.85 → 1.0, spring-like easing)
 *   - 8 tiny particles burst outward from logo center
 *   - Dual counter-rotating orbit rings + breathing glow
 *   - Tagline lifts up and fades in
 * Auto-navigates to WelcomeOnboarding after ~2.4s.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme';

const PARTICLE_COUNT = 8;

function useParticle(delay) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);
  return progress;
}

function Particle({ angle, delay, color }) {
  const progress = useParticle(delay);
  const distance = 90;
  const rad = (angle * Math.PI) / 180;
  const tx = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * distance] });
  const ty = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * distance] });
  const opacity = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1.4, 0.4] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      }}
    />
  );
}

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(14)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringRotate2 = useRef(new Animated.Value(0)).current;
  const dot1Pulse = useRef(new Animated.Value(0.4)).current;
  const dot2Pulse = useRef(new Animated.Value(0.7)).current;
  const dot3Pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo scale entrance — eases in with a slight overshoot feel
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();

    // Tagline lift-in
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing glow loop
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    // Dual orbit rings
    const ring1Loop = Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    );
    ring1Loop.start();

    const ring2Loop = Animated.loop(
      Animated.timing(ringRotate2, { toValue: 1, duration: 13000, easing: Easing.linear, useNativeDriver: true })
    );
    ring2Loop.start();

    // Loading dots
    const makeDotLoop = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: 480, delay, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 480, useNativeDriver: true }),
        ])
      );
    const dotAnim = Animated.parallel([
      makeDotLoop(dot1Pulse, 0),
      makeDotLoop(dot2Pulse, 160),
      makeDotLoop(dot3Pulse, 320),
    ]);
    dotAnim.start();

    const timer = setTimeout(() => {
      navigation.replace('WelcomeOnboarding');
    }, 3800);

    return () => {
      clearTimeout(timer);
      glowLoop.stop();
      ring1Loop.stop();
      ring2Loop.stop();
      dotAnim.stop();
    };
  }, [navigation, logoScale, textOpacity, textTranslateY, glowPulse, ringRotate, ringRotate2, dot1Pulse, dot2Pulse, dot3Pulse]);

  const ringSpin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringSpin2 = ringRotate2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  const PARTICLE_COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#BFDBFE', '#1D4ED8', '#7DD3FC', '#38BDF8'];

  return (
    <Pressable style={styles.container} onPress={() => navigation.replace('WelcomeOnboarding')}>
      {/* Ambient glow blob */}
      <Animated.View style={[styles.glowBlob, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

      {/* Orbit rings */}
      <Animated.View style={[styles.ring1, { transform: [{ rotate: ringSpin }] }]} />
      <Animated.View style={[styles.ring2, { transform: [{ rotate: ringSpin2 }] }]} />
      <Animated.View style={styles.ring3} />

      {/* Logo + particle burst */}
      <Animated.View style={[styles.logoBox, { transform: [{ scale: logoScale }] }]}>
        {/* Particles originate from logo center */}
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <Particle
            key={i}
            angle={(360 / PARTICLE_COUNT) * i}
            delay={80 + i * 25}
            color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
          />
        ))}
        <Image
          source={require('../../../assets/smaart-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline + loading dots */}
      <Animated.View
        style={[
          styles.textBlock,
          { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
        ]}
      >
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
  glowBlob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(37, 99, 235, 0.09)',
  },
  ring1: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.04)',
    borderTopColor: 'rgba(96, 165, 250, 0.38)',
    borderLeftColor: 'rgba(96, 165, 250, 0.18)',
  },
  ring2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.03)',
    borderBottomColor: 'rgba(96, 165, 250, 0.22)',
    borderRightColor: 'rgba(96, 165, 250, 0.12)',
  },
  ring3: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.07)',
    borderStyle: 'dashed',
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    marginBottom: 18,
    opacity: 0.9,
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
    bottom: 44,
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.4,
  },
});
