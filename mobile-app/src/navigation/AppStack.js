import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import { colors } from '../theme';

// Lazy-loaded so the onnxruntime/face-pipeline native module is only touched
// once this screen is actually opened, not at app startup.
const FaceVerificationTestScreen = React.lazy(() =>
  import('../screens/proctoring/FaceVerificationTestScreen')
);

function LazyFaceVerificationTestScreen(props) {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.navy} />
        </View>
      }
    >
      <FaceVerificationTestScreen {...props} />
    </Suspense>
  );
}

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
        component={LazyFaceVerificationTestScreen}
        options={{ title: 'Face Verification Test' }}
      />
    </Stack.Navigator>
  );
}
