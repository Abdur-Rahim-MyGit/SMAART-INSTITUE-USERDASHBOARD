/**
 * FR-AUTH-06 (step 2 of 2) — Enter the emailed code and set a new password.
 *
 * Code and password are submitted together in a single `/auth/reset-password`
 * call; the separate `/auth/verify-reset-otp` endpoint exists but calling it
 * first would burn one of the 5 attempts for no benefit, since reset-password
 * re-verifies anyway.
 *
 * Resetting does NOT return a token — the server rotates `passwordChangedAt`,
 * which invalidates every existing JWT. That's intentional (a password reset
 * should kick out whoever was in the account) so we route back to Login.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import PasswordRules from '../../components/PasswordRules';
import Banner from '../../components/Banner';
import { FadeSlideIn } from '../../components/Motion';
import { resetPassword } from '../../api/auth';
import { formatServerPasswordError, validatePassword } from '../../utils/password';
import { colors, radius } from '../../theme';

const OTP_TTL_SECONDS = 180; // server enforces a 3-minute window

function formatClock(total) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function ResetPasswordScreen({ route, navigation }) {
  const { resetToken, email } = route.params;

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);

  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const policy = useMemo(() => validatePassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const expired = secondsLeft === 0;
  const canSubmit = otp.length === 6 && policy.isValid && confirm === password && !expired && !loading;

  const handleReset = async () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit code from your email.');
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
      await resetPassword(resetToken, otp, password);
      setDone(true);
    } catch (err) {
      setError(formatServerPasswordError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthScreenLayout title="Password updated" subtitle="You can now sign in with your new password">
        <FadeSlideIn duration={420}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Feather name="check" size={26} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>All set</Text>
          <Text style={styles.successBody}>
            Your password for {email} has been changed. For security, any other device that was
            signed in has been signed out.
          </Text>
        </View>

        <PillButton
          title="Sign In"
          icon="arrow-right"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
        />
        </FadeSlideIn>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Choose a new password"
      subtitle={`Enter the code sent to\n${email}`}
      onBack={() => navigation.goBack()}
    >
      <FadeSlideIn duration={400}>
      <PillInput
        label="Reset Code"
        icon="key"
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ''))}
        returnKeyType="next"
      />

      <View style={styles.timerRow}>
        <Feather
          name={expired ? 'alert-circle' : 'clock'}
          size={14}
          color={expired ? colors.danger : colors.muted}
        />
        <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
          {expired
            ? 'Code expired — request a new one'
            : `Code expires in ${formatClock(secondsLeft)}`}
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
        onSubmitEditing={handleReset}
      />

      <Banner variant="error" message={error} />

      {expired ? (
        <PillButton
          title="Request a New Code"
          icon="refresh-cw"
          onPress={() => navigation.replace('ForgotPassword')}
        />
      ) : (
        <PillButton
          title="Reset Password"
          icon="check"
          onPress={handleReset}
          loading={loading}
          disabled={!canSubmit}
        />
      )}
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    marginTop: -4,
  },
  timerText: { fontSize: 12, fontWeight: '700', color: colors.muted, marginLeft: 6 },
  timerTextExpired: { color: colors.danger },

  successCard: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.lg,
    padding: 22,
    marginBottom: 20,
  },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { fontSize: 17, fontWeight: '800', color: '#166534', marginBottom: 6 },
  successBody: {
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
    color: '#166534',
    textAlign: 'center',
  },
});
