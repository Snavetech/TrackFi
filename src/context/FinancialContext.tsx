import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => boolean;
  addTransactionsBulk: (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>[], shouldReplace?: boolean) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearCorruptedTransactions: () => void;
  clearAllTransactions: () => void;
  
  addCategory: (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => void;
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

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, currencySymbol } = useAuth();
  const userId = user?.id || 'usr_demo_01';

  // State with LocalStorage persistence
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('intellibudget_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('intellibudget_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy demo items
          return parsed.filter((t: any) => !t.id?.startsWith('tx_90_') && !t.id?.startsWith('tx_60_') && !t.id?.startsWith('tx_30_'));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('intellibudget_budgets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((b: any) => !b.id?.startsWith('bdg_'));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('intellibudget_savings_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((g: any) => !g.id?.startsWith('svg_'));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('intellibudget_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: any) => !n.id?.startsWith('ntf_01') && !n.id?.startsWith('ntf_02'));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeHorizon, setActiveHorizon] = useState<number>(30);
  const [predictionHistory, setPredictionHistory] = useState<FinancialPrediction[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('intellibudget_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('intellibudget_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('intellibudget_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('intellibudget_savings_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem('intellibudget_notifications', JSON.stringify(notifications));
  }, [notifications]);

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
  }, [prediction]);

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
        .filter(t => t.type === 'expense' && (!b.category_id || t.category_id === b.category_id))
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
    }
  }, [currentBalance, budgets, transactions, user, currencySymbol]);

  // Actions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): boolean => {
    if (tx.type === 'expense' && tx.amount > currentBalance) {
      return false;
    }
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTransactions(prev => [newTx, ...prev]);
    return true;
  };

  const addTransactionsBulk = (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>[], shouldReplace: boolean = false) => {
    const newItems: Transaction[] = txs.map((tx, idx) => ({
      ...tx,
      id: `tx_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    if (shouldReplace) {
      setTransactions(newItems);
    } else {
      setTransactions(prev => [...newItems, ...prev]);
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const clearCorruptedTransactions = () => {
    setTransactions(prev => prev.filter(t => !isCorruptedTransaction(t)));
  };

  const clearAllTransactions = () => {
    setTransactions([]);
    localStorage.setItem('intellibudget_transactions', JSON.stringify([]));
  };

  const addCategory = (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    setCategories(prev => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addBudget = (b: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newB: Budget = {
      ...b,
      id: `bdg_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBudgets(prev => [newB, ...prev]);
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b));
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const addSavingsGoal = (g: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newG: SavingsGoal = {
      ...g,
      id: `svg_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSavingsGoals(prev => [newG, ...prev]);

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

    setSavingsGoals(prev => prev.map(g => g.id === id ? {
      ...g,
      current_amount: g.current_amount + amount,
      updated_at: new Date().toISOString()
    } : g));

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
  };

  const recalculatePrediction = (horizonDays: number = 30, budgetId: string | null = null) => {
    setActiveHorizon(horizonDays);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
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
