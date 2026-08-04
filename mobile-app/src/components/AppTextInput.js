import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, typography } from '../theme';

export default function AppTextInput({ label, error, icon, secureTextEntry, style, ...props }) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.row,
          focused && styles.rowFocused,
          error && styles.rowError,
        ]}
      >
        {icon ? (
          <View style={[styles.iconBadge, focused && styles.iconBadgeFocused]}>
            <Feather name={icon} size={15} color={focused ? colors.primary : colors.muted} />
          </View>
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.mutedLight}
          secureTextEntry={isPassword && !reveal}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setReveal((v) => !v)}
            hitSlop={10}
            style={styles.revealButton}
          >
            <Feather name={reveal ? 'eye-off' : 'eye'} size={17} color={colors.mutedLight} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...typography.label, color: colors.muted, marginBottom: 8, marginLeft: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
  },
  rowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  rowError: { borderColor: colors.danger },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  iconBadgeFocused: { borderColor: colors.primary + '33' },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0,
  },
  revealButton: { padding: 6, marginLeft: 4 },
  error: { color: colors.danger, fontSize: 12, fontWeight: '600', marginTop: 6, marginLeft: 2 },
});
