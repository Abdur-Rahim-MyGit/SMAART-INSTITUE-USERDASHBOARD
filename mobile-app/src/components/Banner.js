/**
 * Inline error / success / info banner.
 *
 * IMPLEMENTATION_MAP.md §3 called this out: LoginScreen and OtpVerifyScreen had
 * already hand-rolled the same banner twice, and the Phase 1 screens would have
 * made that five or six copies. One component instead.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '../theme';

const VARIANTS = {
  error: { bg: colors.dangerBg, fg: colors.danger, icon: 'alert-circle' },
  success: { bg: '#F0FDF4', fg: colors.success, icon: 'check-circle' },
  info: { bg: '#EAF7FD', fg: colors.primary, icon: 'info' },
  warning: { bg: '#FFFBEB', fg: '#92400E', icon: 'alert-triangle' },
};

export default function Banner({ variant = 'info', message, style }) {
  if (!message) return null;
  const v = VARIANTS[variant] || VARIANTS.info;

  return (
    <View style={[styles.banner, { backgroundColor: v.bg }, style]}>
      <Feather name={v.icon} size={16} color={v.fg} />
      <Text style={[styles.text, { color: v.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  text: { fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1, lineHeight: 17 },
});
