import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import FaceVerificationTestScreen from '../screens/proctoring/FaceVerificationTestScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

// Wraps the tab bar so full-screen flows (like the face-verification test
// harness) can be pushed on top of it without living inside a tab themselves.
export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="FaceVerificationTest"
        component={FaceVerificationTestScreen}
        options={{ title: 'Face Verification Test' }}
      />
    </Stack.Navigator>
  );
}
