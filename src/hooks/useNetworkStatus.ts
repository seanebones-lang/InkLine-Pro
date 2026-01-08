import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// Note: For full network detection, install @react-native-community/netinfo
// For now, using a simpler fetch-based approach
let NetInfo: any = null;
try {
  if (Platform.OS !== 'web') {
    NetInfo = require('@react-native-community/netinfo').default;
  }
} catch (error) {
  logger.warn('NetInfo not available, using fallback network detection');
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  details: unknown;
}

/**
 * Hook to monitor network connectivity status
 * Provides real-time network state updates
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkState, setNetworkState] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    details: null,
  });

  useEffect(() => {
    // If NetInfo is available, use it
    if (NetInfo) {
      // Get initial network state
      NetInfo.fetch().then((state: any) => {
        setNetworkState({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
          details: state.details,
        });
      });

      // Subscribe to network state updates
      const unsubscribe = NetInfo.addEventListener((state: any) => {
        const newState = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
          details: state.details,
        };

        setNetworkState((prev) => {
          // Log network status changes
          if (newState.isConnected !== prev.isConnected) {
            logger.info('Network status changed:', {
              isConnected: newState.isConnected,
              type: newState.type,
            });
          }
          return newState;
        });
      });

      return () => {
        unsubscribe();
      };
    } else {
      // Fallback: Use fetch to detect network status
      let mounted = true;

      const checkNetwork = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-store',
          });

          clearTimeout(timeoutId);

          if (mounted) {
            setNetworkState({
              isConnected: true,
              isInternetReachable: true,
              type: 'unknown',
              details: null,
            });
          }
        } catch (error) {
          if (mounted) {
            setNetworkState({
              isConnected: false,
              isInternetReachable: false,
              type: 'none',
              details: null,
            });
          }
        }
      };

      // Check initially
      checkNetwork();

      // Check periodically (every 10 seconds)
      const intervalId = setInterval(checkNetwork, 10000);

      return () => {
        mounted = false;
        clearInterval(intervalId);
      };
    }
  }, []); // Only run on mount/unmount

  return networkState;
}
