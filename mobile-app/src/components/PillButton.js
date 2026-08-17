/**
 * The bright-blue pill action button from the redesigned auth flow.
 *
 * Distinct from AppButton on purpose — AppButton is the older navy/12px-radius
 * style still used inside the app shell (ProfileScreen etc.). The auth screens
 * were redesigned to a 27px-radius primary-blue pill, and this is that button.
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

export default function PillButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
  variant = 'primary',
  style,
}) {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && (isOutline ? styles.outlinePressed : styles.primaryPressed),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isOutline ? colors.muted : '#FFFFFF'} />
      ) : (
        <>
          <Text style={isOutline ? styles.outlineText : styles.primaryText}>{title}</Text>
          {icon ? (
            <Feather
              name={icon}
              size={16}
              color={isOutline ? '#4B5563' : '#FFFFFF'}
              style={styles.icon}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadow.button,
    shadowColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryBright,
    transform: [{ scale: 0.98 }],
  },
  primaryText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  outline: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  outlinePressed: { backgroundColor: '#F3F4F6', transform: [{ scale: 0.98 }] },
  outlineText: { fontSize: 16, fontWeight: '700', color: '#4B5563' },
  disabled: { opacity: 0.5 },
  icon: { marginLeft: 8 },
});
