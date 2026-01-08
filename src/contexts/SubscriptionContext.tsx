import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  getCustomerInfo,
  purchasePackage,
  restorePurchases,
  checkSubscriptionStatus,
} from '../config/revenuecat';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  refreshSubscription: () => Promise<void>;
  purchaseSubscription: (pkg: PurchasesPackage) => Promise<boolean>;
  restoreSubscription: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshSubscription = async () => {
    if (!user) {
      setIsSubscribed(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [offeringsData, customerInfoData] = await Promise.all([
        getOfferings(),
        getCustomerInfo(),
      ]);

      setOfferings(offeringsData);
      setCustomerInfo(customerInfoData);
      setIsSubscribed(checkSubscriptionStatus(customerInfoData));
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      setIsSubscribed(false);
      setIsLoading(false);
    }
  }, [user]);

  const purchaseSubscription = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const newCustomerInfo = await purchasePackage(pkg);
      if (newCustomerInfo) {
        setCustomerInfo(newCustomerInfo);
        setIsSubscribed(checkSubscriptionStatus(newCustomerInfo));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      return false;
    }
  };

  const restoreSubscription = async (): Promise<boolean> => {
    try {
      const restoredCustomerInfo = await restorePurchases();
      if (restoredCustomerInfo) {
        setCustomerInfo(restoredCustomerInfo);
        const hasActiveSubscription = checkSubscriptionStatus(restoredCustomerInfo);
        setIsSubscribed(hasActiveSubscription);
        return hasActiveSubscription;
      }
      return false;
    } catch (error) {
      console.error('Error restoring subscription:', error);
      return false;
    }
  };

  const value: SubscriptionContextType = {
    isSubscribed,
    isLoading,
    offerings,
    customerInfo,
    refreshSubscription,
    purchaseSubscription,
    restoreSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
