/**
 * FR-AUTH-02 (step 2 of 3) — Confirm the signup email with the 6-digit code.
 *
 * The backend gives this code a hard 3-minute life and 5 attempts
 * (`/auth/verify-signup-otp`), so both are surfaced here rather than left for
 * the student to discover through failures. Note that `/auth/resend-signup-otp`
 * ROTATES the tempToken — the new one must replace the old or every later call
 * 400s.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import Banner from '../../components/Banner';
import { FadeSlideIn } from '../../components/Motion';
import { resendSignupOtp, verifySignupOtp } from '../../api/auth';
import { colors } from '../../theme';

const OTP_TTL_SECONDS = 180; // matches the server's 3-minute window
const RESEND_COOLDOWN_SECONDS = 60; // matches OTP_RESEND_COOLDOWN in routes/auth.js

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SignupOtpScreen({ route, navigation }) {
  const { tempToken: initialTempToken, email, fullName } = route.params;

  const [tempToken, setTempToken] = useState(initialTempToken);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const timerRef = useRef(null);
  const resendPulse = useRef(new Animated.Value(1)).current;
  const resendPulseLoop = useRef(null);

  useEffect(() => {
    if (resending) {
      resendPulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(resendPulse, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(resendPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      resendPulseLoop.current.start();
    } else {
      resendPulseLoop.current?.stop();
      resendPulse.setValue(1);
    }
    return () => resendPulseLoop.current?.stop();
  }, [resending, resendPulse]);

  // One interval drives both counters — they only ever tick down together.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const restartTimers = () => {
    setSecondsLeft(OTP_TTL_SECONDS);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await verifySignupOtp(tempToken, otp);
      // Server echoes back the verified identity — carry it forward rather than
      // trusting what was typed two screens ago.
      navigation.navigate('CreatePassword', {
        email: res.email || email,
        fullName: res.fullName || fullName,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError('');
    setInfo('');
    try {
      const res = await resendSignupOtp(tempToken);
      if (res?.tempToken) setTempToken(res.tempToken); // token rotates — must adopt it
      setOtp('');
      restartTimers();
      setInfo('A new code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const expired = secondsLeft === 0;

  return (
    <AuthScreenLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to\n${email}`}
      onBack={() => navigation.goBack()}
    >
      <FadeSlideIn duration={400}>
      <PillInput
        label="Verification Code"
        icon="key"
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ''))}
        returnKeyType="done"
        onSubmitEditing={handleVerify}
      />

      <View style={styles.timerRow}>
        <Feather
          name={expired ? 'alert-circle' : 'clock'}
          size={14}
          color={expired ? colors.danger : colors.muted}
        />
        <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
          {expired ? 'Code expired — request a new one' : `Expires in ${formatClock(secondsLeft)}`}
        </Text>
      </View>

      <Banner variant="success" message={info} />
      <Banner variant="error" message={error} />

      <PillButton
        title="Verify & Continue"
        icon="arrow-right"
        onPress={handleVerify}
        loading={loading}
        disabled={expired}
      />

      <Pressable onPress={handleResend} disabled={cooldown > 0 || resending} style={styles.resendBtn}>
        <Animated.Text
          style={[
            styles.resendText,
            cooldown > 0 && styles.resendTextDisabled,
            resending && { opacity: resendPulse },
          ]}
        >
          {resending
            ? 'Sending…'
            : cooldown > 0
              ? `Resend code in ${formatClock(cooldown)}`
              : 'Resend Code'}
        </Animated.Text>
      </Pressable>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: -4,
  },
  timerText: { fontSize: 12, fontWeight: '700', color: colors.muted, marginLeft: 6 },
  timerTextExpired: { color: colors.danger },
  resendBtn: { alignItems: 'center', paddingVertical: 12 },
  resendText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  resendTextDisabled: { color: colors.mutedLight },
});
