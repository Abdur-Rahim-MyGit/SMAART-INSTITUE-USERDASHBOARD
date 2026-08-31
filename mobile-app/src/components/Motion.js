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

/**
 * Shake feedback for form errors (wrong password/OTP, validation failures).
 * Re-triggers whenever `trigger` changes to a new truthy value — pass the
 * error message/state itself so the same message re-shakes on a repeat wrong
 * attempt (e.g. via a bump counter) if the caller needs that.
 */
export function useShake(trigger) {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [trigger]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  return { transform: [{ translateX }] };
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
