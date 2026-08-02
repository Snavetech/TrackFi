import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { PeriodType } from '../../types';
import { X, Target } from 'lucide-react';
import { format, addMonths } from 'date-fns';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose }) => {
  const { categories, addBudget } = useFinancial();
  const { currencySymbol } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState<string>(''); // null = overall budget
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    addBudget({
      title: title || 'Monthly Budget',
      amount: parsedAmount,
      period_type: periodType,
      start_date: startDate,
      end_date: endDate,
      category_id: categoryId || null,
      notes,
    });

    onClose();
    setTitle('');
    setAmount('');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 bg-[#f4f0f8]/50 shrink-0">
          <div className="flex items-center gap-3 text-[#332a54] font-extrabold text-lg">
            <Target className="w-5 h-5 text-[#6e44ff]" />
            <span>Create Spending Budget</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-purple-50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Budget Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Grocery Cap, Travel Allowance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff] transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Target Limit ({currencySymbol})</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] font-mono text-sm font-bold focus:outline-none focus:border-[#6e44ff] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Period Type</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Category Scope</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
              >
                <option value="">All Expense Categories (Overall)</option>
                {categories.filter(c => c.type === 'expense').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Start Date (Select from Calendar)</label>
              <input
                type="date"
                required
                value={startDate}
                onClick={(e) => (e.target as any).showPicker?.()}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">End Date (Select from Calendar)</label>
              <input
                type="date"
                required
                value={endDate}
                onClick={(e) => (e.target as any).showPicker?.()}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Notes / Description</label>
            <input
              type="text"
              placeholder="Optional notes or guidelines"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-purple-50">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-[#8b849c] hover:text-[#332a54] transition">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-semibold shadow-md shadow-purple-500/20 transition active:scale-95">
              Save Budget
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
