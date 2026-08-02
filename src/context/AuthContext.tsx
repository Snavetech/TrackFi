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

  useEffect(() => {
    if (user) {
      localStorage.setItem('intellibudget_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('intellibudget_user');
    }
  }, [user]);

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
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        if (data.user) {
          // Fetch profile
          const { data: profData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          setUser(profData || { ...INITIAL_PROFILE, id: data.user.id, full_name: data.user.email?.split('@')[0] || 'User' });
        }
      } else {
        // Local Demo Login
        setUser({
          ...INITIAL_PROFILE,
          full_name: email.split('@')[0] || 'Ismail Alabi',
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
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
            data: { full_name: fullName, preferred_currency: currency }
          }
        });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            full_name: fullName,
            preferred_currency: currency,
            low_balance_threshold: 10000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        // Local Signup
        setUser({
          id: `usr_${Date.now()}`,
          full_name: fullName,
          preferred_currency: currency,
          low_balance_threshold: 20000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
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
