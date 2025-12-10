import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signInWithGoogle, signOut, onAuthStateChange } from '../services/supabase';
import type { UserProfile, UserSettings } from '../types';
import { authApi, settingsApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  settings: UserSettings;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  workDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  darkMode: false
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        loadUserData();
      } else {
        setProfile(null);
        setSettings(defaultSettings);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserData = async () => {
    try {
      const [profileData, settingsData] = await Promise.all([
        authApi.syncUser().catch(() => null),
        settingsApi.get().catch(() => defaultSettings)
      ]);

      if (profileData) setProfile(profileData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signIn = async () => {
    await signInWithGoogle();
  };

  const logOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setSettings(defaultSettings);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updated = await settingsApi.update(newSettings);
      setSettings(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      settings,
      loading,
      signIn,
      logOut,
      updateSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
