import React, { useState, useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { TransactionModal } from '../components/modals/TransactionModal';
import { ImportTransactionsModal } from '../components/modals/ImportTransactionsModal';
import { exportTransactionsCSV } from '../lib/exportUtils';
import { isCorruptedTransaction } from '../lib/importUtils';
import {
  Plus,
  Search,
  Filter,
  Download,
  UploadCloud,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  AlertTriangle
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const { transactions, categories, deleteTransaction, clearCorruptedTransactions, clearAllTransactions } = useFinancial();
  const { currencySymbol } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const corruptedCount = useMemo(() => {
    return transactions.filter(isCorruptedTransaction).length;
  }, [transactions]);

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Filtered & Sorted transactions list (Most recent first)
  const sortedAndFilteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        // Type match
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        // Category match
        if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false;
        // Search match
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const descMatch = (t.description || '').toLowerCase().includes(query);
          const catMatch = t.category_id ? (categoryMap.get(t.category_id)?.name || '').toLowerCase().includes(query) : false;
          const amountMatch = t.amount.toString().includes(query);
          if (!descMatch && !catMatch && !amountMatch) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, categoryFilter, searchQuery, categoryMap]);

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Corrupted Data Alert Banner */}
      {corruptedCount > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-2xl text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs">Corrupted Transactions Detected</p>
              <p className="text-[11px] text-amber-700">
                Found {corruptedCount} corrupted record{corruptedCount > 1 ? 's' : ''} from a previous unparsed binary upload.
              </p>
            </div>
          </div>
          <button
            onClick={clearCorruptedTransactions}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition shadow-sm shrink-0"
          >
            Clean Up Corrupted Entries ({corruptedCount})
          </button>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8b849c]" />
          <input
            type="text"
            placeholder="Search description, merchant, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs focus:outline-none focus:border-[#6e44ff]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3.5 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs focus:outline-none focus:border-[#6e44ff] font-medium"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs focus:outline-none focus:border-[#6e44ff] font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Import CSV / Excel Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-[#6e44ff] rounded-2xl text-xs font-semibold border border-purple-100 transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#6e44ff]" />
            <span>Import</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={() => exportTransactionsCSV(sortedAndFilteredTransactions, categories, currencySymbol)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-[#6e44ff] rounded-2xl text-xs font-semibold border border-purple-100 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Clear All Entries Button */}
          {transactions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all transactions to start fresh with your imported file?')) {
                  clearAllTransactions();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-semibold border border-rose-100 transition"
              title="Clear all transaction entries"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Ledger</span>
            </button>
          )}

          {/* Add Transaction Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-semibold shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#332a54]">
            <thead className="bg-[#f4f0f8]/60 border-b border-purple-50 uppercase text-[11px] font-bold text-[#8b849c] tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {sortedAndFilteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#8b849c]">
                    No matching transaction records found.
                  </td>
                </tr>
              ) : (
                sortedAndFilteredTransactions.map(t => {
                  const cat = t.category_id ? categoryMap.get(t.category_id) : null;
                  return (
                    <tr key={t.id} className="hover:bg-purple-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-[#332a54]">
                              {(!t.description || t.description.trim() === '' || t.description === '--' || t.description === '-') ? 'Imported Transaction' : t.description}
                            </p>
                            {t.is_recurring && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#6e44ff] font-semibold">
                                <Repeat className="w-3 h-3" /> Recurring ({t.recurrence_interval})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cat ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border" style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}30`, color: cat.color }}>
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-[#8b849c]">General</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-[#8b849c]">{t.date}</td>
                      <td className="px-6 py-4 text-[#8b849c] font-medium">{t.payment_method || 'N/A'}</td>
                      <td className={`px-6 py-4 text-right font-mono font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-[#332a54]'}`}>
                        {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="p-1.5 text-[#8b849c] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ImportTransactionsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
};
