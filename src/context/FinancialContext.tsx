import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  FinancialPrediction,
  NotificationItem
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_NOTIFICATIONS
} from '../lib/demoData';
import { computeFinancialPrediction } from '../lib/predictionEngine';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { format } from 'date-fns';
import { isCorruptedTransaction } from '../lib/importUtils';

export const isValidUUID = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export const resolveCategoryUUID = (catRef: string | null | undefined, currentCategories: Category[]): string | null => {
  if (!catRef) return null;
  if (isValidUUID(catRef)) return catRef;
  const match = currentCategories.find(
    c => c.id === catRef || c.name.toLowerCase().trim() === catRef.toLowerCase().trim()
  );
  if (match && isValidUUID(match.id)) {
    return match.id;
  }
  return null;
};

interface FinancialContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  prediction: FinancialPrediction | null;
  predictionHistory: FinancialPrediction[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  activeHorizon: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  isCloudConnected: boolean;
  
  // Actions
  syncWithCloud: () => Promise<{ success: boolean; count?: number; message?: string }>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => boolean;
  addTransactionsBulk: (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>[], shouldReplace?: boolean) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearCorruptedTransactions: () => void;
  clearAllTransactions: () => void;
  
  addCategory: (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<Category>;
  deleteCategory: (id: string) => void;
  
  addBudget: (b: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  depositSavingsGoal: (id: string, amount: number) => void;
  deleteSavingsGoal: (id: string) => void;

  recalculatePrediction: (horizonDays?: number, budgetId?: string | null) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Helper: check if the current user is a real Supabase-authenticated user (not demo)
export const isCloudUser = (userId: string): boolean => {
  return isSupabaseConfigured && !!supabase && !userId.startsWith('usr_') && userId !== 'usr_demo_01';
};

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, currencySymbol } = useAuth();
  const userId = user?.id || 'usr_demo_01';
  const isDemoUser = !user || userId === 'usr_demo_01' || userId.startsWith('usr_demo');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // State with per-user LocalStorage persistence & cloud sync
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`intellibudget_categories_${userId}`);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`intellibudget_transactions_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return isDemoUser ? INITIAL_TRANSACTIONS : [];
      }
    }
    return isDemoUser ? INITIAL_TRANSACTIONS : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(`intellibudget_budgets_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return isDemoUser ? INITIAL_BUDGETS : [];
      }
    }
    return isDemoUser ? INITIAL_BUDGETS : [];
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem(`intellibudget_savings_goals_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return isDemoUser ? INITIAL_SAVINGS_GOALS : [];
      }
    }
    return isDemoUser ? INITIAL_SAVINGS_GOALS : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(`intellibudget_notifications_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return isDemoUser ? INITIAL_NOTIFICATIONS : [];
      }
    }
    return isDemoUser ? INITIAL_NOTIFICATIONS : [];
  });

  const [activeHorizon, setActiveHorizon] = useState<number>(30);
  const [predictionHistory, setPredictionHistory] = useState<FinancialPrediction[]>([]);

  // ===========================================
  // SUPABASE CLOUD SYNC: Fetch data on user change
  // ===========================================
  const fetchFromSupabase = useCallback(async () => {
    if (!isCloudUser(userId) || !supabase) return;
    setIsSyncing(true);

    try {
      // 1. Fetch categories first to ensure they exist and have valid UUIDs
      let { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      // If user has no categories in Supabase, auto-seed standard categories with UUIDs
      if (!catError && (!catData || catData.length === 0)) {
        const seedPayload = INITIAL_CATEGORIES.map(c => ({
          user_id: userId,
          name: c.name,
          type: c.type,
          icon: c.icon || 'Tag',
          color: c.color || '#6e44ff',
        }));
        const { data: seeded } = await supabase
          .from('categories')
          .insert(seedPayload)
          .select();
        if (seeded && seeded.length > 0) {
          catData = seeded;
        }
      }

      const activeCategories: Category[] = catData && catData.length > 0 ? catData : INITIAL_CATEGORIES;
      if (catData && catData.length > 0) {
        setCategories(catData);
        localStorage.setItem(`intellibudget_categories_${userId}`, JSON.stringify(catData));
      }

      // 2. Fetch all user data in parallel
      const [txRes, bdgRes, svgRes, ntfRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      // 3. Transactions handling & automatic local migration
      if (txRes.data && txRes.data.length > 0) {
        setTransactions(txRes.data);
        localStorage.setItem(`intellibudget_transactions_${userId}`, JSON.stringify(txRes.data));
      } else if (!txRes.error) {
        // Supabase returned 0 transactions for this user.
        // Check if there are local transactions on this device to migrate (e.g. from an import on this device)
        const localSaved = localStorage.getItem(`intellibudget_transactions_${userId}`) ||
                           localStorage.getItem('intellibudget_transactions_usr_demo_01');
        let localTxs: Transaction[] = [];
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localTxs = parsed.filter(t => t && typeof t.amount === 'number' && t.amount > 0);
            }
          } catch {}
        }

        if (localTxs.length > 0) {
          console.log(`[TrackFi] Migrating ${localTxs.length} local transactions to Supabase for user ${userId}...`);
          const rowsToInsert = localTxs.map(tx => ({
            user_id: userId,
            type: tx.type,
            amount: tx.amount,
            category_id: resolveCategoryUUID(tx.category_id, activeCategories),
            date: tx.date,
            description: tx.description || null,
            payment_method: tx.payment_method || null,
            is_recurring: tx.is_recurring || false,
            recurrence_interval: tx.recurrence_interval || null,
          }));

          const { data: uploaded, error: uploadErr } = await supabase
            .from('transactions')
            .insert(rowsToInsert)
            .select();

          if (uploaded && uploaded.length > 0) {
            setTransactions(uploaded);
            localStorage.setItem(`intellibudget_transactions_${userId}`, JSON.stringify(uploaded));
          } else {
            if (uploadErr) console.error('[TrackFi] Migration insert error:', uploadErr);
            setTransactions(localTxs);
          }
        } else {
          setTransactions([]);
          localStorage.setItem(`intellibudget_transactions_${userId}`, JSON.stringify([]));
        }
      }

      if (bdgRes.data && bdgRes.data.length > 0) {
        setBudgets(bdgRes.data);
      } else if (!bdgRes.error) {
        setBudgets([]);
      }

      if (svgRes.data && svgRes.data.length > 0) {
        setSavingsGoals(svgRes.data);
      } else if (!svgRes.error) {
        setSavingsGoals([]);
      }

      if (ntfRes.data && ntfRes.data.length > 0) {
        setNotifications(ntfRes.data);
      } else if (!ntfRes.error) {
        setNotifications([]);
      }

      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('[TrackFi] Supabase fetch failed, using localStorage cache:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  // Reload user data when user changes — Supabase first, then localStorage fallback
  useEffect(() => {
    if (isCloudUser(userId)) {
      fetchFromSupabase();
    } else {
      // For demo/local users, load from localStorage
      const savedTx = localStorage.getItem(`intellibudget_transactions_${userId}`);
      if (savedTx) {
        try { setTransactions(JSON.parse(savedTx)); } catch {}
      } else {
        setTransactions(isDemoUser ? INITIAL_TRANSACTIONS : []);
      }

      const savedBdg = localStorage.getItem(`intellibudget_budgets_${userId}`);
      if (savedBdg) {
        try { setBudgets(JSON.parse(savedBdg)); } catch {}
      } else {
        setBudgets(isDemoUser ? INITIAL_BUDGETS : []);
      }

      const savedSvg = localStorage.getItem(`intellibudget_savings_goals_${userId}`);
      if (savedSvg) {
        try { setSavingsGoals(JSON.parse(savedSvg)); } catch {}
      } else {
        setSavingsGoals(isDemoUser ? INITIAL_SAVINGS_GOALS : []);
      }

      const savedNtf = localStorage.getItem(`intellibudget_notifications_${userId}`);
      if (savedNtf) {
        try { setNotifications(JSON.parse(savedNtf)); } catch {}
      } else {
        setNotifications(isDemoUser ? INITIAL_NOTIFICATIONS : []);
      }

      const savedCat = localStorage.getItem(`intellibudget_categories_${userId}`);
      if (savedCat) {
        try { setCategories(JSON.parse(savedCat)); } catch {}
      } else {
        setCategories(isDemoUser ? INITIAL_CATEGORIES : []);
      }
    }
  }, [userId, fetchFromSupabase, isDemoUser]);

  // Realtime multi-device sync & Window Focus listener
  useEffect(() => {
    if (!isCloudUser(userId) || !supabase) return;

    const handleFocus = () => {
      fetchFromSupabase();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchFromSupabase();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const channel = supabase
      .channel(`sync_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals', filter: `user_id=eq.${userId}` }, () => {
        fetchFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` }, () => {
        fetchFromSupabase();
      })
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, fetchFromSupabase]);

  // Sync to LocalStorage per user ID (acts as cache for fast loads)
  useEffect(() => {
    localStorage.setItem(`intellibudget_categories_${userId}`, JSON.stringify(categories));
  }, [categories, userId]);

  useEffect(() => {
    localStorage.setItem(`intellibudget_transactions_${userId}`, JSON.stringify(transactions));
  }, [transactions, userId]);

  useEffect(() => {
    localStorage.setItem(`intellibudget_budgets_${userId}`, JSON.stringify(budgets));
  }, [budgets, userId]);

  useEffect(() => {
    localStorage.setItem(`intellibudget_savings_goals_${userId}`, JSON.stringify(savingsGoals));
  }, [savingsGoals, userId]);

  useEffect(() => {
    localStorage.setItem(`intellibudget_notifications_${userId}`, JSON.stringify(notifications));
  }, [notifications, userId]);

  // Derived Key Financial Totals
  const totalIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const currentBalance = totalIncome - totalExpense;

  // Active Prediction Calculation
  const prediction = useMemo(() => {
    return computeFinancialPrediction({
      userId,
      transactions,
      currentBalance,
      budgets,
      horizonDays: activeHorizon,
      currencySymbol,
    });
  }, [userId, transactions, currentBalance, budgets, activeHorizon, currencySymbol]);

  // Update Prediction History
  useEffect(() => {
    if (prediction) {
      setPredictionHistory(prev => {
        const filtered = prev.filter(p => p.id !== prediction.id);
        return [prediction, ...filtered].slice(0, 15);
      });
    }
  }, [prediction?.id]);

  // Automated Notifications Logic (Low Balance, Budget Alerts, High Risk)
  useEffect(() => {
    if (!user) return;
    const newAlerts: NotificationItem[] = [];

    // Low balance check
    if (currentBalance < user.low_balance_threshold) {
      const alreadyNotified = notifications.some(n => n.type === 'low_balance' && !n.is_read);
      if (!alreadyNotified) {
        newAlerts.push({
          id: `ntf_low_${Date.now()}`,
          user_id: userId,
          type: 'low_balance',
          title: 'Low Balance Warning',
          body: `Your current balance (${currencySymbol}${currentBalance.toLocaleString()}) has fallen below your low-balance threshold (${currencySymbol}${user.low_balance_threshold.toLocaleString()}).`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Budget usage check (90% / 100%)
    budgets.forEach(b => {
      const spent = transactions
        .filter(t => {
          if (t.type !== 'expense') return false;
          if (b.category_id && t.category_id !== b.category_id) return false;
          // Only count transactions within this budget's date range
          if (t.date < b.start_date || t.date > b.end_date) return false;
          return true;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const usageRatio = spent / b.amount;
      if (usageRatio >= 1.0) {
        const exists = notifications.some(n => n.title.includes(b.title) && n.type === 'budget_exceeded');
        if (!exists) {
          newAlerts.push({
            id: `ntf_exc_${b.id}_${Date.now()}`,
            user_id: userId,
            type: 'budget_exceeded',
            title: `Budget Exceeded: ${b.title}`,
            body: `You have exceeded your budgeted limit of ${currencySymbol}${b.amount.toLocaleString()} for "${b.title}" (Spent: ${currencySymbol}${spent.toLocaleString()}).`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } else if (usageRatio >= 0.9) {
        const exists = notifications.some(n => n.title.includes(b.title));
        if (!exists) {
          newAlerts.push({
            id: `ntf_warn_${b.id}_${Date.now()}`,
            user_id: userId,
            type: 'budget_warning',
            title: `Budget Alert (90% Limit): ${b.title}`,
            body: `You have used ${Math.round(usageRatio * 100)}% of your budgeted amount for "${b.title}".`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setNotifications(prev => [...newAlerts, ...prev]);
      // Sync new notifications to Supabase
      if (isCloudUser(userId) && supabase) {
        supabase.from('notifications').insert(
          newAlerts.map(n => ({ ...n }))
        ).then(() => {});
      }
    }
  }, [currentBalance, budgets, transactions, user, currencySymbol]);

  // ===========================================
  // ACTIONS — with Supabase sync & UUID validation
  // ===========================================

  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): boolean => {
    if (tx.type === 'expense' && tx.amount > currentBalance) {
      return false;
    }
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      setIsSyncing(true);
      const safeCatId = resolveCategoryUUID(tx.category_id, categories);
      supabase.from('transactions').insert({
        user_id: userId,
        type: tx.type,
        amount: tx.amount,
        category_id: safeCatId,
        date: tx.date,
        description: tx.description || null,
        payment_method: tx.payment_method || null,
        is_recurring: tx.is_recurring || false,
        recurrence_interval: tx.recurrence_interval || null,
      }).select().single().then(({ data, error }) => {
        setIsSyncing(false);
        if (error) {
          console.error('[TrackFi] Error inserting transaction to Supabase:', error);
        } else if (data) {
          setTransactions(prev => prev.map(t => t.id === newTx.id ? { ...t, id: data.id } : t));
          setLastSyncedAt(new Date());
        }
      });
    }

    return true;
  };

  const addTransactionsBulk = (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>[], shouldReplace: boolean = false) => {
    const now = new Date().toISOString();
    const newItems: Transaction[] = txs.map((tx, idx) => ({
      ...tx,
      id: `tx_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    }));
    if (shouldReplace) {
      setTransactions(newItems);
    } else {
      setTransactions(prev => [...newItems, ...prev]);
    }

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      setIsSyncing(true);
      const cleanRows = txs.map(tx => ({
        user_id: userId,
        type: tx.type,
        amount: tx.amount,
        category_id: resolveCategoryUUID(tx.category_id, categories),
        date: tx.date,
        description: tx.description || null,
        payment_method: tx.payment_method || null,
        is_recurring: tx.is_recurring || false,
        recurrence_interval: tx.recurrence_interval || null,
      }));

      const executeSync = async () => {
        if (!supabase) return;
        try {
          if (shouldReplace) {
            await supabase.from('transactions').delete().eq('user_id', userId);
          }
          const { data, error } = await supabase.from('transactions').insert(cleanRows).select();
          if (error) {
            console.error('[TrackFi] Bulk transactions insert error:', error);
          } else if (data) {
            setTransactions(prev => {
              if (shouldReplace) return data;
              const localIds = new Set(newItems.map(i => i.id));
              const withoutLocal = prev.filter(t => !localIds.has(t.id));
              return [...data, ...withoutLocal];
            });
            setLastSyncedAt(new Date());
          }
        } catch (err) {
          console.error('[TrackFi] Bulk sync exception:', err);
        } finally {
          setIsSyncing(false);
        }
      };
      executeSync();
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const now = new Date().toISOString();
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates, updated_at: now } : t));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      const { id: _id, user_id: _uid, created_at: _ca, ...safeUpdates } = updates as any;
      if (safeUpdates.category_id !== undefined) {
        safeUpdates.category_id = resolveCategoryUUID(safeUpdates.category_id, categories);
      }
      supabase.from('transactions').update({ ...safeUpdates, updated_at: now }).eq('id', id).eq('user_id', userId).then(() => {});
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('transactions').delete().eq('id', id).eq('user_id', userId).then(() => {});
    }
  };

  const clearCorruptedTransactions = () => {
    setTransactions(prev => {
      const corrupted = prev.filter(t => isCorruptedTransaction(t));
      const clean = prev.filter(t => !isCorruptedTransaction(t));

      // Delete corrupted from Supabase
      if (isCloudUser(userId) && supabase && corrupted.length > 0) {
        const corruptedIds = corrupted.map(t => t.id);
        supabase.from('transactions').delete().in('id', corruptedIds).eq('user_id', userId).then(() => {});
      }

      return clean;
    });
  };

  const clearAllTransactions = () => {
    setTransactions([]);
    localStorage.setItem(`intellibudget_transactions_${userId}`, JSON.stringify([]));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('transactions').delete().eq('user_id', userId).then(() => {});
    }
  };

  const addCategory = async (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>): Promise<Category> => {
    const now = new Date().toISOString();
    let newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}`,
      user_id: userId,
      created_at: now,
    };

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      try {
        const { data, error } = await supabase.from('categories').insert({
          user_id: userId,
          name: cat.name,
          type: cat.type,
          icon: cat.icon || 'Tag',
          color: cat.color || '#6e44ff',
        }).select().single();
        if (data) {
          newCat = data;
        } else if (error) {
          console.error('[TrackFi] Error inserting category to Supabase:', error);
        }
      } catch (err) {
        console.error('[TrackFi] Category insert exception:', err);
      }
    }

    setCategories(prev => {
      const filtered = prev.filter(c => c.id !== newCat.id && c.name.toLowerCase().trim() !== newCat.name.toLowerCase().trim());
      return [...filtered, newCat];
    });

    return newCat;
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('categories').delete().eq('id', id).eq('user_id', userId).then(() => {});
    }
  };

  const addBudget = (b: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newB: Budget = {
      ...b,
      id: `bdg_${Date.now()}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };
    setBudgets(prev => [newB, ...prev]);

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('budgets').insert({
        user_id: userId,
        title: b.title,
        amount: b.amount,
        period_type: b.period_type,
        start_date: b.start_date,
        end_date: b.end_date,
        category_id: resolveCategoryUUID(b.category_id, categories),
        notes: b.notes || null,
      }).select().single().then(({ data, error }) => {
        if (error) {
          console.error('[TrackFi] Error inserting budget to Supabase:', error);
        } else if (data) {
          setBudgets(prev => prev.map(bg => bg.id === newB.id ? { ...bg, id: data.id } : bg));
        }
      });
    }
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    const now = new Date().toISOString();
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates, updated_at: now } : b));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      const { id: _id, user_id: _uid, created_at: _ca, ...safeUpdates } = updates as any;
      if (safeUpdates.category_id !== undefined) {
        safeUpdates.category_id = resolveCategoryUUID(safeUpdates.category_id, categories);
      }
      supabase.from('budgets').update({ ...safeUpdates, updated_at: now }).eq('id', id).eq('user_id', userId).then(() => {});
    }
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('budgets').delete().eq('id', id).eq('user_id', userId).then(() => {});
    }
  };

  const addSavingsGoal = (g: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newG: SavingsGoal = {
      ...g,
      id: `svg_${Date.now()}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };
    setSavingsGoals(prev => [newG, ...prev]);

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('savings_goals').insert({
        user_id: userId,
        name: g.name,
        target_amount: g.target_amount,
        current_amount: g.current_amount || 0,
        deadline: g.deadline || null,
        notes: g.notes || null,
      }).select().single().then(({ data }) => {
        if (data) {
          setSavingsGoals(prev => prev.map(sg => sg.id === newG.id ? { ...sg, id: data.id } : sg));
        }
      });
    }

    // Automatically record an expense transaction if initial deposit > 0
    if (g.current_amount > 0) {
      addTransaction({
        type: 'expense',
        amount: g.current_amount,
        category_id: null,
        date: format(new Date(), 'yyyy-MM-dd'),
        description: `Initial Savings Vault Deposit: ${g.name}`,
        payment_method: 'Savings Deposit',
        is_recurring: false,
        recurrence_interval: null,
      });
    }
  };

  const depositSavingsGoal = (id: string, amount: number) => {
    const targetGoal = savingsGoals.find(g => g.id === id);
    const goalName = targetGoal?.name || 'Savings Vault';
    const now = new Date().toISOString();

    setSavingsGoals(prev => prev.map(g => g.id === id ? {
      ...g,
      current_amount: g.current_amount + amount,
      updated_at: now
    } : g));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase && targetGoal) {
      supabase.from('savings_goals').update({
        current_amount: targetGoal.current_amount + amount,
        updated_at: now,
      }).eq('id', id).eq('user_id', userId).then(() => {});
    }

    // Automatically record an expense transaction so total available balance is deducted
    addTransaction({
      type: 'expense',
      amount: amount,
      category_id: null,
      date: format(new Date(), 'yyyy-MM-dd'),
      description: `Savings Vault Deposit: ${goalName}`,
      payment_method: 'Savings Deposit',
      is_recurring: false,
      recurrence_interval: null,
    });
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('savings_goals').delete().eq('id', id).eq('user_id', userId).then(() => {});
    }
  };

  const recalculatePrediction = (horizonDays: number = 30, budgetId: string | null = null) => {
    setActiveHorizon(horizonDays);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId).then(() => {});
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    // Sync to Supabase
    if (isCloudUser(userId) && supabase) {
      supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false).then(() => {});
    }
  };

  const syncWithCloud = async (): Promise<{ success: boolean; count?: number; message?: string }> => {
    if (!isCloudUser(userId) || !supabase) {
      return { success: false, message: 'Cloud sync requires an authenticated Supabase account.' };
    }
    try {
      await fetchFromSupabase();
      return { success: true, count: transactions.length, message: 'Successfully synced all data with cloud.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Sync failed.' };
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  return (
    <FinancialContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        savingsGoals,
        prediction,
        predictionHistory,
        notifications,
        unreadNotificationCount,
        totalIncome,
        totalExpense,
        currentBalance,
        activeHorizon,
        isSyncing,
        lastSyncedAt,
        isCloudConnected: isCloudUser(userId),
        syncWithCloud,
        addTransaction,
        addTransactionsBulk,
        updateTransaction,
        deleteTransaction,
        clearCorruptedTransactions,
        clearAllTransactions,
        addCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        addSavingsGoal,
        depositSavingsGoal,
        deleteSavingsGoal,
        recalculatePrediction,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancial must be used within a FinancialProvider');
  return context;
};
