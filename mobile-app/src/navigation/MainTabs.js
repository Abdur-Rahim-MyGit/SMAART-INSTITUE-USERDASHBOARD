/**
 * MainTabs — Floating Premium Bottom Tab Navigator.
 *
 * Implements a modern floating capsule navigation bar (without Assessments tab as requested),
 * supporting both light (white) and dark (black) modes with fixed capsule sizes to avoid icon squishing.
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import LearningScreen from '../screens/learning/LearningScreen';
import CareerScreen from '../screens/career/CareerScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home',
  Learning: 'book-open',
  Career: 'briefcase',
  Community: 'users',
  Profile: 'user',
};

// Premium tab icon with fixed indicator bounds to prevent icon squishing
function TabIcon({ name, focused, themeColors }) {
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.pillIndicator,
          focused && { backgroundColor: themeColors.theme === 'dark' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(37, 99, 235, 0.08)' },
        ]}
      >
        <Feather
          name={name}
          size={19}
          color={focused ? themeColors.primaryBright : themeColors.textMuted}
        />
      </View>
    </View>
  );
}

export default function MainTabs() {
  const { colors: themeColors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: themeColors.primaryBright,
          tabBarInactiveTintColor: themeColors.textMuted,
          tabBarLabelStyle: {
            fontSize: 9.5,
            fontWeight: '800',
            letterSpacing: 0.1,
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
          },
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: themeColors.theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: themeColors.border,
              shadowColor: themeColors.theme === 'dark' ? '#000000' : '#0F1E42',
            },
          ],
          tabBarIcon: ({ focused }) => (
            <TabIcon name={TAB_ICONS[route.name]} focused={focused} themeColors={themeColors} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Learning" component={LearningScreen} />
        <Tab.Screen name="Career" component={CareerScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 14,
    right: 14,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  pillIndicator: {
    width: 48,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
