import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { PeriodType } from '../../types';
import { X, Target, Plus, Tag } from 'lucide-react';
import { format, addMonths } from 'date-fns';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose }) => {
  const { categories, addBudget, addCategory } = useFinancial();
  const { currencySymbol } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState<string>(''); // null = overall budget
  const [notes, setNotes] = useState('');

  // Inline Custom Category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [isCreatingCatLoading, setIsCreatingCatLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateCategory = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreatingCatLoading(true);
    try {
      const created = await addCategory({
        name: newCatName.trim(),
        type: 'expense',
        color: newCatColor,
        icon: 'Tag',
      });
      if (created) {
        setCategoryId(created.id);
      }
      setNewCatName('');
      setIsCreatingCategory(false);
    } catch (err) {
      console.error('Failed to create custom category:', err);
    } finally {
      setIsCreatingCatLoading(false);
    }
  };

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-extrabold uppercase text-[#8b849c]">Category Scope</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-[10px] font-extrabold text-[#6e44ff] hover:text-[#5b32e0] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isCreatingCategory ? 'Cancel' : '+ New Category'}</span>
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setIsCreatingCategory(true);
                  } else {
                    setCategoryId(e.target.value);
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
              >
                <option value="">All Expense Categories (Overall)</option>
                {categories.filter(c => c.type === 'expense').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new__">+ Create Special Category...</option>
              </select>
            </div>
          </div>

          {/* Inline Custom Category Creator */}
          {isCreatingCategory && (
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#332a54] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#6e44ff]" />
                  <span>Create Special Category for this Budget</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="p-1 rounded-lg text-[#8b849c] hover:text-[#332a54]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Vacation, Tuition, Emergency)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-[#332a54] focus:outline-none focus:border-[#6e44ff]"
                />
                <button
                  type="button"
                  disabled={!newCatName.trim() || isCreatingCatLoading}
                  onClick={handleCreateCategory}
                  className="px-4 py-2 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isCreatingCatLoading ? 'Creating...' : 'Create & Apply'}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] text-[#8b849c] font-semibold">Choose Color:</span>
                {['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className={`w-4 h-4 rounded-full border transition cursor-pointer ${newCatColor === c ? 'border-[#332a54] scale-125 shadow-xs' : 'border-transparent opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

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
