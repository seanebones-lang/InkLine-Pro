import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { AuthScreen } from './AuthScreen';
import { Paywall } from './Paywall';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSubscription = false,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();

  // Show loading state
  if (authLoading || subscriptionLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  // Show paywall if subscription required but not subscribed
  if (requireSubscription && !isSubscribed) {
    return <Paywall />;
  }

  // Render protected content
  return <>{children}</>;
};
