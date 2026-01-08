/**
 * Web Demo Auth Context
 * Uses mock authentication for web preview
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { DEMO_SESSION, DEMO_USER, IS_WEB_DEMO } from '../config/webDemo';
import { mockAuth } from '../services/mockServices';
import { logger } from '../utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(IS_WEB_DEMO ? DEMO_SESSION as any : null);
  const [user, setUser] = useState<User | null>(IS_WEB_DEMO ? DEMO_USER as any : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (IS_WEB_DEMO) {
      // Auto-login for web demo
      setSession(DEMO_SESSION as any);
      setUser(DEMO_USER as any);
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (IS_WEB_DEMO) {
      const result = await mockAuth.signUp(email, password);
      setSession(result.data.session as any);
      setUser(result.data.user as any);
      return { error: null };
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_WEB_DEMO) {
      const result = await mockAuth.signIn(email, password);
      setSession(result.data.session as any);
      setUser(result.data.user as any);
      return { error: null };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (IS_WEB_DEMO) {
      setSession(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (updates: { display_name?: string; avatar_url?: string }) => {
    if (IS_WEB_DEMO && user) {
      // Mock update - just log it
      logger.info('Profile update (demo):', updates);
    }
  }, [user]);

  const value: AuthContextType = useMemo(
    () => ({
      session,
      user,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }),
    [session, user, loading, signUp, signIn, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
