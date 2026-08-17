/**
 * OtpVerifyScreen — Redesigned Verify OTP Screen.
 *
 * Layout matches LoginScreen.js exactly:
 *  - Slate dark top section with back button outline circle
 *  - "Verify OTP" header and email subtitle
 *  - Curved white sheet containing input forms
 *  - Pill-shaped OTP input with custom grey border (placeholder: "Enter your OTP")
 *  - Vibrant blue action pill buttons
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { resendLoginOtp, verifyLoginOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';

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

      // FR-AUTH-05 — first login on an admin-issued password. The server has
      // just swapped our login OTP for a fresh `password-change` tempToken;
      // hand that to ChangePasswordScreen, which finishes the sign-in natively.
      // (This used to dead-end by telling the student to go use the web
      // dashboard — that redirect is gone.)
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
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDark} />

      {/* Top Header */}
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

      {/* White Curved Form Card */}
      <View style={styles.formCard}>
        {/* OTP Input Label */}
        <Text style={styles.inputLabel}>OTP Verification Code</Text>
        <View style={styles.inputRow}>
          <Feather name="key" size={18} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your OTP"
            placeholderTextColor={colors.mutedLight}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
        </View>

        {/* Info Banner */}
        {info ? (
          <View style={styles.infoBanner}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={styles.infoText}>{info}</Text>
          </View>
        ) : null}

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        {forceLogoutPrompt ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
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
            </Pressable>

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
          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
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
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.resendBtn, pressed && styles.resendBtnPressed]}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.resendBtnText}>Resend OTP Code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDark,
  },
  topHeader: {
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT + 14,
    paddingBottom: 28,
    backgroundColor: colors.navyDark,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
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

  // White Curved Form Card
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    ...shadow.card,
  },

  // Custom Pill Inputs
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
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  infoText: { color: colors.success, fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },

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
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cancelBtnPressed: {
    backgroundColor: '#F3F4F6',
    transform: [{ scale: 0.98 }],
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
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
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
});
