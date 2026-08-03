import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InstitutionSelectorScreen from '../screens/auth/InstitutionSelectorScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';

const Stack = createNativeStackNavigator();

// Full-screen auth flow, outside the tab bar — FR-AUTH-01 through FR-AUTH-04.
// Headers are hidden: each screen carries its own branded header so there's
// no redundant native title bar on top of it.
export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="InstitutionSelector" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InstitutionSelector" component={InstitutionSelectorScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
    </Stack.Navigator>
  );
}
