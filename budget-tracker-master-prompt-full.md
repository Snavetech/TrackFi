# Master Prompt for AI Web Builder
## Intelligent Web-Based Budget & Expense Tracker with Predictive Financial Sustainability Analytics

You are an expert product designer, full-stack engineer, and UX architect. Build a complete, production-ready web application using the specification below. Build it end-to-end — working code, working Supabase backend, working prediction logic — not a wireframe or a stub.

---

## 1. Project Overview

A web-based financial management application that helps an individual track income and expenses, manage budgets and savings goals, and — as its differentiating feature — forecasts whether the user's current spending pattern is financially sustainable, using a defined, explainable calculation rather than a black-box guess.

## 2. Problem Statement

Most people don't track income and expenses consistently. Budgets get ignored, overspending goes unnoticed, and by the time a problem is visible the money is already gone. Standard trackers show *past* spending; they rarely tell the user whether their *current* pattern can continue safely. This app closes that gap by pairing transaction tracking with a burn-rate-based sustainability forecast.

## 3. Aim & Objectives

**Aim:** design and implement a web app that manages income, expenses, budgets, and savings goals, and predicts financial sustainability from historical data.

**Objectives:**
- Secure user registration and login
- Budget creation and management
- Income and expense recording, categorized
- Dashboard and analytics (charts, summaries)
- Budget-vs-actual tracking with overspend/low-balance alerts
- Predictive sustainability analytics from transaction history
- Reports, exportable as CSV/PDF

## 4. Target Users

Individuals managing personal finances, students tracking allowances, small business owners tracking operating expenses, families managing a household budget.

## 5. User Roles

**Single role: authenticated user.** No admin role, no multi-tenant logic, no audit log — every table is owned by one `auth.uid()` and protected by Supabase RLS. Keep the build scoped to this; it's a final-year-appropriate MVP, not an enterprise system.

---

## 6. Functional Requirements (PRD)

**Authentication** — email/password sign up, login, logout, password reset, protected routes, persisted session.

**Budgets** — create/edit/delete; title, amount, period type (weekly/monthly/custom), start/end date, optional category scope (a single category, or left null to mean "all expense categories"); live comparison of budgeted vs. actual spend.

**Transactions (income + expense unified)** — one table with a `type` field rather than two separate tables, so the list, filters, and running balance stay simple. Each record: amount, type, category, date, description, payment method, optional recurring flag (weekly/monthly). Full CRUD, searchable and filterable by date range/category/type.

**Categories** — default seed set on account creation (Food, Transport, Rent, Utilities, Education, Health, Entertainment, Salary, Other Income); users can add custom ones with a color/icon for chart legibility.

**Dashboard** — total income, total expenses, current balance, active budget usage, recent transactions, savings goal progress, sustainability risk badge.

**Savings goals** — create/edit/delete; target amount, deadline, progress bar, "add funds" action.

**Predictive sustainability analytics** — see Section 9 for the exact method. Must produce: projected future balance, average daily burn rate, a 0–100 sustainability score, a risk level (low/moderate/high), an estimated budget exhaustion date, and a plain-language explanation. Predictions must be clearly labeled as estimates, not guarantees.

**Alerts / notifications** — in-app only for this build. Trigger when a budget crosses 90%/100% of its amount, when balance drops below a user-set low-balance threshold, or when risk level becomes 'high'.

**Reports** — monthly summary of income/expenses/savings/budget performance; CSV export and PDF export; date-range selection.

## 7. Non-Functional Requirements

- Responsive on desktop, tablet, mobile
- Simple, clean, uncluttered UI even on data-heavy pages
- Fast dashboard/report load times
- All monetary columns use `numeric(12,2)`, never float — avoids rounding bugs
- All private data protected by Supabase RLS (`auth.uid() = user_id` on every table)
- The Supabase anon key is expected to be public client-side; RLS is the actual security boundary — don't add unnecessary client-side secret-hiding on top of it

## 8. Assumptions, Constraints, Out of Scope

**Assumptions:** users enter data reasonably accurately; a rolling window of recent transactions (default 30 days) is enough to generate a meaningful forecast without full machine learning.

**Constraints:** stay scoped to something buildable as a final-year project — no bank integrations, no multi-currency conversion (one `preferred_currency` per user, display-only), no payroll/tax/investment features.

**Out of scope for MVP:** bank account sync, real-time bank APIs, multi-currency trading, investment portfolio management, payroll, tax filing, enterprise accounting.

---

## 9. System Design

