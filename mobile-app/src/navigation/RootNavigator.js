import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import BiometricUnlockScreen from '../screens/auth/BiometricUnlockScreen';
import ProfileCompletionScreen from '../screens/onboarding/ProfileCompletionScreen';
import { colors } from '../theme';

/**
 * Gate order is deliberate and should not be reshuffled:
 *
 *   no session      → AuthStack
 *   session, locked → BiometricUnlock   (FR-AUTH-09 — must clear before anything
 *                                        reads the session, including onboarding)
 *   not registered  → ProfileCompletion (FR-AUTH-12 — no tabs until it's done)
 *   otherwise       → AppStack
 *
 * The unlock and onboarding screens render OUTSIDE NavigationContainer: neither
 * uses navigation, and keeping them out of a navigator means there is no back
 * gesture or history entry that could slip past the gate.
 */
export default function RootNavigator() {
  const { user, isBootstrapping, isLocked, needsProfileCompletion } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  if (user && isLocked) {
    return <BiometricUnlockScreen />;
  }

  if (user && needsProfileCompletion) {
    return <ProfileCompletionScreen />;
  }

  return <NavigationContainer>{user ? <AppStack /> : <AuthStack />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
