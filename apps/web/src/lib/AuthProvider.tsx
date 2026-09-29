'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { profileQueries, type Profile, type VehicleType } from '@ondigo/shared';
import { getSupabaseClient } from './supabaseClient';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to true when the account still has to be confirmed from the email link. */
  signUp: (email: string, password: string, fullName: string, vehicleType?: VehicleType) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const client = getSupabaseClient();

  const loadProfile = async (userId: string) => {
    try {
      setProfile(await profileQueries.getProfile(client, userId));
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, vehicleType?: VehicleType) => {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, vehicle_type: vehicleType },
        // the confirmation link returns to whichever site the person signed up on,
        // rather than to the project's single Site URL
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    return !data.session;
  };

  const signOut = async () => {
    await client.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
