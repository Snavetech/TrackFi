import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { CategoryModal } from '../components/modals/CategoryModal';
import { Tag, Plus, Trash2 } from 'lucide-react';

export const Categories: React.FC = () => {
  const { categories, deleteCategory } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#332a54]">Category Management</h2>
          <p className="text-xs text-[#8b849c]">Organize transactions into custom categorized tags with color coding</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Expense Categories */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-[#8b849c] uppercase tracking-wider">Expense Categories ({expenseCategories.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map(c => (
            <div key={c.id} className="p-4 rounded-2xl bg-white border border-purple-100/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.color || '#ef4444' }} />
                <span className="text-xs font-bold text-[#332a54]">{c.name}</span>
              </div>
              <button onClick={() => deleteCategory(c.id)} className="p-1.5 text-[#8b849c] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-[#8b849c] uppercase tracking-wider">Income Categories ({incomeCategories.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map(c => (
            <div key={c.id} className="p-4 rounded-2xl bg-white border border-purple-100/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.color || '#10b981' }} />
                <span className="text-xs font-bold text-[#332a54]">{c.name}</span>
              </div>
              <button onClick={() => deleteCategory(c.id)} className="p-1.5 text-[#8b849c] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