### 9.1 Tech Stack (fixed — do not substitute)
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- Recharts for all charts
- date-fns for date handling
- Supabase: Auth, Postgres, Row Level Security, Edge Functions + `pg_cron` for scheduled prediction recompute
- Deploy target: Vercel or Netlify (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

### 9.2 Database Schema

```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  preferred_currency text default 'NGN',
  low_balance_threshold numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text,
  color text,
  created_at timestamptz default now()
);

-- budgets
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric(12,2) not null,
  period_type text not null check (period_type in ('weekly','monthly','custom')),
  start_date date not null,
  end_date date not null,
  category_id uuid references categories(id), -- null = all expense categories
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- transactions (income and expense unified)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid references categories(id),
  date date not null,
  description text,
  payment_method text,
  is_recurring boolean default false,
  recurrence_interval text check (recurrence_interval in ('weekly','monthly',null)),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- savings_goals
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  deadline date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- financial_predictions
create table financial_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references budgets(id) on delete cascade, -- null = whole-account forecast
  prediction_date date not null default current_date,
  forecast_horizon_days int not null default 30,
  avg_daily_burn_rate numeric(12,2),
  projected_balance numeric(12,2),
  sustainability_score int, -- 0-100
  risk_level text check (risk_level in ('low','moderate','high')),
  estimated_exhaustion_date date,
  explanation_text text,
  created_at timestamptz default now()
);

-- notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);
```

### 9.3 Row Level Security

Apply this pattern to every table (using `id` instead of `user_id` for `profiles`):

```sql
alter table transactions enable row level security;

create policy "Users manage own transactions"
on transactions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 9.4 Auto-provisioning

On new `auth.users` insert, use a Postgres trigger to create the matching `profiles` row and seed the default category set — don't rely on client-side code to do this, or partially-registered accounts will break the dashboard.

### 9.5 Prediction Algorithm (defined, not a black box)

1. Take transactions from a trailing window (default 30 days).
2. `avg_daily_income` = sum(income in window) / days_in_window
3. `avg_daily_expense` = sum(expense in window) / days_in_window
4. `avg_daily_burn_rate` = avg_daily_expense − avg_daily_income (positive = losing money per day)
5. `projected_balance` at the forecast horizon (default 30 days) = current_balance − (avg_daily_burn_rate × horizon_days)
6. If `budget_id` is set: `estimated_exhaustion_date` = budget.start_date + (budget.amount / avg_daily_expense in that category), capped at the budget's `end_date`
7. `sustainability_score` (0–100): start at 100, subtract proportionally to how soon the projected balance would hit zero relative to the horizon, and for any active overspend against a budget — keep the exact weighting simple and consistent so it can be explained at a defense
8. `risk_level`: score ≥ 70 → low, 40–69 → moderate, < 40 → high
9. `explanation_text`: template-generated, e.g. "At your current spending pace, your balance is projected to shrink by ₦X over the next 30 days. Risk level: moderate."

Recompute nightly via Edge Function + `pg_cron`, and on-demand via a "Recalculate now" button on the Predictions page. Write a new row each time so prediction history is preserved and can be charted.

### 9.6 Information Architecture / Pages

**Public:** Landing, Login, Sign Up, Forgot Password
**Authenticated:** Dashboard, Budgets, Transactions, Categories, Savings Goals, Analytics, Predictions, Reports, Settings
**Utility:** 404, empty states, loading skeletons

---

## 10. MVP

**MVP goal:** the smallest complete version that still solves the core problem — track finances, manage a budget, and get a sustainability forecast.

**MVP feature set:** everything in Section 6 above. Nothing beyond it (no admin tools, no audit trail, no email notifications, no bank sync) belongs in this build.

**MVP user flow:**
1. User registers or logs in
2. User creates a budget
3. User records income and expenses
4. Dashboard updates automatically
5. System forecasts sustainability
6. User sees warnings/recommendations and tracks goals
7. User reviews reports

**MVP success criteria:** a user can create budgets, record transactions, see accurate summaries, receive a sustainability prediction, and understand at a glance whether their current spending is safe.

---

## 11. UX/UI Requirements

- Sidebar nav on desktop, compact/bottom nav on mobile
- KPI cards, progress bars, line/bar/donut charts, transaction tables, filter controls, modal forms, toast notifications, empty states, loading skeletons
- Color carries financial meaning: green = positive/on-track, amber = caution, red = risk
- Accessible: readable contrast, keyboard-navigable, semantic HTML, clear labels

---

## 12. Recommended Build Order

Build in this order and confirm each stage works before moving on — don't attempt everything in one pass:
1. Schema + RLS + auth + app shell
2. Full CRUD (categories, transactions, budgets, savings goals)
3. Dashboard + Analytics charts
4. Prediction engine (Section 9.5) + Predictions page
5. Reports, notifications, settings, empty/loading states, demo seed data

---

## 13. Acceptance Criteria

- Sign up, log in, log out, and password reset all work end-to-end
- Full CRUD works for transactions, budgets, categories, and savings goals
- Dashboard and Analytics reflect live data with no manual refresh
- Predictions page shows a real computed forecast matching the Section 9.5 formula, not a placeholder
- RLS is enabled on every table; a second test account cannot see the first account's data
- CSV and PDF export produce correct, non-stub files
