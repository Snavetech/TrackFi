import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinancial } from '../../context/FinancialContext';
import { TransactionType } from '../../types';
import { X, Tag } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const { addCategory } = useFinancial();

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Tag');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCategory({
      name,
      type,
      color,
      icon,
    });

    onClose();
    setName('');
  };

  const presetColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 bg-[#f4f0f8]/50 shrink-0">
          <div className="flex items-center gap-3 text-[#332a54] font-extrabold text-lg">
            <Tag className="w-5 h-5 text-[#6e44ff]" />
            <span>Create Custom Category</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-purple-50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-purple-50/50 border border-purple-100">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-xl transition ${type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-[#8b849c] hover:text-[#332a54]'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-xl transition ${type === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-[#8b849c] hover:text-[#332a54]'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Subscriptions, Investments, Pet Care"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-medium focus:outline-none focus:border-[#6e44ff]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-2">Category Color</label>
            <div className="flex items-center gap-2">
              {presetColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-[#332a54] scale-110' : 'border-transparent opacity-80'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-lg bg-transparent cursor-pointer border-0"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-purple-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-[#8b849c] hover:text-[#332a54] transition">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl font-bold text-xs shadow-md shadow-purple-500/20 transition active:scale-95">
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
