import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { handleInitialNotificationResponse } from '../utils/pushNotifications';
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
    // Same navy background + logo as the native splash (app.json's
    // expo-splash-screen config) and AuthStack's SplashScreen — kept static
    // and un-animated here so hiding the native splash never flashes to an
    // unbranded screen while the session check is still in flight.
    return (
      <View style={styles.loading}>
        <Image
          source={require('../../assets/smaart-logo.png')}
          style={styles.loadingLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (user && isLocked) {
    return <BiometricUnlockScreen />;
  }

  if (user && needsProfileCompletion) {
    return <ProfileCompletionScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // If a push notification tap launched the app from a killed state,
        // route to the Notifications screen once navigation can handle it.
        // Only meaningful with a session — AuthStack has no such screen.
        if (user) handleInitialNotificationResponse();
      }}
    >
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navyDarkest },
  loadingLogo: { width: 260, height: 88 },
});
