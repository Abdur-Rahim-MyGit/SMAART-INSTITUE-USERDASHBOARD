import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import WelcomeOnboardingScreen from '../screens/auth/WelcomeOnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import SignupOtpScreen from '../screens/auth/SignupOtpScreen';
import CreatePasswordScreen from '../screens/auth/CreatePasswordScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import LegalScreen from '../screens/legal/LegalScreen';

const Stack = createNativeStackNavigator();

/**
 * AuthStack — every pre-session route.
 *
 * Entry sequence:
 *  1. Splash — Animated professional white splash
 *  2. WelcomeOnboarding — "Let's get you signed in!"
 *  3. Login — Email & Password (no college selection; the account carries it)
 *  4. OtpVerify — OTP Verification (FR-AUTH-04)
 *
 * Branches off that spine:
 *  • Signup → SignupOtp → CreatePassword  (FR-AUTH-02, from Login)
 *  • ForgotPassword → ResetPassword       (FR-AUTH-06, from Login)
 *  • ChangePassword                       (FR-AUTH-05, from OtpVerify when the
 *    server answers `requirePasswordChange` — not reachable directly, since it
 *    needs the password-change tempToken the OTP step returns)
 */
export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="WelcomeOnboarding" component={WelcomeOnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />

      {/* FR-AUTH-02 — self-service signup */}
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="SignupOtp" component={SignupOtpScreen} />
      <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />

      {/* FR-AUTH-06 — forgot / reset password */}
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {/* Store requirement: a privacy policy must be reachable without an
          account, so both documents live in the auth stack as well as the app
          stack. */}
      <Stack.Screen name="PrivacyPolicy" component={LegalScreen} initialParams={{ doc: 'privacy' }} />
      <Stack.Screen name="Terms" component={LegalScreen} initialParams={{ doc: 'terms' }} />

      {/* FR-AUTH-05 — forced first-login password change */}
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
