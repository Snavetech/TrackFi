import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, SUPPORTED_CURRENCIES } from '../types';
import { INITIAL_PROFILE } from '../lib/demoData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currencySymbol: string;
  currencyCode: string;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginDemo: () => void;
  signUp: (email: string, pass: string, fullName: string, currency?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('intellibudget_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper to fetch or create user profile
  const fetchProfile = async (id: string, email?: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: profData } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (profData) {
        setUser(profData);
      } else {
        const newProf: Profile = {
          id,
          full_name: email ? email.split('@')[0] : 'User',
          preferred_currency: 'NGN',
          low_balance_threshold: 10000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(newProf);
      }
    } catch {
      setUser({
        id,
        full_name: email ? email.split('@')[0] : 'User',
        preferred_currency: 'NGN',
        low_balance_threshold: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  // Sync state to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('intellibudget_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('intellibudget_user');
    }
  }, [user]);

  // Listen to Supabase Auth state changes & email confirmation redirects
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Derive Currency symbol
  const activeCurrencyConfig = SUPPORTED_CURRENCIES.find(
    c => c.code === (user?.preferred_currency || 'NGN')
  ) || SUPPORTED_CURRENCIES[0];

  const currencySymbol = activeCurrencyConfig.symbol;
  const currencyCode = activeCurrencyConfig.code;

  const loginDemo = () => {
    setUser(INITIAL_PROFILE);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Check if demo credentials
    if (cleanEmail === 'demo@trackfi.app' || cleanEmail === 'ismail@example.com' || cleanEmail.includes('demo')) {
      setUser({
        ...INITIAL_PROFILE,
        full_name: 'Ismail Alabi',
      });
      setIsLoading(false);
      return { success: true };
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email address via the link sent to your inbox before logging in.');
          }
          throw error;
        }
        if (data.user) {
          await fetchProfile(data.user.id, data.user.email);
        }
      } else {
        // Local fallback login for non-Supabase mode
        setUser({
          id: `usr_${Date.now()}`,
          full_name: cleanEmail.split('@')[0] || 'User',
          preferred_currency: 'NGN',
          low_balance_threshold: 10000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email or password' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, currency: string = 'NGN') => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { full_name: fullName, preferred_currency: currency },
            emailRedirectTo: 'https://trackfi-sigma.vercel.app/'
          }
        });
        if (error) throw error;
      }
      // Do NOT auto-login. Require user to confirm email and log in via Login screen
      return { success: true, requiresEmailConfirmation: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    setUser(updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').update(updates).eq('id', user.id);
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
    }
    return { success: true, message: 'Password reset link sent to your email.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        currencySymbol,
        currencyCode,
        login,
        loginDemo,
        signUp,
        logout,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
