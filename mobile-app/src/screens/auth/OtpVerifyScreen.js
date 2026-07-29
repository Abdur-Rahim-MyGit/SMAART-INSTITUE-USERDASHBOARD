import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { resendLoginOtp, verifyLoginOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

// FR-AUTH-04 — OTP step-up verification.
export default function OtpVerifyScreen({ route }) {
  const { tempToken, email } = route.params;
  const { signIn } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleVerify = async () => {
    if (!otp) {
      setError('Enter the OTP sent to your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await verifyLoginOtp(tempToken, otp);
      if (res.requirePasswordChange) {
        // FR-AUTH-05 — first-login forced password change is a separate flow;
        // this basic scaffold surfaces it clearly rather than pretending to handle it.
        setError('This account must change its password on the web dashboard before first mobile login.');
        return;
      }
      if (res.token && res.user) {
        await signIn(res.token, res.user);
        // RootNavigator swaps to MainTabs automatically once `user` is set.
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setInfo('');
    try {
      await resendLoginOtp(tempToken);
      setInfo('A new OTP has been sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

      <AppTextInput
        label="OTP Code"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {info ? <Text style={styles.infoText}>{info}</Text> : null}

      <AppButton title="Verify" onPress={handleVerify} loading={loading} />
      <AppButton title="Resend OTP" variant="secondary" onPress={handleResend} loading={resending} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
  errorText: { color: colors.danger, marginBottom: 8 },
  infoText: { color: colors.accent, marginBottom: 8 },
});
