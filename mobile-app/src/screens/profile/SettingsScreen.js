/**
 * Settings — security (FR-AUTH-09 biometric toggle, session/device info),
 * appearance (dark mode), and account (in-app password change). Notification
 * preferences are the one thing still missing here — there's no backend
 * concept of per-user notification prefs anywhere in this product yet (web
 * included), so it isn't a mobile gap to fill in isolation; it needs a real
 * design + a new backend field before it can land anywhere.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getBiometricCapability, promptBiometric } from '../../utils/biometrics';
import { getDeviceLabel } from '../../utils/device';
import { radius } from '../../theme';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import PasswordRules from '../../components/PasswordRules';
import Banner from '../../components/Banner';
import { changePassword } from '../../api/auth';
import { formatServerPasswordError, validatePassword } from '../../utils/password';

function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function ChangePasswordModal({ visible, onClose }) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const policy = useMemo(() => validatePassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = !!current && policy.isValid && confirm === password && !loading;

  const reset = () => {
    setCurrent('');
    setPassword('');
    setConfirm('');
    setError('');
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!current) {
      setError('Enter your current password.');
      return;
    }
    if (!policy.isValid) {
      setError('Your new password does not meet all the requirements below.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await changePassword(current, password, confirm);
      setDone(true);
    } catch (err) {
      if (err.status === 401) {
        setError('Current password is incorrect.');
      } else {
        setError(formatServerPasswordError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Feather name="x" size={20} color="#0F172A" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {done ? (
              <View style={styles.doneWrap}>
                <View style={styles.doneBadge}>
                  <Feather name="check-circle" size={30} color="#10B981" />
                </View>
                <Text style={styles.doneTitle}>Password changed</Text>
                <Text style={styles.doneText}>Use your new password the next time you sign in.</Text>
                <PillButton title="Done" onPress={handleClose} style={{ marginTop: 8 }} />
              </View>
            ) : (
              <>
                <PillInput
                  label="Current Password"
                  icon="lock"
                  placeholder="••••••••••"
                  secure
                  value={current}
                  onChangeText={setCurrent}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <PillInput
                  label="New Password"
                  icon="lock"
                  placeholder="••••••••••"
                  secure
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <PasswordRules password={password} />
                <PillInput
                  label="Confirm New Password"
                  icon="lock"
                  placeholder="••••••••••"
                  secure
                  value={confirm}
                  onChangeText={setConfirm}
                  autoCapitalize="none"
                  error={mismatch ? 'Passwords do not match' : undefined}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <Banner variant="error" message={error} />
                <PillButton title="Update Password" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { user, biometricEnabled, setBiometricPreference } = useAuth();
  const { colors: c, theme, toggleTheme } = useTheme();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

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
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]} edges={['top']}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <AnimatedSection delay={0}>
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
      </AnimatedSection>

      <AnimatedSection delay={80}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>APPEARANCE</Text>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: c.pillBg }]}>
              <Feather name={theme === 'dark' ? 'moon' : 'sun'} size={17} color={c.primaryBright} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Dark mode</Text>
              <Text style={[styles.rowSubtitle, { color: c.textMuted }]}>
                {theme === 'dark' ? 'On — matches the same toggle on Home' : 'Off — matches the same toggle on Home'}
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.white}
            />
          </View>
        </View>
      </AnimatedSection>

      <AnimatedSection delay={140}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ACCOUNT</Text>

        <Pressable
          onPress={() => setPasswordModalOpen(true)}
          style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: c.pillBg }]}>
              <Feather name="key" size={17} color={c.primaryBright} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Change password</Text>
              <Text style={[styles.rowSubtitle, { color: c.textMuted }]}>Update your password without leaving the app</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textMuted} />
          </View>
        </Pressable>
      </AnimatedSection>

      <AnimatedSection delay={200}>
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
          Notification preferences aren't here yet — there's no per-user preference concept on the
          backend to control yet, on web or mobile.
        </Text>
      </AnimatedSection>

      <ChangePasswordModal visible={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </ScrollView>
    </SafeAreaView>
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

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalScroll: { padding: 20, paddingBottom: 34 },

  doneWrap: { alignItems: 'center', paddingVertical: 20 },
  doneBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B98122',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  doneTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  doneText: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, marginBottom: 6 },
});
