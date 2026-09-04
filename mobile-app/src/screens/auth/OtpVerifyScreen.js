import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { resendLoginOtp, verifyLoginOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';
import { FadeSlideIn, PressScale, useShake } from '../../components/Motion';
import PillInput from '../../components/PillInput';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

export default function OtpVerifyScreen({ route, navigation }) {
  const { tempToken: initialTempToken, email, fullName } = route.params;
  const { signIn } = useAuth();
  const [tempToken, setTempToken] = useState(initialTempToken);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [forceLogoutPrompt, setForceLogoutPrompt] = useState(false);
  const shakeStyle = useShake(error);

  const handleVerify = async (forceLogout = false) => {
    if (!otp) {
      setError('Enter the OTP sent to your email.');
      return;
    }
    setError('');
    setForceLogoutPrompt(false);
    setLoading(true);
    try {
      const res = await verifyLoginOtp(tempToken, otp, forceLogout);
      setForceLogoutPrompt(false);

      if (res.requirePasswordChange && res.tempToken) {
        navigation.navigate('ChangePassword', {
          tempToken: res.tempToken,
          email: res.email || email,
          fullName: res.fullName || fullName,
        });
        return;
      }

      if (res.token && res.user) {
        await signIn(res.token, res.user);
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err) {
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
    setForceLogoutPrompt(false);
    try {
      const res = await resendLoginOtp(tempToken);
      if (res?.tempToken) {
        setTempToken(res.tempToken);
      }
      setInfo('A new OTP has been sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDarkest} />

      {/* Top Header */}
      <FadeSlideIn duration={380}>
        <View style={styles.topHeader}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle}>Verify OTP</Text>
          <Text style={styles.headerSubtitle}>
            Enter the verification code sent to{'\n'}{email}
          </Text>
        </View>
      </FadeSlideIn>

      {/* Obsidian Curved Form Card */}
      <FadeSlideIn duration={420} delay={90} style={{ flex: 1 }}>
        <View style={styles.formCard}>
          {/* OTP Input Component */}
          <PillInput
            label="OTP Verification Code"
            icon="key"
            placeholder="Enter your OTP"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          {/* Info Banner */}
          {info ? (
            <View style={styles.infoBanner}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={styles.infoText}>{info}</Text>
            </View>
          ) : null}

          {/* Error Banner */}
          {error ? (
            <Animated.View style={[styles.errorBanner, shakeStyle]}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Action Buttons */}
          {forceLogoutPrompt ? (
            <>
              <PressScale
                style={styles.loginBtn}
                pressedStyle={styles.loginBtnPressed}
                scaleTo={0.98}
                onPress={() => handleVerify(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Force Logout & Continue</Text>
                    <Feather name="log-out" size={16} color="#FFFFFF" style={styles.btnIcon} />
                  </>
                )}
              </PressScale>

              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                onPress={() => {
                  setForceLogoutPrompt(false);
                  setError('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <PressScale
              style={styles.loginBtn}
              pressedStyle={styles.loginBtnPressed}
              scaleTo={0.98}
              onPress={() => handleVerify(false)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Verify Code</Text>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" style={styles.btnIcon} />
                </>
              )}
            </PressScale>
          )}

          <Pressable
            style={({ pressed }) => [styles.resendBtn, pressed && styles.resendBtnPressed]}
            onPress={handleResend}
            disabled={resending}
          >
            <Text style={styles.resendBtnText}>Resend OTP Code</Text>
          </Pressable>
        </View>
      </FadeSlideIn>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDarkest,
  },
  topHeader: {
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT + 14,
    paddingBottom: 28,
    backgroundColor: colors.navyDarkest,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },

  // Obsidian Curved Form Card
  formCard: {
    flex: 1,
    backgroundColor: colors.navyDark,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    ...shadow.card,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  infoText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

  // Submit/Verify Button
  loginBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    ...shadow.button,
    shadowColor: colors.primary,
  },
  loginBtnPressed: {
    backgroundColor: colors.primaryBright,
    transform: [{ scale: 0.98 }],
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnIcon: {
    marginLeft: 8,
  },

  // Cancel Button (for force logout confirm)
  cancelBtn: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cancelBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ scale: 0.98 }],
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },

  // Resend OTP Link
  resendBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  resendBtnPressed: {
    opacity: 0.6,
  },
  resendBtnText: {
    color: colors.primaryBright,
    fontWeight: '800',
    fontSize: 14,
  },
});
