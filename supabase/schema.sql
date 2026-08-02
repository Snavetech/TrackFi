-- Intelligent Budget & Expense Tracker - Supabase SQL Schema & RLS Setup

-- Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  preferred_currency text default 'NGN',
  low_balance_threshold numeric(12,2) default 10000.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Categories Table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text,
  color text,
  created_at timestamptz default now()
);

-- 3. Budgets Table
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  period_type text not null check (period_type in ('weekly','monthly','custom')),
  start_date date not null,
  end_date date not null,
  category_id uuid references categories(id) on delete set null, -- null = all expense categories
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Transactions Table (unified income + expense)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid references categories(id) on delete set null,
  date date not null,
  description text,
  payment_method text,
  is_recurring boolean default false,
  recurrence_interval text check (recurrence_interval in ('weekly','monthly',null)),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Savings Goals Table
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) default 0.00 check (current_amount >= 0),
  deadline date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Financial Predictions Table
create table if not exists financial_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references budgets(id) on delete cascade, -- null = whole account forecast
  prediction_date date not null default current_date,
  forecast_horizon_days int not null default 30,
  avg_daily_burn_rate numeric(12,2),
  projected_balance numeric(12,2),
  sustainability_score int check (sustainability_score between 0 and 100),
  risk_level text check (risk_level in ('low','moderate','high')),
  estimated_exhaustion_date date,
  explanation_text text,
  created_at timestamptz default now()
);

-- 7. Notifications Table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table budgets enable row level security;
alter table transactions enable row level security;
alter table savings_goals enable row level security;
alter table financial_predictions enable row level security;
alter table notifications enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Categories Policies
create policy "Users manage own categories" on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Budgets Policies
create policy "Users manage own budgets" on budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Transactions Policies
create policy "Users manage own transactions" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Savings Goals Policies
create policy "Users manage own savings goals" on savings_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Financial Predictions Policies
create policy "Users manage own predictions" on financial_predictions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications Policies
create policy "Users manage own notifications" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- AUTOMATIC PROVISIONING TRIGGER
-- ==========================================
-- Seeds profile and standard categories on auth.users registration

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 1. Create Profile
  insert into public.profiles (id, full_name, preferred_currency)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'preferred_currency', 'NGN'));

  -- 2. Seed Default Expense Categories
  insert into public.categories (user_id, name, type, icon, color) values
    (new.id, 'Food & Groceries', 'expense', 'Utensils', '#ef4444'),
    (new.id, 'Transportation', 'expense', 'Car', '#f97316'),
    (new.id, 'Rent & Housing', 'expense', 'Home', '#eab308'),
    (new.id, 'Utilities & Bills', 'expense', 'Zap', '#84cc16'),
    (new.id, 'Education', 'expense', 'BookOpen', '#06b6d4'),
    (new.id, 'Health & Medical', 'expense', 'Activity', '#3b82f6'),
    (new.id, 'Entertainment', 'expense', 'Film', '#a855f7'),
    (new.id, 'Salary', 'income', 'Briefcase', '#10b981'),
    (new.id, 'Other Income', 'income', 'DollarSign', '#14b8a6');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================
-- PREDICTION ENGINE PL/PGSQL RECOMPUTE FUNCTION
-- ==========================================

create or replace function public.recalculate_user_sustainability(p_user_id uuid, p_horizon_days int default 30)
returns uuid as $$
declare
  v_window_days int := 30;
  v_start_date date := current_date - (v_window_days || ' days')::interval;
  v_tot_income numeric(12,2) := 0;
  v_tot_expense numeric(12,2) := 0;
  v_curr_balance numeric(12,2) := 0;
  v_avg_daily_inc numeric(12,2) := 0;
  v_avg_daily_exp numeric(12,2) := 0;
  v_burn_rate numeric(12,2) := 0;
  v_proj_balance numeric(12,2) := 0;
  v_score int := 100;
  v_risk text := 'low';
  v_exhaustion_date date := null;
  v_days_to_zero numeric := null;
  v_explanation text := '';
  v_pred_id uuid;
begin
  -- Total Income & Expense in 30-day trailing window
  select coalesce(sum(amount), 0) into v_tot_income
  from public.transactions
  where user_id = p_user_id and type = 'income' and date >= v_start_date;

  select coalesce(sum(amount), 0) into v_tot_expense
  from public.transactions
  where user_id = p_user_id and type = 'expense' and date >= v_start_date;

  -- Overall Current Balance (all time)
  select coalesce(sum(case when type = 'income' then amount else -amount end), 0) into v_curr_balance
  from public.transactions
  where user_id = p_user_id;

  -- Averages
  v_avg_daily_inc := v_tot_income / v_window_days;
  v_avg_daily_exp := v_tot_expense / v_window_days;
  v_burn_rate := v_avg_daily_exp - v_avg_daily_inc;

  -- Projected balance at horizon
  v_proj_balance := v_curr_balance - (v_burn_rate * p_horizon_days);

  -- Score calculation
  if v_burn_rate > 0 then
    -- Burning net cash per day
    v_days_to_zero := case when v_curr_balance > 0 then v_curr_balance / v_burn_rate else 0 end;
    v_exhaustion_date := current_date + (v_days_to_zero || ' days')::interval;

    if v_days_to_zero < p_horizon_days then
      v_score := greatest(0, (v_days_to_zero / p_horizon_days * 50)::int);
    else
      v_score := greatest(50, 100 - ((v_burn_rate / (v_avg_daily_inc + 1)) * 30)::int);
    end if;
  else
    -- Cash flow positive or neutral
    v_score := 95;
    v_exhaustion_date := null;
  end if;

  -- Risk Mapping
  if v_score >= 70 then
    v_risk := 'low';
  elsif v_score >= 40 then
    v_risk := 'moderate';
  else
    v_risk := 'high';
  end if;

  -- Explanation text synthesis
  if v_burn_rate > 0 then
    v_explanation := 'Your average daily spending exceeds income by ' || round(v_burn_rate, 2)::text || 
      ' per day. Over the next ' || p_horizon_days || ' days, your balance is projected to change from ' || 
      round(v_curr_balance, 2)::text || ' to ' || round(v_proj_balance, 2)::text || '.';
  else
    v_explanation := 'Your financial pattern is sustainable. You are saving approximately ' || 
      round(abs(v_burn_rate), 2)::text || ' per day, maintaining a healthy cash buffer.';
  end if;

  -- Save Prediction
  insert into public.financial_predictions (
    user_id, budget_id, prediction_date, forecast_horizon_days,
    avg_daily_burn_rate, projected_balance, sustainability_score,
    risk_level, estimated_exhaustion_date, explanation_text
  ) values (
    p_user_id, null, current_date, p_horizon_days,
    v_burn_rate, v_proj_balance, v_score,
    v_risk, v_exhaustion_date, v_explanation
  ) returning id into v_pred_id;

  return v_pred_id;
end;
$$ language plpgsql security definer;
