/**
 * FR-AUTH-05 — Forced password change on first login.
 *
 * Replaces the previous dead-end where OtpVerifyScreen detected
 * `requirePasswordChange` and told the student to go finish on the web
 * dashboard. The full flow is now native:
 *
 *   Login (mustChangePassword) → OTP (flowType 'first-login')
 *     → verify-login-otp returns { requirePasswordChange, tempToken }
 *     → THIS screen → /auth/first-login-change-password → JWT → signed in.
 *
 * The tempToken here is a *different* token from the login OTP one — the server
 * issues a fresh `password-change` record and deletes the old one, so this
 * screen cannot be reached or replayed without having passed the OTP.
 *
 * Edge case worth keeping: if the student already completed registration on the
 * web, the endpoint refuses the change and returns `alreadyRegistered: true`
 * WITH a valid token — so we sign them in instead of showing an error.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import PasswordRules from '../../components/PasswordRules';
import Banner from '../../components/Banner';
import { FadeSlideIn } from '../../components/Motion';
import { firstLoginChangePassword } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { formatServerPasswordError, validatePassword } from '../../utils/password';
import { colors, radius } from '../../theme';

export default function ChangePasswordScreen({ route, navigation }) {
  const { tempToken, email, fullName } = route.params;
  const { signIn } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const policy = useMemo(() => validatePassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = policy.isValid && confirm === password && !loading;

  const handleChange = async () => {
    if (!policy.isValid) {
      setError('Your password does not meet all the requirements below.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await firstLoginChangePassword(tempToken, password, confirm);

      if (res?.token && res?.user) {
        // Covers both the normal path and `alreadyRegistered` — both return a
        // usable session, so either way the student ends up inside the app.
        await signIn(res.token, res.user);
      } else {
        setError('Password changed, but sign-in failed. Please log in with your new password.');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } catch (err) {
      // A dead/expired temp token means the OTP step must be redone.
      if (err.status === 403 || /session expired/i.test(err.message || '')) {
        setError('This session has expired. Please sign in again to restart.');
      } else {
        setError(formatServerPasswordError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const firstName = String(fullName || '').split(' ')[0];

  return (
    <AuthScreenLayout
      title={firstName ? `Welcome, ${firstName}` : 'Set your password'}
      subtitle="Your institution issued a temporary password. Choose your own to continue."
    >
      <FadeSlideIn duration={400}>
      <View style={styles.noticeCard}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={styles.noticeText}>
          This is a one-time step for {email}. You won't be asked again.
        </Text>
      </View>

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
        onSubmitEditing={handleChange}
      />

      <Banner variant="error" message={error} />

      <PillButton
        title="Set Password & Continue"
        icon="arrow-right"
        onPress={handleChange}
        loading={loading}
        disabled={!canSubmit}
      />

      <Text style={styles.hint}>
        Your new password must be different from the temporary one you were given.
      </Text>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EAF7FD',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 22,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    marginLeft: 10,
  },
  hint: {
    textAlign: 'center',
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.mutedLight,
    paddingHorizontal: 10,
  },
});
