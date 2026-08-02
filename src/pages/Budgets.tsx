import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { BudgetModal } from '../components/modals/BudgetModal';
import { Target, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Budgets: React.FC = () => {
  const { budgets, transactions, categories, deleteBudget } = useFinancial();
  const { currencySymbol } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#332a54]">Budget Management</h2>
          <p className="text-xs text-[#8b849c]">Track budgeted spend limits against live transaction totals</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Budget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-purple-100/80 text-[#8b849c] shadow-sm">
            <Target className="w-12 h-12 mx-auto mb-3 text-[#6e44ff]/40" />
            <p className="font-bold text-[#332a54]">No active spending budgets set up.</p>
            <p className="text-xs text-[#8b849c] mt-1">Click "Create Budget" above to start capping your expenses.</p>
          </div>
        ) : (
          budgets.map(b => {
            const cat = b.category_id ? categoryMap.get(b.category_id) : null;
            const spent = transactions
              .filter(t => t.type === 'expense' && (!b.category_id || t.category_id === b.category_id))
              .reduce((sum, t) => sum + t.amount, 0);

            const percent = Math.min(100, Math.round((spent / b.amount) * 100));
            const isOver = spent > b.amount;
            const isWarning = percent >= 90 && !isOver;

            return (
              <div key={b.id} className="relative overflow-hidden p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6e44ff] font-mono">
                      {b.period_type} • {cat ? cat.name : 'Overall Expenses'}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#332a54] mt-0.5">{b.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteBudget(b.id)}
                    className="p-1.5 text-[#8b849c] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Visual */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8b849c] font-medium">Spent: <strong className="text-[#332a54] font-mono">{currencySymbol}{spent.toLocaleString()}</strong></span>
                    <span className="text-[#8b849c] font-medium">Limit: <strong className="text-[#332a54] font-mono">{currencySymbol}{b.amount.toLocaleString()}</strong></span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-[#f4f0f8] p-0.5 border border-purple-50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-[#6e44ff]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {percent}% Used
                    </span>
                    <span className="text-[#8b849c]">
                      {isOver ? `Over by ${currencySymbol}${(spent - b.amount).toLocaleString()}` : `${currencySymbol}${(b.amount - spent).toLocaleString()} left`}
                    </span>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="pt-3 border-t border-purple-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {isOver ? (
                      <span className="flex items-center gap-1 text-rose-600 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Budget Exceeded</span>
                    ) : isWarning ? (
                      <span className="flex items-center gap-1 text-amber-600 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Near Limit</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> On Track</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8b849c]">{b.start_date} to {b.end_date}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
