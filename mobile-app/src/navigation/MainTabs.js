import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import AssessmentsScreen from '../screens/assessments/AssessmentsScreen';
import LearningScreen from '../screens/learning/LearningScreen';
import CareerScreen from '../screens/career/CareerScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

// Matches the IA in the requirements doc, Section 10: Home / Assessments /
// Learning / Career / Community / Profile.
const TAB_ICONS = {
  Home: '🏠',
  Assessments: '📝',
  Learning: '📚',
  Career: '💼',
  Community: '👥',
  Profile: '👤',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Assessments" component={AssessmentsScreen} />
      <Tab.Screen name="Learning" component={LearningScreen} />
      <Tab.Screen name="Career" component={CareerScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
