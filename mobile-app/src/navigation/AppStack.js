import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SupportScreen from '../screens/support/SupportScreen';
import AssessmentsScreen from '../screens/assessments/AssessmentsScreen';
import AssessmentPlayerScreen from '../screens/assessments/AssessmentPlayerScreen';
import CertificatesScreen from '../screens/learning/CertificatesScreen';
import NotesScreen from '../screens/learning/NotesScreen';
import LibraryScreen from '../screens/learning/LibraryScreen';
import CareerCoachChatScreen from '../screens/career/CareerCoachChatScreen';
import SkillsVaultScreen from '../screens/career/SkillsVaultScreen';
import PerformanceScreen from '../screens/performance/PerformanceScreen';
import VisionBoardScreen from '../screens/community/VisionBoardScreen';
import VisionBoardDetailScreen from '../screens/community/VisionBoardDetailScreen';
import VisionBoardCreateScreen from '../screens/community/VisionBoardCreateScreen';
import CareerDirectionsScreen from '../screens/career/CareerDirectionsScreen';
import ToolkitScreen from '../screens/career/ToolkitScreen';
import CgpaCalculatorScreen from '../screens/learning/CgpaCalculatorScreen';
import DictionaryScreen from '../screens/career/DictionaryScreen';
import SideDrawer from '../components/SideDrawer';
import { DrawerProvider, useDrawer } from '../context/DrawerContext';
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

// Inner navigator — wrapped in DrawerProvider context.
// The SideDrawer is rendered here (above the stack) so it overlays the
// tab bar and ALL screens — this is the correct level for a global side drawer.
// SideDrawer uses useNavigation() internally to navigate without needing a prop.
function AppNavigator() {
  const { isDrawerOpen, closeDrawer } = useDrawer();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Assessments" component={AssessmentsScreen} options={{ headerShown: false }} />
        {/* The player owns its own chrome (timer, progress, exit guard) and must
            not be dismissable by a stack back button mid-attempt. */}
        <Stack.Screen
          name="AssessmentPlayer"
          component={AssessmentPlayerScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />

        {/* Learning-tab satellites — each owns its own header. */}
        <Stack.Screen name="Certificates" component={CertificatesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Notes" component={NotesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Library" component={LibraryScreen} options={{ headerShown: false }} />

        {/* Career-tab satellites */}
        <Stack.Screen name="CareerCoachChat" component={CareerCoachChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SkillsVault" component={SkillsVaultScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CareerDirections" component={CareerDirectionsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Toolkit" component={ToolkitScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dictionary" component={DictionaryScreen} options={{ headerShown: false }} />

        {/* Learning-tab satellites (cont.) */}
        <Stack.Screen name="CgpaCalculator" component={CgpaCalculatorScreen} options={{ headerShown: false }} />

        {/* Standalone analytics screen — reached from the sidebar and Home's shortcut tile */}
        <Stack.Screen name="Performance" component={PerformanceScreen} options={{ headerShown: false }} />

        {/* Community-tab satellites */}
        <Stack.Screen name="VisionBoard" component={VisionBoardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VisionBoardDetail" component={VisionBoardDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VisionBoardCreate" component={VisionBoardCreateScreen} options={{ headerShown: false }} />

        <Stack.Screen
          name="FaceVerificationTest"
          component={LazyFaceVerificationTestScreen}
          options={{ title: 'Face Verification Test' }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: 'Notifications' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Support"
          component={SupportScreen}
          options={{ title: 'Support & Grievances' }}
        />
      </Stack.Navigator>

      {/* SideDrawer sits ABOVE the Stack.Navigator so it covers everything
          including the bottom tab bar. SideDrawer uses useNavigation() hook
          internally — it only renders when visible=true so there's no
          performance cost when the drawer is closed. */}
      <SideDrawer visible={isDrawerOpen} onClose={closeDrawer} />
    </View>
  );
}

export default function AppStack() {
  return (
    <DrawerProvider>
      <AppNavigator />
    </DrawerProvider>
  );
}
