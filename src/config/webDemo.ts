/**
 * Web Demo Configuration
 * Mocks native features and provides placeholder data for web preview
 */

import { Platform } from 'react-native';

export const IS_WEB_DEMO = Platform.OS === 'web' && (process.env.EXPO_PUBLIC_WEB_DEMO === 'true' || process.env.NODE_ENV === 'development');

// Placeholder user data
export const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@inklinepro.com',
  display_name: 'Demo User',
};

// Placeholder subscription status
export const DEMO_SUBSCRIPTION = {
  active: true,
  tier: 'pro',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

// Mock session
export const DEMO_SESSION = {
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_at: Date.now() + 3600000,
  user: DEMO_USER,
};
