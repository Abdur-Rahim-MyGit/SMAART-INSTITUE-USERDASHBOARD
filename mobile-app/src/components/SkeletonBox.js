/**
 * SkeletonBox — reusable shimmer/pulse placeholder for loading states.
 * Pure React Native Animated — no extra dependencies.
 *
 * Usage:
 *   <SkeletonBox width={200} height={16} borderRadius={8} />
 *   <SkeletonBox style={{ marginBottom: 12 }} />
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SkeletonBox({ width, height, borderRadius, style }) {
  const { theme } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  // A fixed light-grey placeholder glowed against the dark surfaces it sits on,
  // so the loading state looked brighter than the content it stood in for.
  const baseColor = theme === 'dark' ? 'rgba(255,255,255,0.10)' : '#CBD5E1';

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: baseColor },
        width != null && { width },
        height != null && { height },
        borderRadius != null && { borderRadius },
        { opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBox height={12} width="60%" borderRadius={6} style={{ marginBottom: 10 }} />
      <SkeletonBox height={18} width="85%" borderRadius={6} style={{ marginBottom: 10 }} />
      <SkeletonBox height={8} width="100%" borderRadius={4} />
    </View>
  );
}

export function SkeletonModuleCard({ style }) {
  return (
    <View style={[styles.moduleCard, style]}>
      <SkeletonBox width={44} height={44} borderRadius={12} style={{ marginBottom: 8 }} />
      <SkeletonBox height={12} width="70%" borderRadius={5} style={{ marginBottom: 6 }} />
      <SkeletonBox height={10} width="50%" borderRadius={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#CBD5E1',
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF2',
    borderRadius: 18,
    padding: 16,
    flex: 1,
    minHeight: 110,
  },
});
