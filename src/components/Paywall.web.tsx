import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { logger } from '../utils/logger';

// Web-compatible type
type PurchasesPackage = any;

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
      logger.error('Purchase error:', error);
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
      logger.error('Restore error:', error);
    } finally {
      setRestoring(false);
    }
  };

  const formatPrice = (packageData: PurchasesPackage): string => {
    const product = packageData.product;
    return product?.priceString || '$9.99';
  };

  const getPackageTitle = (packageData: PurchasesPackage): string => {
    const identifier = packageData.identifier || '';
    if (identifier.includes('annual')) return 'Annual';
    if (identifier.includes('monthly')) return 'Monthly';
    if (identifier.includes('weekly')) return 'Weekly';
    return 'Premium';
  };

  if (isLoading || packages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>Get unlimited access to all features</Text>
        </Animated.View>

        {packages.map((pkg: any, index: number) => (
          <Animated.View
            key={pkg.identifier}
            entering={FadeInDown.delay(index * 100).duration(400)}
          >
            <TouchableOpacity
              onPress={() => handlePurchase(pkg)}
              disabled={purchasing}
              style={[
                styles.packageButton,
                pkg.packageType === 'ANNUAL' && styles.packageButtonAnnual
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Purchase ${getPackageTitle(pkg)} subscription for ${formatPrice(pkg)}`}
              accessibilityHint={`Purchases the ${getPackageTitle(pkg)} subscription package`}
              accessibilityState={{ disabled: purchasing }}
            >
              <View style={styles.packageContent}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle}>
                    {getPackageTitle(pkg)}
                  </Text>
                  <Text style={styles.packageDescription}>
                    {pkg.product?.description || 'Premium subscription'}
                  </Text>
                </View>
                <View style={styles.packagePricing}>
                  <Text style={styles.packagePrice}>
                    {formatPrice(pkg)}
                  </Text>
                  {pkg.packageType === 'ANNUAL' && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>Best Value</Text>
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
            style={styles.restoreButton}
            accessibilityRole="button"
            accessibilityLabel="Restore previous purchases"
            accessibilityHint="Restores any previous subscription purchases from your account"
            accessibilityState={{ disabled: restoring }}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {onDismiss && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onDismiss}
            disabled={purchasing}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Close paywall"
            accessibilityHint="Closes the subscription paywall"
            accessibilityState={{ disabled: purchasing }}
          >
            <Text style={styles.dismissText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  packageButton: {
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  packageButtonAnnual: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  packagePricing: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bestValueBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bestValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  restoreButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  restoreText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    color: '#6B7280',
    fontWeight: '600',
  },
});
