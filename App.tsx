import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { TabNavigator } from './src/navigation/TabNavigator';

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <TabNavigator />
        </NavigationContainer>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
