import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { X, PiggyBank } from 'lucide-react';
import { format, addMonths } from 'date-fns';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({ isOpen, onClose }) => {
  const { addSavingsGoal } = useFinancial();
  const { currencySymbol } = useAuth();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [deadline, setDeadline] = useState(format(addMonths(new Date(), 6), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) return;

    addSavingsGoal({
      name,
      target_amount: parsedTarget,
      current_amount: parseFloat(initialAmount) || 0,
      deadline,
      notes,
    });

    onClose();
    setName('');
    setTargetAmount('');
    setInitialAmount('');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 bg-[#f4f0f8]/50 shrink-0">
          <div className="flex items-center gap-3 text-[#332a54] font-extrabold text-lg">
            <PiggyBank className="w-5 h-5 text-emerald-600" />
            <span>Create Savings Goal</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-purple-50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Goal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Fund, New Laptop, Holiday Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Target Amount ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] font-mono text-sm font-bold focus:outline-none focus:border-[#6e44ff] transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Initial Deposit ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] font-mono text-sm font-bold focus:outline-none focus:border-[#6e44ff] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Target Deadline (Select from Calendar)</label>
            <input
              type="date"
              value={deadline}
              onClick={(e) => (e.target as any).showPicker?.()}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Notes</label>
            <input
              type="text"
              placeholder="Why are you saving for this?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-purple-50">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-[#8b849c] hover:text-[#332a54] transition">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition active:scale-95">
              Start Goal
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
