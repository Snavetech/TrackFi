import { Category, Transaction, Budget, SavingsGoal, NotificationItem, Profile } from '../types';
import { format, subDays } from 'date-fns';

const today = new Date();
const formatDate = (daysAgo: number) => format(subDays(today, daysAgo), 'yyyy-MM-dd');

export const INITIAL_PROFILE: Profile = {
  id: 'usr_demo_01',
  full_name: 'Ismail Alabi',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  preferred_currency: 'NGN',
  low_balance_threshold: 20000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_food', user_id: 'usr_demo_01', name: 'Food & Groceries', type: 'expense', icon: 'Utensils', color: '#ef4444', created_at: new Date().toISOString() },
  { id: 'cat_transport', user_id: 'usr_demo_01', name: 'Transportation', type: 'expense', icon: 'Car', color: '#f97316', created_at: new Date().toISOString() },
  { id: 'cat_housing', user_id: 'usr_demo_01', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#eab308', created_at: new Date().toISOString() },
  { id: 'cat_utilities', user_id: 'usr_demo_01', name: 'Utilities & Data', type: 'expense', icon: 'Zap', color: '#84cc16', created_at: new Date().toISOString() },
  { id: 'cat_education', user_id: 'usr_demo_01', name: 'Education & Supplies', type: 'expense', icon: 'BookOpen', color: '#06b6d4', created_at: new Date().toISOString() },
  { id: 'cat_health', user_id: 'usr_demo_01', name: 'Health & Medical', type: 'expense', icon: 'Activity', color: '#3b82f6', created_at: new Date().toISOString() },
  { id: 'cat_entertainment', user_id: 'usr_demo_01', name: 'Leisure & Outings', type: 'expense', icon: 'Film', color: '#a855f7', created_at: new Date().toISOString() },
  { id: 'cat_savings', user_id: 'usr_demo_01', name: 'Savings & Investments', type: 'expense', icon: 'PiggyBank', color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: 'cat_transfers', user_id: 'usr_demo_01', name: 'Transfers & Banking', type: 'expense', icon: 'Repeat', color: '#6e44ff', created_at: new Date().toISOString() },
  { id: 'cat_salary', user_id: 'usr_demo_01', name: 'Salary & Income', type: 'income', icon: 'Briefcase', color: '#10b981', created_at: new Date().toISOString() },
  { id: 'cat_freelance', user_id: 'usr_demo_01', name: 'Side Gig / Stipend', type: 'income', icon: 'DollarSign', color: '#14b8a6', created_at: new Date().toISOString() },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
