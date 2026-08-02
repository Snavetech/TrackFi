import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionType, RecurrenceInterval } from '../../types';
import { X, Plus, DollarSign, Calendar, Tag, CreditCard, Repeat, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, initialType = 'expense' }) => {
  const { categories, addTransaction, currentBalance } = useFinancial();
  const { currencySymbol } = useAuth();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>('monthly');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  const parsedAmount = parseFloat(amount);
  const isInsufficient = type === 'expense' && !isNaN(parsedAmount) && parsedAmount > currentBalance;

  const handleTypeToggle = (newType: TransactionType) => {
    setType(newType);
    setError(null);
    const validCats = categories.filter(c => c.type === newType);
    if (validCats.length > 0) {
      setCategoryId(validCats[0].id);
    } else {
      setCategoryId('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (type === 'expense' && parsedAmount > currentBalance) {
      setError(`Insufficient Funds: Expense amount (${currencySymbol}${parsedAmount.toLocaleString()}) exceeds your available balance (${currencySymbol}${Math.max(0, currentBalance).toLocaleString()}).`);
      return;
    }

    const validCats = categories.filter(c => c.type === type);
    const selectedCatId = categoryId && validCats.some(c => c.id === categoryId)
      ? categoryId
      : (validCats[0]?.id || null);

    const success = addTransaction({
      type,
      amount: parsedAmount,
      category_id: selectedCatId,
      date,
      description: description.trim() || (type === 'income' ? 'Income Record' : 'Expense Record'),
      payment_method: paymentMethod,
      is_recurring: isRecurring,
      recurrence_interval: isRecurring ? recurrenceInterval : null,
    });

    if (!success) {
      setError(`Insufficient Funds: Expense amount exceeds your available balance (${currencySymbol}${Math.max(0, currentBalance).toLocaleString()}).`);
      return;
    }

    onClose();
    // Reset form
    setAmount('');
    setDescription('');
    setError(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 bg-[#f4f0f8]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#332a54]">Record New Entry</h2>
              <p className="text-[11px] text-[#8b849c]">Add income or expense transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-purple-50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Insufficient Funds Error Banner */}
          {(error || isInsufficient) && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-medium">
                <span className="font-bold block text-rose-800 mb-0.5">Transaction Validation</span>
                {error || `Expense amount (${currencySymbol}${parsedAmount.toLocaleString()}) exceeds your available balance (${currencySymbol}${Math.max(0, currentBalance).toLocaleString()}). Transaction cannot be submitted.`}
              </div>
            </div>
          )}

          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-purple-50/70 border border-purple-100">
            <button
              type="button"
              onClick={() => handleTypeToggle('expense')}
              className={`py-2.5 text-xs font-bold rounded-xl transition ${type === 'expense' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-[#8b849c] hover:text-[#332a54]'}`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle('income')}
              className={`py-2.5 text-xs font-bold rounded-xl transition ${type === 'income' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-[#8b849c] hover:text-[#332a54]'}`}
            >
              Income (+)
            </button>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-[#8b849c]">Amount ({currencySymbol})</label>
              <span className="text-[11px] font-semibold text-[#8b849c]">
                Available: <span className={currentBalance <= 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{currencySymbol}{currentBalance.toLocaleString()}</span>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-[#6e44ff] font-mono text-lg font-bold">{currencySymbol}</span>
              <input
                type="number"
                step="100"
                min="0"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-[#332a54] font-mono text-lg font-bold focus:outline-none transition ${
                  isInsufficient ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-purple-100 focus:border-[#6e44ff]'
                }`}
              />
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#8b849c] mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-medium focus:outline-none focus:border-[#6e44ff]"
              >
                <option value="">Select Category</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#8b849c] mb-1">Date (Select from Calendar)</label>
              <input
                type="date"
                required
                value={date}
                onClick={(e) => (e.target as any).showPicker?.()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff] cursor-pointer"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-[#8b849c] mb-1">Description / Merchant</label>
            <input
              type="text"
              placeholder="e.g. Grocery store, Salary payout, Electricity bill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-medium focus:outline-none focus:border-[#6e44ff]"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold uppercase text-[#8b849c] mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-medium focus:outline-none focus:border-[#6e44ff]"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Mobile Wallet">Mobile Wallet</option>
            </select>
          </div>

          {/* Recurring Option */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="flex items-center gap-2 text-xs text-[#332a54] font-bold">
              <Repeat className="w-4 h-4 text-[#6e44ff]" />
              <span>Is this a recurring transaction?</span>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded-md text-[#6e44ff] focus:ring-[#6e44ff] accent-[#6e44ff]"
            />
          </div>

          {isRecurring && (
            <div>
              <label className="block text-xs font-bold uppercase text-[#8b849c] mb-1">Recurrence Interval</label>
              <select
                value={recurrenceInterval || 'monthly'}
                onChange={(e) => setRecurrenceInterval(e.target.value as RecurrenceInterval)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-medium"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-purple-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-[#8b849c] hover:text-[#332a54] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInsufficient || !amount || parsedAmount <= 0}
              className={`px-6 py-2.5 rounded-2xl font-bold text-xs text-white shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
              }`}
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
