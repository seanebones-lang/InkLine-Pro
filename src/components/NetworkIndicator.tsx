import React from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Network status indicator component
 * Shows offline/online status at the top of the screen
 */
export const NetworkIndicator: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const { colors } = useTheme();
  const [opacity] = React.useState(new Animated.Value(0));

  // Only show indicator when offline or internet is not reachable
  const isOffline = !isConnected || isInternetReachable === false;

  React.useEffect(() => {
    if (isOffline) {
      // Fade in when going offline
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out when coming online
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.error,
          opacity,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="No internet connection"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: '#FFFFFF' }]}>
        🔴 No Internet Connection
      </Text>
      <Text style={[styles.subtext, { color: '#FFFFFF' }]}>
        Some features may be unavailable
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
});
