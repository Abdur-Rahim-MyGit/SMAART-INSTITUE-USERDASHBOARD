import { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { setupNotificationHandler } from './src/utils/pushNotifications';

// Keep the native splash (navy bg + logo, configured in app.json) up until the
// JS side has painted its own first frame — RootNavigator's bootstrap view is
// the same navy bg + logo, so the handoff is invisible instead of flashing
// to a blank/white screen while SecureStore is checked.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function App() {
  const onLayoutRootView = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Must run AFTER native bridge is ready — cannot be at module top-level.
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
            <StatusBar hidden={true} />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
