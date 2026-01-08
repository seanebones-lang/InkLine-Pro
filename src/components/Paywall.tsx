import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useSubscription } from '../contexts/SubscriptionContext';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

interface PaywallProps {
  onDismiss?: () => void;
  onSuccess?: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onDismiss, onSuccess }) => {
  const { offerings, purchaseSubscription, restoreSubscription, isLoading } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const packages = offerings?.availablePackages || [];

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchasing(true);
      const success = await purchaseSubscription(pkg);
      if (success) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const success = await restoreSubscription();
      if (success) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setRestoring(false);
    }
  };

  const formatPrice = (packageData: PurchasesPackage): string => {
    const product = packageData.product;
    return product.priceString || '';
  };

  const getPackageTitle = (packageData: PurchasesPackage): string => {
    const identifier = packageData.identifier;
    if (identifier.includes('annual')) return 'Annual';
    if (identifier.includes('monthly')) return 'Monthly';
    if (identifier.includes('weekly')) return 'Weekly';
    return 'Premium';
  };

  if (isLoading || packages.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600">Loading subscriptions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <Animated.View entering={FadeIn.duration(300)}>
          <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
            Unlock Premium
          </Text>
          <Text className="text-base text-gray-600 text-center mb-8">
            Get unlimited access to all features
          </Text>
        </Animated.View>

        {packages.map((pkg, index) => (
          <Animated.View
            key={pkg.identifier}
            entering={FadeInDown.delay(index * 100).duration(400)}
          >
            <TouchableOpacity
              onPress={() => handlePurchase(pkg)}
              disabled={purchasing}
              className={`mb-4 p-6 rounded-2xl border-2 ${
                pkg.packageType === 'ANNUAL'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {getPackageTitle(pkg)}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {pkg.product.description || 'Premium subscription'}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-gray-900 mb-1">
                    {formatPrice(pkg)}
                  </Text>
                  {pkg.packageType === 'ANNUAL' && (
                    <View className="bg-blue-500 px-2 py-1 rounded">
                      <Text className="text-xs font-semibold text-white">Best Value</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(packages.length * 100)}>
          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring}
            className="mt-4 py-4 items-center"
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text className="text-blue-600 font-semibold">Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {onDismiss && (
        <View className="p-6 border-t border-gray-200">
          <TouchableOpacity
            onPress={onDismiss}
            disabled={purchasing}
            className="py-3 items-center"
          >
            <Text className="text-gray-600 font-semibold">Maybe Later</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
