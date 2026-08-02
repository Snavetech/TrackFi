import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { TransactionModal } from '../components/modals/TransactionModal';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  EyeOff,
  Wifi
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parseISO, subMonths, subWeeks } from 'date-fns';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const {
    currentBalance,
    totalIncome,
    totalExpense,
    prediction,
    budgets,
    transactions,
    categories
  } = useFinancial();

  const { user, currencySymbol } = useAuth();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Category Map
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const [chartTimeframe, setChartTimeframe] = useState<'day' | 'week' | 'month'>('day');

  // Monthly Budget calculations
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalBudgetSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const budgetProgressPercent = totalBudgetLimit > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetLimit) * 100)) : 0;

  // Chart data setup for Expenses Statistics (Day / Week / Month grouping)
  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const displayChartData = React.useMemo(() => {
    if (chartTimeframe === 'month') {
      const monthsMap = new Map<string, number>();
      const refDate = sortedTxs.length > 0 ? parseISO(sortedTxs[sortedTxs.length - 1].date) : new Date();
      for (let i = 5; i >= 0; i--) {
        const mDate = subMonths(refDate, i);
        const mKey = format(mDate, 'MMM yyyy');
        monthsMap.set(mKey, 0);
      }
      sortedTxs.forEach(t => {
        if (t.type !== 'expense') return;
        const mKey = format(parseISO(t.date), 'MMM yyyy');
        if (monthsMap.has(mKey)) {
          monthsMap.set(mKey, (monthsMap.get(mKey) || 0) + t.amount);
        } else {
          monthsMap.set(mKey, t.amount);
        }
      });
      return Array.from(monthsMap.entries()).map(([date, amount]) => ({ date, amount }));
    }

    if (chartTimeframe === 'week') {
      const weeksMap = new Map<string, number>();
      const refDate = sortedTxs.length > 0 ? parseISO(sortedTxs[sortedTxs.length - 1].date) : new Date();
      for (let i = 5; i >= 0; i--) {
        const wDate = subWeeks(refDate, i);
        const weekNum = Math.ceil(wDate.getDate() / 7);
        const wKey = `${format(wDate, 'MMM')} W${weekNum}`;
        weeksMap.set(wKey, 0);
      }
      sortedTxs.forEach(t => {
        if (t.type !== 'expense') return;
        const dObj = parseISO(t.date);
        const weekNum = Math.ceil(dObj.getDate() / 7);
        const wKey = `${format(dObj, 'MMM')} W${weekNum}`;
        if (weeksMap.has(wKey)) {
          weeksMap.set(wKey, (weeksMap.get(wKey) || 0) + t.amount);
        } else {
          weeksMap.set(wKey, t.amount);
        }
      });
      return Array.from(weeksMap.entries()).map(([date, amount]) => ({ date, amount }));
    }

    // Day grouping
    const chartDataMap = new Map<string, { date: string; amount: number }>();
    sortedTxs.forEach(t => {
      if (t.type !== 'expense') return;
      const key = format(parseISO(t.date), 'MMM d');
      const existing = chartDataMap.get(key) || { date: key, amount: 0 };
      existing.amount += t.amount;
      chartDataMap.set(key, existing);
    });

    const dayData = Array.from(chartDataMap.values());
    if (dayData.length === 1) {
      const single = dayData[0];
      return [
        { date: 'Prev', amount: 0 },
        single,
        { date: 'Next', amount: 0 }
      ];
    }
    return dayData.length > 0 ? dayData : [{ date: format(new Date(), 'MMM d'), amount: 0 }];
  }, [sortedTxs, chartTimeframe]);

  // Map real categories
  const displayCategoryTiles = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amt = transactions
        .filter(t => t.type === 'expense' && t.category_id === c.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: c.name, amount: amt };
    });

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#332a54] tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Ismail'}!
          </h1>
        </div>

        {/* Prediction Risk Quick Pill */}
        {prediction && (
          <div
            onClick={() => onNavigate('predictions')}
            className="cursor-pointer flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-purple-100 shadow-sm hover:shadow-md transition"
          >
            <RiskBadge level={prediction.risk_level} score={prediction.sustainability_score} />
            <div className="text-left">
              <p className="text-[11px] font-bold text-[#6e44ff] uppercase tracking-wider">Predictive Score</p>
              <p className="text-xs text-[#8b849c]">{prediction.risk_level === 'low' ? 'Sustainable Path' : 'Review Spending'}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8b849c]" />
          </div>
        )}
      </div>

      {/* Main Top Section Grid: Balance Card + Income & Budget Card + Expense Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Available Balance & Monthly Income Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Executive Available Balance Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2a2247] via-[#1f1938] to-[#141026] text-white shadow-xl shadow-purple-950/25 border border-purple-800/40 relative overflow-hidden flex flex-col justify-between min-h-[200px] group transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/30">
            {/* Micro-glare backdrop highlights */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#6e44ff]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Row: Title + Privacy Eye Toggle + Contactless Signal */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold tracking-widest text-purple-200/90 uppercase">Available Balance</span>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  title={showBalance ? "Hide balance" : "Show balance"}
                  className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 transition backdrop-blur-sm"
                >
                  {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-purple-300/80">
                <Wifi className="w-4 h-4 rotate-90" />
                <span className="text-[9px] font-extrabold tracking-widest uppercase text-purple-300/60">PLATINUM</span>
              </div>
            </div>

            {/* Middle Row: Balance Display */}
            <div className="relative z-10 my-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono drop-shadow-sm">
                {showBalance
                  ? `${currencySymbol} ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${currencySymbol} ••••••••`}
              </h2>
            </div>

            {/* Bottom Row: Chip + Card Number + Cardholder Name & Mastercard Logo */}
            <div className="relative z-10 pt-2 flex items-end justify-between border-t border-purple-500/20">
              <div className="space-y-0.5">
                {/* Golden Metallic EMV Chip */}
                <div className="w-7 h-5 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-200 border border-amber-500/50 shadow-xs relative overflow-hidden mb-1 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-amber-600/40 absolute top-1.5" />
                  <div className="w-full h-[1px] bg-amber-600/40 absolute bottom-1.5" />
                  <div className="h-full w-[1px] bg-amber-600/40 absolute left-2.5" />
                </div>
                <p className="text-[11px] font-mono font-extrabold text-purple-200/90 tracking-widest">
                  •••• •••• •••• 3922
                </p>
                <p className="text-[10px] font-bold text-purple-300/70 tracking-wider uppercase truncate max-w-[170px]">
                  {user?.full_name || 'ISMAIL ALABI'}
                </p>
              </div>

              {/* Mastercard Interlocking Circles */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#eb001b] opacity-90 shadow-sm" />
                  <div className="w-6 h-6 rounded-full bg-[#ff5f00] opacity-90 shadow-sm" />
                </div>
                <span className="text-[8px] font-extrabold tracking-widest text-purple-300/60 uppercase">MASTERCARD</span>
              </div>
            </div>
          </div>

          {/* Monthly Income & Budget Progress */}
          <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8b849c]">Monthly Income</span>
              <span className="text-sm font-extrabold text-[#6e44ff] font-mono">
                {currencySymbol} {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[11px] font-medium text-[#8b849c]">Monthly budget limit</p>
                <p className="text-sm font-bold text-emerald-600 mt-1 font-mono">
                  {currencySymbol} {totalBudgetLimit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#8b849c]">Spent</p>
                <p className="text-sm font-bold text-rose-500 mt-1 font-mono">
                  {currencySymbol} {totalBudgetSpent.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Purple Progress Bar */}
            <div className="pt-2">
              <div className="w-full h-3 rounded-full bg-purple-100/60 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-[#6e44ff] transition-all duration-500 shadow-sm"
                  style={{ width: `${budgetProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expenses Statistics Area Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#332a54]">Expenses Statistics</h3>
            <div className="relative">
              <select
                value={chartTimeframe}
                onChange={(e) => setChartTimeframe(e.target.value as any)}
                className="appearance-none bg-slate-50 border border-purple-100 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold text-[#6e44ff] focus:outline-none focus:border-[#6e44ff] cursor-pointer shadow-sm hover:bg-purple-50 transition"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6e44ff] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6e44ff" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6e44ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e2f2" vertical={false} />
                <XAxis dataKey="date" stroke="#4c416e" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} dy={6} />
                <YAxis
                  stroke="#4c416e"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${currencySymbol}${(v / 1000).toFixed(0)}k` : `${currencySymbol}${v}`)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#6e44ff20', borderRadius: '16px', color: '#332a54', fontWeight: 'bold', boxShadow: '0 10px 25px -5px rgba(110,68,255,0.15)' }}
                  formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Expense']}
                  labelStyle={{ fontWeight: '800', color: '#6e44ff' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6e44ff"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#purpleAreaGrad)"
                  activeDot={{ r: 6, fill: '#6e44ff', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Payments (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#332a54]">Recent Payments</h3>
            <button onClick={() => onNavigate('transactions')} className="text-xs text-[#6e44ff] font-bold hover:underline">
              View all
            </button>
          </div>

          <div className="divide-y divide-purple-50">
            {[...transactions]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 4)
              .map((t, idx) => {
                const isIncome = t.type === 'income';
              return (
                <div key={t.id || idx} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 rounded-xl px-1 transition">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="font-bold text-[#332a54]">{t.description || 'Expense Transaction'}</p>
                      <p className="text-[10px] text-[#8b849c] mt-0.5">{t.date} • {t.category_id ? categoryMap.get(t.category_id)?.name : 'General'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <span className={isIncome ? 'text-emerald-600' : 'text-[#6e44ff]'}>
                      {isIncome ? '+' : '-'} {currencySymbol}{t.amount.toFixed(2)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8b849c]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Monthly Expenses Category Tiles (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#332a54]">Monthly Expenses</h3>
            <button onClick={() => onNavigate('categories')} className="text-xs text-[#8b849c] font-semibold hover:text-[#6e44ff]">
              Edit
            </button>
          </div>

          {/* 3-column Grid Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayCategoryTiles.map((tile, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-purple-100/80 bg-white text-center hover:border-purple-300 transition duration-200 shadow-2xs hover:shadow-sm"
              >
                <p className="text-xs font-medium text-[#8b849c]">{tile.name}</p>
                <p className="text-sm font-bold text-[#332a54] mt-1 font-mono">
                  {currencySymbol} {tile.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} />
    </div>
  );
};

