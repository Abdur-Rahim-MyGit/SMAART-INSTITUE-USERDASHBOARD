/**
 * FR-AUTH-02 (step 1 of 3) — Signup: name + email.
 *
 * Deliberately does NOT collect a password yet. The backend verifies the email
 * owns a real inbox first (`/auth/send-signup-otp`), and only creates the
 * account after that OTP is confirmed — so a password typed here would just be
 * held in memory across two screens for nothing.
 *
 * What the account looks like afterwards: `/auth/register` creates a *pending*
 * Student with no college and no roll number. An institution admin provisions
 * it before the student can sit assessments. That's stated plainly on screen so
 * nobody signs up expecting instant access.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import Banner from '../../components/Banner';
import { sendSignupOtp } from '../../api/auth';
import { colors, radius } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();

    if (!name) {
      setError('Enter your full name.');
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await sendSignupOtp(mail, name);
      navigation.navigate('SignupOtp', {
        tempToken: res.tempToken,
        email: mail,
        fullName: name,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Create your account"
      subtitle="We'll email you a code to confirm it's really you"
      onBack={() => navigation.goBack()}
    >
      <PillInput
        label="Full Name"
        icon="user"
        placeholder="Your full name"
        autoCapitalize="words"
        value={fullName}
        onChangeText={setFullName}
        returnKeyType="next"
      />

      <PillInput
        label="Email Address"
        icon="mail"
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        returnKeyType="done"
        onSubmitEditing={handleContinue}
      />

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Before you sign up</Text>
        <Text style={styles.noticeBody}>
          Self-registered accounts start as <Text style={styles.noticeStrong}>pending</Text>. Your
          institution's administrator links you to your college and enables assessments. If your
          college already gave you login details, use{' '}
          <Text style={styles.noticeStrong}>Sign In</Text> instead.
        </Text>
      </View>

      <Banner variant="error" message={error} />

      <PillButton
        title="Send Verification Code"
        icon="arrow-right"
        onPress={handleContinue}
        loading={loading}
      />

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.footerBtn}>
        <Text style={styles.footerNote}>
          Already have an account? <Text style={styles.footerLink}>Sign In</Text>
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 18,
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 6,
  },
  noticeBody: { fontSize: 12.5, lineHeight: 18, fontWeight: '500', color: '#1E3A8A' },
  noticeStrong: { fontWeight: '800' },
  footerBtn: { paddingVertical: 8 },
  footerNote: {
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.muted,
  },
  footerLink: { color: colors.navy, fontWeight: '800' },
});
