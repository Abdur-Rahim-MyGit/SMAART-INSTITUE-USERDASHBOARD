/**
 * The pill-shaped labelled input used across the auth flow, with an optional
 * leading Feather icon and a built-in show/hide toggle for passwords.
 *
 * Matches the inline styling LoginScreen/OtpVerifyScreen already use, so the
 * new screens are pixel-consistent with the existing ones.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

export default function PillInput({
  label,
  icon,
  secure = false,
  error,
  containerStyle,
  ...inputProps
}) {
  const [reveal, setReveal] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        {icon ? <Feather name={icon} size={18} color="#64748B" style={styles.inputIcon} /> : null}
        <TextInput
          style={styles.textInput}
          placeholderTextColor={colors.mutedLight}
          secureTextEntry={secure && !reveal}
          {...inputProps}
        />
        {secure ? (
          <Pressable onPress={() => setReveal((v) => !v)} hitSlop={10}>
            <Feather name={reveal ? 'eye-off' : 'eye'} size={18} color={colors.mutedLight} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 14,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  inputRowError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  inputIcon: { marginRight: 10 },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: -12,
    marginBottom: 14,
    marginLeft: 16,
  },
});
