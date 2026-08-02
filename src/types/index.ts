export type TransactionType = 'income' | 'expense';
export type PeriodType = 'weekly' | 'monthly' | 'custom';
export type RecurrenceInterval = 'weekly' | 'monthly' | null;
export type RiskLevel = 'low' | 'moderate' | 'high';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  preferred_currency: string; // e.g. NGN, USD, EUR, GBP
  low_balance_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  period_type: PeriodType;
  start_date: string;
  end_date: string;
  category_id?: string | null; // null = all expense categories
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category_id?: string | null;
  date: string;
  description?: string;
  payment_method?: string;
  is_recurring?: boolean;
  recurrence_interval?: RecurrenceInterval;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialPrediction {
  id: string;
  user_id: string;
  budget_id?: string | null;
  prediction_date: string;
  forecast_horizon_days: number;
  avg_daily_burn_rate: number;
  projected_balance: number;
  sustainability_score: number; // 0-100
  score_label?: string; // e.g. 'Good', 'Fair', 'Critical'
  risk_level: RiskLevel;
  estimated_exhaustion_date?: string | null;
  days_remaining?: number | null;
  explanation_text: string;
  primary_insight?: string;
  recommendations?: string[];
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'low_balance' | 'high_risk' | 'system';
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];
