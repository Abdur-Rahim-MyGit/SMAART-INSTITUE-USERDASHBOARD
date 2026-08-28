/**
 * FR-AUTH-02 (step 3 of 3) — Set a password and create the account.
 *
 * `/auth/register` returns a real JWT, so the student lands straight in the app
 * rather than being bounced back to sign in. They arrive with
 * `isRegistered: false`, which RootNavigator reads as "needs onboarding" and
 * routes to ProfileCompletionScreen (FR-AUTH-12).
 *
 * Mobile number is optional here because the backend treats it as optional on
 * this endpoint — but onboarding requires it, so we ask now while we have the
 * student's attention.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import PasswordRules from '../../components/PasswordRules';
import Banner from '../../components/Banner';
import { FadeSlideIn } from '../../components/Motion';
import { register } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { formatServerPasswordError, validatePassword } from '../../utils/password';
import { colors } from '../../theme';

export default function CreatePasswordScreen({ route, navigation }) {
  const { email, fullName } = route.params;
  const { signIn, college } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const policy = useMemo(() => validatePassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = policy.isValid && confirm === password && !loading;

  const handleCreate = async () => {
    if (!policy.isValid) {
      setError('Your password does not meet all the requirements below.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    // The backend validates a 10-digit mobile only when one is supplied.
    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      setError('Mobile number must be exactly 10 digits, or leave it blank.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await register({
        fullName,
        email,
        mobileNumber: mobile || undefined,
        password,
        institution: college?.collegeName,
      });

      if (res?.token && res?.user) {
        // Fresh self-registered account — isRegistered is false, so the root
        // navigator will send them into onboarding next.
        await signIn(res.token, { ...res.user, isRegistered: false });
      } else {
        setError('Account created, but sign-in failed. Please log in manually.');
        navigation.navigate('Login');
      }
    } catch (err) {
      setError(formatServerPasswordError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Set your password"
      subtitle={`Almost there, ${String(fullName).split(' ')[0]} — choose a password for ${email}`}
      onBack={() => navigation.goBack()}
    >
      <FadeSlideIn duration={400}>
      <PillInput
        label="Password"
        icon="lock"
        placeholder="••••••••••"
        secure
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        returnKeyType="next"
      />

      <PasswordRules password={password} />

      <PillInput
        label="Confirm Password"
        icon="lock"
        placeholder="••••••••••"
        secure
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="none"
        error={mismatch ? 'Passwords do not match' : undefined}
        returnKeyType="next"
      />

      <PillInput
        label="Mobile Number (optional)"
        icon="phone"
        placeholder="10-digit number"
        keyboardType="number-pad"
        maxLength={10}
        value={mobile}
        onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
        returnKeyType="done"
        onSubmitEditing={handleCreate}
      />

      <Banner variant="error" message={error} />

      <PillButton
        title="Create Account"
        icon="check"
        onPress={handleCreate}
        loading={loading}
        disabled={!canSubmit}
      />

      <Text style={styles.legal}>
        By creating an account you agree to your institution's acceptable-use policy.
      </Text>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  legal: {
    textAlign: 'center',
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.mutedLight,
    marginTop: 4,
    paddingHorizontal: 10,
  },
});
