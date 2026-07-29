import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>{user?.fullName || 'Profile'}</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
      <AppButton title="Log Out" variant="secondary" onPress={handleLogout} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
});
