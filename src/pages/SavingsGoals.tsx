import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { SavingsGoalModal } from '../components/modals/SavingsGoalModal';
import { PiggyBank, Plus, Trash2, Calendar, CheckCircle2, ArrowUpRight, X } from 'lucide-react';

export const SavingsGoals: React.FC = () => {
  const { savingsGoals, depositSavingsGoal, deleteSavingsGoal } = useFinancial();
  const { currencySymbol } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    depositSavingsGoal(depositGoalId, amount);
    setDepositGoalId(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#332a54]">Savings Vaults & Goals</h2>
          <p className="text-xs text-[#8b849c]">Allocate funds towards future financial milestones and emergency reserves</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-purple-100/80 text-[#8b849c] shadow-sm">
            <PiggyBank className="w-12 h-12 mx-auto mb-3 text-emerald-600/40" />
            <p className="font-bold text-[#332a54]">No savings goals created yet.</p>
          </div>
        ) : (
          savingsGoals.map(goal => {
            const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const isCompleted = goal.current_amount >= goal.target_amount;

            return (
              <div key={goal.id} className="relative p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 font-mono">Savings Vault</span>
                    <h3 className="text-lg font-extrabold text-[#332a54] mt-0.5">{goal.name}</h3>
                  </div>
                  <button onClick={() => deleteSavingsGoal(goal.id)} className="p-1.5 text-[#8b849c] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#8b849c]">Saved: <strong className="text-emerald-600 font-mono">{currencySymbol}{goal.current_amount.toLocaleString()}</strong></span>
                    <span className="text-[#8b849c]">Target: <strong className="text-[#332a54] font-mono">{currencySymbol}{goal.target_amount.toLocaleString()}</strong></span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-[#f4f0f8] p-0.5 border border-purple-50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-emerald-600'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 font-bold">{percent}% Complete</span>
                    {goal.deadline && <span className="text-[#8b849c] flex items-center gap-1"><Calendar className="w-3 h-3" /> {goal.deadline}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-purple-50 flex items-center justify-between">
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Goal Fully Achieved!</span>
                  ) : (
                    <button
                      onClick={() => setDepositGoalId(goal.id)}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Add Funds to Goal</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deposit Modal Prompt */}
      {depositGoalId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/40 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white border border-purple-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#332a54]">Add Funds to Savings Goal</h3>
              <button onClick={() => setDepositGoalId(null)} className="p-1 rounded-lg text-[#8b849c] hover:text-[#332a54]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Deposit Amount ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] font-mono text-sm font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDepositGoalId(null)} className="px-4 py-2 text-xs font-bold text-[#8b849c]">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20">Confirm Deposit</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <SavingsGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
