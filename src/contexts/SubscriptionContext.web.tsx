import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { IS_WEB_DEMO } from '../config/webDemo';
import { mockSubscription } from '../services/mockServices';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

// Web-compatible type definitions (simplified)
type PurchasesOffering = any;
type CustomerInfo = any;
type PurchasesPackage = any;

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
  const [isSubscribed, setIsSubscribed] = useState(true); // Always subscribed in web demo
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setIsSubscribed(true); // Still show as subscribed in demo
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [offeringsData, customerInfoData] = await Promise.all([
        mockSubscription.getOfferings(),
        mockSubscription.getCustomerInfo(),
      ]);

      setOfferings(offeringsData);
      setCustomerInfo(customerInfoData);
      setIsSubscribed(true);
    } catch (error) {
      logger.error('Error refreshing subscription:', error);
      setIsSubscribed(true); // Still show as subscribed in demo
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      setIsSubscribed(true); // Still show as subscribed in demo
      setIsLoading(false);
    }
  }, [user, refreshSubscription]);

  const purchaseSubscription = useCallback(async (_pkg: PurchasesPackage): Promise<boolean> => {
    // Mock successful purchase in web demo
    return true;
  }, []);

  const restoreSubscription = useCallback(async (): Promise<boolean> => {
    // Mock successful restore in web demo
    return true;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: SubscriptionContextType = useMemo(
    () => ({
      isSubscribed,
      isLoading,
      offerings,
      customerInfo,
      refreshSubscription,
      purchaseSubscription,
      restoreSubscription,
    }),
    [isSubscribed, isLoading, offerings, customerInfo, refreshSubscription, purchaseSubscription, restoreSubscription]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
