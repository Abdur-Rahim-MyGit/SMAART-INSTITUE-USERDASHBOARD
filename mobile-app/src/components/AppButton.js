import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

export default function AppButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}) {
  const isPrimary = variant === 'primary';
  const isLink = variant === 'link';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        isLink ? styles.linkBase : styles.base,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && !isLink && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <View style={styles.content}>
          <Text
            style={
              isLink ? styles.linkText : isPrimary ? styles.primaryText : styles.secondaryText
            }
          >
            {title}
          </Text>
          {icon ? (
            <Feather
              name={icon}
              size={isLink ? 14 : 18}
              color={isLink ? colors.primary : isPrimary ? colors.white : colors.primary}
              style={styles.icon}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginLeft: 8 },
  primary: { backgroundColor: colors.navy, ...shadow.button },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  linkBase: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 4 },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
