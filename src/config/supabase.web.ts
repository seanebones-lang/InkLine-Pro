/**
 * Web-specific Supabase configuration
 * Uses localStorage instead of SecureStore for web demo
 */

import { createClient } from '@supabase/supabase-js';
import { IS_WEB_DEMO, DEMO_SESSION, DEMO_USER } from './webDemo';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Web storage adapter using localStorage
const WebStorageAdapter = {
  getItem: async (key: string) => {
    if (IS_WEB_DEMO) {
      // Return demo session for web demo
      if (key.includes('session')) {
        return JSON.stringify(DEMO_SESSION);
      }
    }
    return localStorage.getItem(key) || null;
  },
  setItem: async (key: string, value: string) => {
    if (!IS_WEB_DEMO) {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (!IS_WEB_DEMO) {
      localStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: WebStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Mock supabase methods for web demo
if (IS_WEB_DEMO) {
  // Override auth methods
  const originalGetSession = supabase.auth.getSession;
  supabase.auth.getSession = async () => {
    return {
      data: { session: DEMO_SESSION as any },
      error: null,
    };
  };

  const originalGetUser = supabase.auth.getUser;
  supabase.auth.getUser = async () => {
    return {
      data: { user: DEMO_USER as any },
      error: null,
    };
  };

  const originalSignIn = supabase.auth.signInWithPassword;
  supabase.auth.signInWithPassword = async () => {
    return {
      data: { session: DEMO_SESSION as any, user: DEMO_USER as any },
      error: null,
    };
  };

  const originalSignUp = supabase.auth.signUp;
  supabase.auth.signUp = async () => {
    return {
      data: { session: DEMO_SESSION as any, user: DEMO_USER as any },
      error: null,
    };
  };

  // Mock database queries
  supabase.from = (table: string) => {
    return {
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    } as any;
  };
}
