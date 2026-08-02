import React from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { BarChart3, PieChart as PieIcon, TrendingUp, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export const Analytics: React.FC = () => {
  const { transactions, categories, totalIncome, totalExpense } = useFinancial();
  const { currencySymbol } = useAuth();

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Monthly Grouping Data
  const monthlyDataMap = new Map<string, { month: string; Income: number; Expenses: number }>();
  
  transactions.forEach(t => {
    const monthYear = t.date.substring(0, 7); // yyyy-MM
    const existing = monthlyDataMap.get(monthYear) || { month: monthYear, Income: 0, Expenses: 0 };
    if (t.type === 'income') existing.Income += t.amount;
    else existing.Expenses += t.amount;
    monthlyDataMap.set(monthYear, existing);
  });

  const monthlyBarData = Array.from(monthlyDataMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // Expense Categories Data
  const expenseCategoriesData = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = transactions
        .filter(t => t.type === 'expense' && t.category_id === c.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: c.name, amount, color: c.color || '#ef4444' };
    })
    .filter(c => c.amount > 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#332a54]">Financial Analytics & Visual Insights</h2>
        <p className="text-xs text-[#8b849c]">Comprehensive breakdown of cash inflows, outflows, and category spending distributions</p>
      </div>

      {/* Main Bar Chart */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <h3 className="text-base font-extrabold text-[#332a54] mb-4">Monthly Income vs Expenses Comparison</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBarData.length > 0 ? monthlyBarData : [{ month: 'Current', Income: totalIncome, Expenses: totalExpense }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2f2" vertical={false} />
              <XAxis dataKey="month" stroke="#4c416e" fontSize={12} fontWeight={700} tickLine={false} dy={6} />
              <YAxis
                stroke="#4c416e"
                fontSize={12}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${currencySymbol}${(v / 1000).toFixed(0)}k` : `${currencySymbol}${v}`)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#6e44ff20', borderRadius: '16px', fontSize: '12px', color: '#332a54', fontWeight: 'bold', boxShadow: '0 10px 25px -5px rgba(110,68,255,0.15)' }}
                formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
          <h3 className="text-base font-extrabold text-[#332a54] mb-2">Expense Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoriesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="amount"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {expenseCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e9e4f3', borderRadius: '16px', fontSize: '12px', color: '#332a54', boxShadow: '0 10px 25px -5px rgba(110,68,255,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Expense Categories Table */}
        <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
          <h3 className="text-base font-extrabold text-[#332a54] mb-4">Top Spending Categories</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {expenseCategoriesData.sort((a, b) => b.amount - a.amount).map((item, idx) => {
              const percent = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-[#332a54] font-bold">{item.name}</span>
                    </div>
                    <span className="font-mono text-[#332a54] font-bold">{currencySymbol}{item.amount.toLocaleString()} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#f4f0f8] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
