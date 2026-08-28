/**
 * Small shared Animated helpers for the auth flow's entrance/press motion.
 *
 * Mirrors the AnimatedSection/PressCard pattern already established in
 * HomeScreen.js — built on React Native's own `Animated` API only (no
 * react-native-reanimated/gesture-handler, which aren't installed).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export function FadeSlideIn({ children, delay = 0, duration = 400, distance = 16, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function PressScale({
  onPress,
  onLongPress,
  disabled,
  style,
  pressedStyle,
  scaleTo = 0.97,
  children,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...rest}
    >
      {({ pressed }) => (
        <Animated.View style={[style, pressed && pressedStyle, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
