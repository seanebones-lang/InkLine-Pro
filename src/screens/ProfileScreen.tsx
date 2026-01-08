import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Paywall } from '../components/Paywall';

const ProfileContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isSubscribed, customerInfo, refreshSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handlePaywallSuccess = () => {
    refreshSubscription();
    setShowPaywall(false);
  };

  return (
    <>
      <ScrollView className="flex-1 bg-white">
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Profile</Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>

          <View className="mb-6 p-4 bg-gray-50 rounded-xl">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Subscription Status
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className={`font-semibold ${isSubscribed ? 'text-green-600' : 'text-gray-600'}`}>
                {isSubscribed ? 'Active' : 'Not Subscribed'}
              </Text>
              {!isSubscribed && (
                <TouchableOpacity
                  onPress={() => setShowPaywall(true)}
                  className="px-4 py-2 bg-blue-600 rounded-lg"
                >
                  <Text className="text-white font-semibold">Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isSubscribed && customerInfo && (
            <View className="mb-6 p-4 bg-gray-50 rounded-xl">
              <Text className="text-sm text-gray-600 mb-1">Active Entitlements</Text>
              {Object.keys(customerInfo.entitlements.active).map((entitlement) => (
                <Text key={entitlement} className="text-base font-semibold text-gray-900">
                  {entitlement}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={handleSignOut}
            className="mt-8 py-4 bg-red-600 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-lg">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaywall(false)}
      >
        <Paywall
          onDismiss={() => setShowPaywall(false)}
          onSuccess={handlePaywallSuccess}
        />
      </Modal>
    </>
  );
};

export const ProfileScreen: React.FC = () => {
  return (
    <ProtectedRoute requireSubscription={false}>
      <ProfileContent />
    </ProtectedRoute>
  );
};
