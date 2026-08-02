import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { exportFinancialReportPDF, exportTransactionsCSV } from '../lib/exportUtils';
import { FileSpreadsheet, Download, FileText, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

export const Reports: React.FC = () => {
  const { transactions, categories, budgets, savingsGoals, prediction, totalIncome, totalExpense, currentBalance } = useFinancial();
  const { user, currencySymbol } = useAuth();

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Filter transactions within range (inclusive YYYY-MM-DD string comparison)
  const rangeTransactions = transactions.filter(t => {
    return t.date >= startDate && t.date <= endDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const rangeIncome = rangeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const rangeExpense = rangeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const rangeNet = rangeIncome - rangeExpense;

  const handleDownloadPDF = () => {
    exportFinancialReportPDF({
      userName: user?.full_name || 'Ismail Alabi',
      currencySymbol,
      transactions: rangeTransactions,
      categories,
      budgets,
      savingsGoals,
      prediction,
      startDate,
      endDate,
    });
  };

  const handleDownloadCSV = () => {
    exportTransactionsCSV(rangeTransactions, categories, currencySymbol);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#332a54]">Financial Reports & Statement Export</h2>
          <p className="text-xs text-[#8b849c]">Generate, customize, and export official PDF statement reports and CSV raw data</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-purple-50">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8b849c] font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onClick={(e) => (e.target as any).showPicker?.()}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff] cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8b849c] font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onClick={(e) => (e.target as any).showPicker?.()}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Report Summary Card */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-[#332a54]">Statement Preview ({startDate} to {endDate})</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs text-[#8b849c] font-bold">Period Income</span>
            <p className="text-xl font-extrabold font-mono text-emerald-600 mt-1">{currencySymbol}{rangeIncome.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs text-[#8b849c] font-bold">Period Expenses</span>
            <p className="text-xl font-extrabold font-mono text-rose-600 mt-1">{currencySymbol}{rangeExpense.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
            <span className="text-xs text-[#8b849c] font-bold">Net Surplus / Deficit</span>
            <p className={`text-xl font-extrabold font-mono mt-1 ${rangeNet >= 0 ? 'text-[#6e44ff]' : 'text-rose-600'}`}>
              {rangeNet < 0 ? '-' : ''}{currencySymbol}{Math.abs(rangeNet).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-purple-50">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-[#6e44ff] hover:bg-[#5b32e0] text-white font-bold rounded-2xl text-xs shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Export Official PDF Report</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-6 py-3 bg-purple-50 hover:bg-purple-100 text-[#6e44ff] font-bold rounded-2xl text-xs border border-purple-100 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-[#6e44ff]" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
