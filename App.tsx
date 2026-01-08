import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NetworkIndicator } from './src/components/NetworkIndicator';
import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import { startHealthChecks, stopHealthChecks } from './src/utils/healthCheck';
import { logger } from './src/utils/logger';
import { initSentry } from './src/config/sentry';
import { startMonitoring, stopMonitoring } from './src/utils/monitoring';

export default function App() {
  useEffect(() => {
    // Initialize Sentry for error tracking
    initSentry(process.env.EXPO_PUBLIC_SENTRY_DSN);
    
    // Start health checks on app launch
    startHealthChecks(60000); // Check every minute
    
    // Start performance monitoring
    startMonitoring(300000); // Check every 5 minutes

    // Cleanup on unmount
    return () => {
      stopHealthChecks();
      stopMonitoring();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <View style={{ flex: 1 }}>
              <NavigationContainer>
                <StatusBar style="auto" />
                <NetworkIndicator />
                <TabNavigator />
              </NavigationContainer>
            </View>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
