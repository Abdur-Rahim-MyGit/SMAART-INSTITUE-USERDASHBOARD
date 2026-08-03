import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { resendLoginOtp, verifyLoginOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';

// FR-AUTH-04 — OTP step-up verification.
export default function OtpVerifyScreen({ route, navigation }) {
  const { tempToken, email } = route.params;
  const { signIn } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [forceLogoutPrompt, setForceLogoutPrompt] = useState(false);

  const handleVerify = async (forceLogout = false) => {
    if (!otp) {
      setError('Enter the OTP sent to your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await verifyLoginOtp(tempToken, otp, forceLogout);
      setForceLogoutPrompt(false);
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
      // Single-session enforcement (back-end/routes/auth.js) — mirrors the
      // web app's LoginOtpModal force-logout confirm flow.
      if (err.status === 409 || err.data?.requiresForceLogout) {
        setForceLogoutPrompt(true);
        setError(err.message);
        return;
      }
      setForceLogoutPrompt(false);
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
    <ScreenContainer contentStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backButton}>
        <Feather name="chevron-left" size={18} color={colors.navy} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Feather name="shield" size={26} color={colors.primary} />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the code sent to{'\n'}{email}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardAccent} />

        <AppTextInput
          label="OTP Code"
          icon="key"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={15} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {info ? (
          <View style={styles.infoBanner}>
            <Feather name="check-circle" size={15} color={colors.success} />
            <Text style={styles.infoText}>{info}</Text>
          </View>
        ) : null}

        {forceLogoutPrompt ? (
          <>
            <AppButton
              title="Log out other device & continue"
              icon="log-out"
              onPress={() => handleVerify(true)}
              loading={loading}
            />
            <AppButton
              title="Cancel"
              variant="link"
              onPress={() => {
                setForceLogoutPrompt(false);
                setError('');
              }}
            />
          </>
        ) : (
          <AppButton title="Verify" icon="arrow-right" onPress={() => handleVerify(false)} loading={loading} />
        )}
        <AppButton title="Resend OTP" variant="link" onPress={handleResend} loading={resending} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, alignSelf: 'flex-start' },
  backText: { color: colors.navy, fontSize: 14, fontWeight: '700', marginLeft: 2 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy, letterSpacing: -0.4 },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    paddingTop: 26,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.navy,
    opacity: 0.85,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  infoText: { color: colors.success, fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
});
