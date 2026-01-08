import Purchases, { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';

let isConfigured = false;

export const initializeRevenueCat = async (userId?: string): Promise<void> => {
  if (isConfigured) return;

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  
  if (!apiKey) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  await Purchases.configure({ apiKey });
  
  if (userId) {
    await Purchases.logIn(userId);
  }

  isConfigured = true;
};

export const setRevenueCatUserId = async (userId: string): Promise<void> => {
  await Purchases.logIn(userId);
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Error fetching customer info:', error);
    return null;
  }
};

export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error) {
    console.error('Error purchasing package:', error);
    return null;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return null;
  }
};

export const checkSubscriptionStatus = (customerInfo: CustomerInfo | null): boolean => {
  if (!customerInfo) return false;
  
  const entitlements = customerInfo.entitlements.active;
  return Object.keys(entitlements).length > 0;
};

export const logoutRevenueCat = async (): Promise<void> => {
  await Purchases.logOut();
};
