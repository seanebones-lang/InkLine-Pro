import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { GenerateScreen } from '../screens/GenerateScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HomeIcon, GenerateIcon, HistoryIcon, ProfileIcon } from '../components/icons/TabIcons';
import { AnimatedTabBar } from '../components/AnimatedTabBar';

const Tab = createBottomTabNavigator<RootTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBar focused={focused}>
              <HomeIcon color={color} size={24} />
            </AnimatedTabBar>
          ),
        }}
      />
      <Tab.Screen
        name="Generate"
        component={GenerateScreen}
        options={{
          title: 'Generate',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBar focused={focused}>
              <GenerateIcon color={color} size={24} />
            </AnimatedTabBar>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBar focused={focused}>
              <HistoryIcon color={color} size={24} />
            </AnimatedTabBar>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBar focused={focused}>
              <ProfileIcon color={color} size={24} />
            </AnimatedTabBar>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
