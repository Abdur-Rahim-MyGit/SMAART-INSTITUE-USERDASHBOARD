import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InstitutionSelectorScreen from '../screens/auth/InstitutionSelectorScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

// Full-screen auth flow, outside the tab bar — FR-AUTH-01 through FR-AUTH-04.
export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="InstitutionSelector"
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="InstitutionSelector" component={InstitutionSelectorScreen} options={{ title: 'Institution' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ title: 'Verify OTP' }} />
    </Stack.Navigator>
  );
}
