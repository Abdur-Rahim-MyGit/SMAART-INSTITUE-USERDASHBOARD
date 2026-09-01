import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Module-level navigation ref so non-component code (push notification tap
 * handlers, etc.) can navigate. Attached to the NavigationContainer in
 * RootNavigator.
 */
export const navigationRef = createNavigationContainerRef();

/** Navigate if the container is mounted and ready; silently no-op otherwise. */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
