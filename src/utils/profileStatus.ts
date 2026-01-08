import { User } from '@supabase/supabase-js';
import { CustomerInfo } from 'react-native-purchases';
import { supabase } from '../config/supabase';
import { logger } from './logger';

export interface ProfileStatus {
  isAuthenticated: boolean;
  isSubscribed: boolean;
  user: User | null;
  customerInfo: CustomerInfo | null;
  profileData: {
    display_name?: string;
    avatar_url?: string;
    subscription_tier?: string;
    created_at?: string;
    updated_at?: string;
  } | null;
}

export const getProfileStatus = async (
  user: User | null,
  customerInfo: CustomerInfo | null
): Promise<ProfileStatus> => {
  if (!user) {
    return {
      isAuthenticated: false,
      isSubscribed: false,
      user: null,
      customerInfo: null,
      profileData: null,
    };
  }

  // Check subscription status
  const isSubscribed = customerInfo ? Object.keys(customerInfo.entitlements.active).length > 0 : false;

  // Fetch profile data from Supabase
  let profileData = null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      profileData = data;
    } else {
      // Create profile if it doesn't exist
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newProfile) {
        profileData = newProfile;
      }
    }
  } catch (error) {
    logger.error('Error fetching profile:', error);
  }

  // Determine subscription tier from RevenueCat
  let subscriptionTier = 'free';
  if (customerInfo && isSubscribed) {
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    if (activeEntitlements.includes('premium')) {
      subscriptionTier = 'premium';
    } else if (activeEntitlements.includes('pro')) {
      subscriptionTier = 'pro';
    } else if (activeEntitlements.length > 0) {
      subscriptionTier = 'premium'; // Default to premium if any entitlement exists
    }
  }

  return {
    isAuthenticated: true,
    isSubscribed,
    user,
    customerInfo,
    profileData: profileData
      ? {
          ...profileData,
          subscription_tier: subscriptionTier,
        }
      : null,
  };
};

export const updateProfileStatus = async (
  userId: string,
  updates: {
    display_name?: string;
    avatar_url?: string;
    subscription_tier?: string;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    logger.error('Error updating profile:', error);
    throw error;
  }
};
