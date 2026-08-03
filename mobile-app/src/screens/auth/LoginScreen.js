import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';

// FR-AUTH-03 — password login. Every successful login currently requires an
// OTP step server-side (see back-end/routes/auth.js), so we always land on OtpVerify.
export default function LoginScreen({ navigation }) {
  const { college } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        navigation.navigate('OtpVerify', { tempToken: res.tempToken, email: res.email, flowType: res.flowType });
      } else {
        setError('Unexpected response from server — no OTP step returned.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.header}>
        <Image source={require('../../../assets/smaart-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Access your personalized learning and career dashboard</Text>
      </View>

      {college ? (
        <View style={styles.institutionBadge}>
          <View style={styles.institutionIcon}>
            <Feather name="home" size={16} color={colors.primary} />
          </View>
          <View style={styles.institutionInfo}>
            <Text style={styles.institutionName} numberOfLines={1}>
              {college.collegeName}
            </Text>
            {college.address?.city ? (
              <Text style={styles.institutionLocation} numberOfLines={1}>
                {[college.address.city, college.address.state].filter(Boolean).join(', ')}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => navigation.navigate('InstitutionSelector')} hitSlop={8}>
            <Text style={styles.institutionChange}>CHANGE</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardAccent} />

        <AppTextInput
          label="Email or Student ID"
          icon="mail"
          placeholder="your@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <AppTextInput
          label="Password"
          icon="lock"
          placeholder="••••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={15} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppButton title="Log In" icon="arrow-right" onPress={handleLogin} loading={loading} />
      </View>

      <Text style={styles.footer}>
        Need help? <Text style={styles.footerLink}>Contact Admin</Text>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 224, height: 76, marginBottom: 10 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    ...shadow.card,
    shadowOpacity: 0.04,
  },
  institutionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  institutionInfo: { flex: 1, minWidth: 0 },
  institutionName: { fontSize: 13, fontWeight: '700', color: colors.text },
  institutionLocation: { fontSize: 11, fontWeight: '500', color: colors.muted, marginTop: 1 },
  institutionChange: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.navy,
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
  footer: {
    textAlign: 'center',
    marginTop: 22,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  footerLink: { color: colors.primary, fontWeight: '700' },
});
