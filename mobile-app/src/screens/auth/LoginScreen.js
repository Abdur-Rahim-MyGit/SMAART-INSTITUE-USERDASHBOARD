import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';
import { FadeSlideIn, PressScale, useShake } from '../../components/Motion';
import PillInput from '../../components/PillInput';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const shakeStyle = useShake(error);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter your email/ID and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Login directly without institution pre-selection (handled globally by backend)
      const res = await login(email.trim(), password);
      if (res.requireOtp) {
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

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDarkest} />

      {/* Top Header */}
      <FadeSlideIn duration={380}>
        <View style={styles.topHeader}>
          <Pressable
            onPress={() => navigation.navigate('WelcomeOnboarding', { review: true })}
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
      </FadeSlideIn>

      {/* Obsidian Curved Form Card */}
      <FadeSlideIn duration={420} delay={90} style={{ flex: 1 }}>
        <View style={styles.formCard}>
          {/* Email or Student ID Input (Modular Pill component) */}
          <PillInput
            label="Email or Student ID"
            icon="mail"
            placeholder="smaart@gmail.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password Input (Modular Pill component) */}
          <PillInput
            label="Password"
            icon="lock"
            placeholder="••••••••••"
            secure={true}
            value={password}
            onChangeText={setPassword}
          />

          {/* Forgot Password Link (Right-aligned) */}
          <View style={styles.forgotRow}>
            <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Error Banner */}
          {error ? (
            <Animated.View style={[styles.errorBanner, shakeStyle]}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Primary Login Button */}
          <PressScale
            style={styles.loginBtn}
            pressedStyle={styles.loginBtnPressed}
            scaleTo={0.98}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </PressScale>

          <Text style={styles.footerNote}>
            Trouble signing in? Contact your institution administrator.
          </Text>
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
    paddingTop: 32,
    paddingBottom: 24,
    ...shadow.card,
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
    color: colors.primaryBright,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

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

  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 14,
  },
});
