/**
 * Settings — currently the security section only (FR-AUTH-09 toggle plus
 * session/device info). The wider settings surface (theme, notification prefs,
 * in-app password change) lands with Phase 7; this screen exists now because
 * biometric login needs somewhere to be turned on and off.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getBiometricCapability, promptBiometric } from '../../utils/biometrics';
import { getDeviceLabel } from '../../utils/device';
import { radius } from '../../theme';

export default function SettingsScreen() {
  const { user, biometricEnabled, setBiometricPreference } = useAuth();
  const { colors: c } = useTheme();

  const [capability, setCapability] = useState({
    available: false,
    enrolled: false,
    label: 'Biometrics',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBiometricCapability().then(setCapability);
  }, []);

  const handleToggleBiometric = useCallback(
    async (next) => {
      if (!next) {
        setSaving(true);
        await setBiometricPreference(false);
        setSaving(false);
        return;
      }

      if (!capability.available) {
        Alert.alert('Not supported', 'This device does not have a biometric sensor.');
        return;
      }
      if (!capability.enrolled) {
        Alert.alert(
          `Set up ${capability.label} first`,
          `You haven't registered ${capability.label} on this device yet. Add it in your device settings, then come back.`
        );
        return;
      }

      // Prove the sensor works before promising the student it will unlock the
      // app — enabling a lock they can't pass would strand them next launch.
      setSaving(true);
      const res = await promptBiometric(`Confirm ${capability.label} to enable it`);
      if (res.success) {
        await setBiometricPreference(true);
      } else if (res.error !== 'user_cancel' && res.error !== 'system_cancel') {
        Alert.alert('Could not verify', 'Please try again.');
      }
      setSaving(false);
    },
    [capability, setBiometricPreference]
  );

  const biometricDisabled = saving || (!capability.available && !biometricEnabled);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>SECURITY</Text>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: c.pillBg }]}>
            <Feather name="unlock" size={17} color={c.primaryBright} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: c.text }]}>Unlock with {capability.label}</Text>
            <Text style={[styles.rowSubtitle, { color: c.textMuted }]}>
              {!capability.available
                ? 'Not available on this device'
                : !capability.enrolled
                  ? `No ${capability.label} registered on this device yet`
                  : 'Reopen the app without retyping your password'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggleBiometric}
            disabled={biometricDisabled}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={c.white}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: c.pillBg }]}>
            <Feather name="shield" size={17} color={c.primaryBright} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: c.text }]}>Single active session</Text>
            <Text style={[styles.rowSubtitle, { color: c.textMuted }]}>
              Signing in here signs you out everywhere else. Always on.
            </Text>
          </View>
          <Feather name="check-circle" size={18} color={c.success} />
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>THIS DEVICE</Text>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: c.textMuted }]}>Signed in as</Text>
          <Text style={[styles.infoVal, { color: c.text }]} numberOfLines={1}>
            {user?.email || '—'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: c.textMuted }]}>Device</Text>
          <Text style={[styles.infoVal, { color: c.text }]} numberOfLines={1}>
            {getDeviceLabel()}
          </Text>
        </View>
      </View>

      <Text style={[styles.footnote, { color: c.textMuted }]}>
        More settings — theme, notifications and in-app password change — arrive with the
        notifications release.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 6,
    marginTop: 14,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1, marginRight: 10 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSubtitle: { fontSize: 11.5, fontWeight: '500', marginTop: 2, lineHeight: 16 },
  divider: { height: 1, marginLeft: 48 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  infoKey: { fontSize: 12.5, fontWeight: '600', marginRight: 12 },
  infoVal: { fontSize: 12.5, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  footnote: {
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
    marginTop: 18,
    paddingHorizontal: 6,
  },
});
