/**
 * LoginScreen — Redesigned Sign In Screen.
 *
 * Matches the user's reference image closely:
 *  - Slate dark top section with back button outline circle
 *  - "Go ahead and sign in to your account" heading
 *  - Curved white sheet containing input forms
 *  - Pill-shaped inputs (borderRadius: 27) with blue outlined icons
 *  - Bright blue pill-shaped action Login button (borderRadius: 27)
 *  - Removed Remember Me, social icons (Google/Apple), and Register option as requested
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

export default function LoginScreen({ navigation }) {
  const { college } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealPassword, setRevealPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter your email/ID and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await login(email.trim(), password, college?.collegeCode);
      if (res.requireOtp) {
        // `flowType` is 'first-login' when the account still has its
        // admin-issued password — OtpVerifyScreen uses it to route on to
        // ChangePasswordScreen once the code checks out (FR-AUTH-05).
        navigation.navigate('OtpVerify', {
          tempToken: res.tempToken,
          email: res.email,
          fullName: res.fullName,
          flowType: res.flowType,
        });
      } else {
        setError('Unexpected response from server — no OTP step returned.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeChange = () => {
    navigation.navigate('InstitutionSelector');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDark} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => navigation.navigate('WelcomeOnboarding')}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Go ahead and sign in to your account</Text>
        <Text style={styles.headerSubtitle}>
          Sign in to enjoy the best educational experience
        </Text>
      </View>

      {/* White Curved Form Card */}
      <View style={styles.formCard}>
        {/* Selected College Pill Badge */}
        {college ? (
          <View style={styles.collegeBadge}>
            <View style={styles.collegeIcon}>
              <Feather name="home" size={15} color="#475569" />
            </View>
            <View style={styles.collegeInfo}>
              <Text style={styles.collegeLabel}>INSTITUTION</Text>
              <Text style={styles.collegeName} numberOfLines={1}>
                {college.collegeName}
              </Text>
            </View>
            <Pressable onPress={handleCollegeChange} hitSlop={10} style={styles.changeBtnWrap}>
              <Text style={styles.changeText}>CHANGE</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.noCollegeBadge} onPress={handleCollegeChange}>
            <Feather name="alert-circle" size={15} color={colors.gold} />
            <Text style={styles.noCollegeText}>No college selected.</Text>
            <Text style={styles.selectCollegeLink}>Select College →</Text>
          </Pressable>
        )}

        {/* Email or Student ID Input (Pill Shaped) */}
        <Text style={styles.inputLabel}>Email or Student ID</Text>
        <View style={styles.inputRow}>
          <Feather name="mail" size={18} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="smaart@gmail.com"
            placeholderTextColor={colors.mutedLight}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input (Pill Shaped) */}
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputRow}>
          <Feather name="lock" size={18} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="••••••••••"
            placeholderTextColor={colors.mutedLight}
            secureTextEntry={!revealPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setRevealPassword(!revealPassword)} hitSlop={10}>
            <Feather name={revealPassword ? "eye-off" : "eye"} size={18} color={colors.mutedLight} />
          </Pressable>
        </View>

        {/* Forgot Password Link (Right-aligned) — FR-AUTH-06 */}
        <View style={styles.forgotRow}>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Primary Login Button */}
        <Pressable
          style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.loginBtnText}>Login</Text>
          )}
        </Pressable>

        {/* FR-AUTH-02 — self-service signup */}
        <View style={styles.signupRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>NEW HERE?</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.signupBtn, pressed && styles.signupBtnPressed]}
          onPress={() => {
            Alert.alert(
              'Account Request',
              'Self-registration is disabled. Please contact us at hello@smaartinstitute.org to request an account.',
              [
                {
                  text: 'Email Support',
                  onPress: () => {
                    Linking.openURL('mailto:hello@smaartinstitute.org?subject=SMAART%20Institute%20Account%20Request').catch(() => {
                      Alert.alert('Error', 'Could not open mail client. Please send email to hello@smaartinstitute.org');
                    });
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Text style={styles.signupBtnText}>Create an Account</Text>
          <Feather name="user-plus" size={16} color={colors.primary} style={styles.signupIcon} />
        </Pressable>

        <Text style={styles.footerNote}>
          Trouble signing in? Contact your institution administrator.
        </Text>
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
    paddingTop: 32,
    paddingBottom: 24,
    ...shadow.card,
  },

  // College Pill Badge (Grey Border, Muted Accent)
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  collegeIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  collegeInfo: { flex: 1, minWidth: 0 },
  collegeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748B',
  },
  collegeName: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 1 },
  changeBtnWrap: {
    marginLeft: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    ...shadow.card,
    shadowOpacity: 0.03,
  },
  changeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#4B5563',
  },

  noCollegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  noCollegeText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  selectCollegeLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
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
    marginBottom: 20,
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

  // Forgot Password
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
    paddingRight: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },

  // Sign In Button
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

  // Signup divider + secondary action
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.mutedLight,
    marginHorizontal: 12,
  },
  signupBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupBtnPressed: { backgroundColor: '#DBEAFE', transform: [{ scale: 0.98 }] },
  signupBtnText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  signupIcon: { marginLeft: 8 },

  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 14,
  },
});
