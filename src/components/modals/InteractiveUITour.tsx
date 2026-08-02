import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

interface InteractiveUITourProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onNavigateTab: (tab: string) => void;
}

export const InteractiveUITour: React.FC<InteractiveUITourProps> = ({
  isOpen,
  onClose,
  currentTab,
  onNavigateTab
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const tourSteps = [
    {
      id: 'dashboard-overview',
      tab: 'dashboard',
      title: '1. Financial Dashboard & Balance Card',
      subtitle: 'Real-time account balance & monthly income overview',
      icon: LayoutDashboard,
      iconBg: 'bg-[#6e44ff] text-white',
      description:
        'This is your main command center. Here you can see your live available balance, monthly income, total budget spent, and an instant visual progress bar of your spending limit.',
      highlights: [
        'Live Available Balance & masked card number',
        'Monthly Income & Expense budget progress bar',
        'Recent Payment activity & category breakdown'
      ]
    },
    {
      id: 'expenses-chart',
      tab: 'dashboard',
      title: '2. Expense Statistics & Visual Trends',
      subtitle: 'Interactive cash burn area chart',
      icon: BarChart3,
      iconBg: 'bg-indigo-600 text-white',
      description:
        'The Expense Statistics chart renders your cash burn visually over time. Use the timeframe dropdown filter to analyze spending trends grouped by Day, Week, or Month.',
      highlights: [
        'Group data by Day, Week, or Month timeframe',
        'Hover over points for exact expense totals',
        'Identify high-spending peak days easily'
      ]
    },
    {
      id: 'transactions-ledger',
      tab: 'transactions',
      title: '3. Transaction Ledger & Statement Import',
      subtitle: 'Manual entries, search filters & CSV/Excel upload',
      icon: Receipt,
      iconBg: 'bg-emerald-600 text-white',
      description:
        'Manage your full financial ledger. Use the search bar to query descriptions or merchants, filter by income/expense categories, or click "Import" to upload bank statements in bulk.',
      highlights: [
        'Click "+ Record Entry" to log income or expenses',
        'Upload Excel/CSV bank statements via "Import"',
        'Export clean transaction logs for tax & accounting'
      ]
    },
    {
      id: 'budgets-caps',
      tab: 'budgets',
      title: '4. Budgets & Category Caps',
      subtitle: 'Prevent overspending with active caps',
      icon: Target,
      iconBg: 'bg-amber-500 text-white',
      description:
        'Set spending limits for categories like Groceries, Rent, or Entertainment. Track real-time progress bars and receive alerts before you exceed your budget.',
      highlights: [
        'Create weekly, monthly, or custom budget caps',
        'Visual color-coded spending progress indicators',
        'Low-balance warnings when spending nears budget cap'
      ]
    },
    {
      id: 'predictive-ai',
      tab: 'predictions',
      title: '5. AI Predictive Sustainability Engine',
      subtitle: 'Cash flow forecasting & risk assessment',
      icon: TrendingUp,
      iconBg: 'bg-purple-600 text-white',
      description:
        'TrackFi analyzes your 30-day trailing daily burn rate to calculate a Sustainability Score (0-100), risk assessment (Low, Moderate, High), and projected balance over 7 to 90-day horizons.',
      highlights: [
        'Calculates your average net daily burn rate',
        'Provides an explainable Sustainability Score (0 - 100)',
        'Forecasts cash exhaustion dates if daily burn exceeds income'
      ]
    },
    {
      id: 'reports-export',
      tab: 'reports',
      title: '6. Reports & PDF Statement Export',
      subtitle: 'Generate clean financial reports',
      icon: FileSpreadsheet,
      iconBg: 'bg-cyan-600 text-white',
      description:
        'Need to share your financial records with an accountant or keep a record? Generate formatted PDF financial statements or download CSV data files with a single click.',
      highlights: [
        'Download formatted PDF Financial Statements',
        'View monthly category summary tables',
        'Export CSV raw data for spreadsheet tools'
      ]
    }
  ];

  const activeStep = tourSteps[currentStepIndex];
  const StepIcon = activeStep.icon;

  // Auto switch application tab when step changes
  useEffect(() => {
    if (isOpen && activeStep.tab) {
      onNavigateTab(activeStep.tab);
    }
  }, [isOpen, currentStepIndex, activeStep.tab]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleCompleteTour();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleCompleteTour = () => {
    localStorage.setItem('intellibudget_onboarding_completed', 'true');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col justify-end sm:justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Semi-transparent Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#332a54]/40 backdrop-blur-[2px] pointer-events-auto transition-opacity"
        onClick={handleCompleteTour}
      />

      {/* Floating Interactive Tour Spotlight Banner Card */}
      <div className="relative z-10 w-full max-w-lg mx-auto bg-white border border-purple-100 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto animate-scaleUp">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#6e44ff] text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 fill-white" />
            <span className="text-xs font-black uppercase tracking-wider">Step-by-Step UI Tour</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              {currentStepIndex + 1} / {tourSteps.length}
            </span>
            <button
              onClick={handleCompleteTour}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition"
              title="Exit Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tour Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Step Icon + Title */}
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl ${activeStep.iconBg} shadow-md shrink-0`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#6e44ff] tracking-wider">
                {activeStep.subtitle}
              </span>
              <h3 className="text-lg font-extrabold text-[#332a54] leading-tight">{activeStep.title}</h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[#8b849c] leading-relaxed bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100/80">
            {activeStep.description}
          </p>

          {/* Key UI Highlights */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold uppercase text-[#332a54] tracking-wider">Interface Highlights:</h4>
            <div className="space-y-1.5">
              {activeStep.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#332a54] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-purple-50 bg-slate-50/80 flex items-center justify-between">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed text-[#8b849c]'
                : 'text-[#8b849c] hover:text-[#332a54] hover:bg-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-5 bg-[#6e44ff]'
                    : 'w-2 bg-purple-200 hover:bg-purple-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompleteTour}
              className="text-xs font-bold text-[#8b849c] hover:text-[#332a54] px-2 py-1"
            >
              Exit
            </button>
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#6e44ff] hover:bg-[#5b32e0] text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition active:scale-95"
            >
              <span>{currentStepIndex === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
