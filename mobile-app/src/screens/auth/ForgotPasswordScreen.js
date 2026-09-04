import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import Banner from '../../components/Banner';
import { FadeSlideIn } from '../../components/Motion';
import { forgotPassword } from '../../api/auth';
import { colors, radius } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstTimeUser, setFirstTimeUser] = useState(false);

  const handleSubmit = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      setError('Enter the email address on your account.');
      return;
    }

    setError('');
    setFirstTimeUser(false);
    setLoading(true);
    try {
      // Direct global forgot password trigger without institution constraints
      const res = await forgotPassword(mail);
      navigation.navigate('ResetPassword', { resetToken: res.resetToken, email: mail });
    } catch (err) {
      if (err.data?.isFirstTimeUser) {
        setFirstTimeUser(true);
        setError('');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Reset your password"
      subtitle="We'll email you a code to set a new password"
      onBack={() => navigation.goBack()}
    >
      <FadeSlideIn duration={400}>
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
          onSubmitEditing={handleSubmit}
        />

        {firstTimeUser ? (
          <View style={styles.firstTimeCard}>
            <Text style={styles.firstTimeTitle}>Your account isn't set up yet</Text>
            <Text style={styles.firstTimeBody}>
              You haven't signed in for the first time yet, so there's no password to reset. Sign in
              with the default password your institution gave you — you'll be asked to choose your own
              straight away.
            </Text>
            <PillButton
              title="Go to Sign In"
              icon="arrow-right"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        ) : (
          <>
            <Banner variant="error" message={error} />
            <PillButton
              title="Send Reset Code"
              icon="mail"
              onPress={handleSubmit}
              loading={loading}
            />
          </>
        )}

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.footerBtn}>
          <Text style={styles.footerNote}>
            Remembered it? <Text style={styles.footerLink}>Back to Sign In</Text>
          </Text>
        </Pressable>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  firstTimeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
  },
  firstTimeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
    marginBottom: 6,
  },
  firstTimeBody: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.gold,
  },
  footerBtn: {
    paddingVertical: 8,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.muted,
  },
  footerLink: {
    color: colors.primaryBright,
    fontWeight: '800',
  },
});
