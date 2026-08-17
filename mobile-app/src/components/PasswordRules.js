/**
 * Live password-policy checklist + strength meter.
 *
 * The rules come from utils/password.js, which mirrors the backend's
 * `validatePasswordPolicy`. Showing them as the student types is the whole
 * point — otherwise the first they hear about "needs a special character" is a
 * 400 after they've already submitted.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PASSWORD_RULES, passwordStrength, validatePassword } from '../utils/password';
import { colors, radius } from '../theme';

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['#E5E7EB', colors.danger, colors.gold, '#3B82F6', colors.success];

export default function PasswordRules({ password, style }) {
  const { passed } = validatePassword(password);
  const score = passwordStrength(password);
  const filled = password ? score + 1 : 0;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.meterRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.meterSegment,
              { backgroundColor: i < filled ? STRENGTH_COLORS[score] : '#E5E7EB' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.meterLabel, { color: password ? STRENGTH_COLORS[score] : colors.muted }]}>
        {password ? STRENGTH_LABELS[score] : 'Enter a password'}
      </Text>

      <View style={styles.rules}>
        {PASSWORD_RULES.map((rule) => {
          const ok = passed[rule.key];
          return (
            <View key={rule.key} style={styles.ruleRow}>
              <Feather
                name={ok ? 'check-circle' : 'circle'}
                size={13}
                color={ok ? colors.success : colors.mutedLight}
              />
              <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{rule.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 18,
  },
  meterRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  meterSegment: { flex: 1, height: 4, borderRadius: 2 },
  meterLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 10 },
  rules: { gap: 6 },
  ruleRow: { flexDirection: 'row', alignItems: 'center' },
  ruleText: { fontSize: 11.5, fontWeight: '600', color: colors.muted, marginLeft: 8 },
  ruleTextOk: { color: colors.text },
});
