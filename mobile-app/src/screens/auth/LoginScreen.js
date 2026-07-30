import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

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
    <ScreenContainer>
      <Text style={styles.title}>Login</Text>
      {college ? <Text style={styles.subtitle}>{college.collegeName}</Text> : null}

      <AppTextInput
        label="Email or Student ID"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AppTextInput label="Password" secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton title="Log In" onPress={handleLogin} loading={loading} />
      <AppButton
        title="Change Institution"
        variant="secondary"
        onPress={() => navigation.navigate('InstitutionSelector')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
  errorText: { color: colors.danger, marginBottom: 8 },
});
