import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Receipt,
  Target,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'welcome',
      icon: Sparkles,
      iconBg: 'bg-purple-50 text-[#6e44ff] border-purple-100',
      badge: 'Welcome to TrackFi',
      title: 'Your Intelligent Financial Sustainability Platform',
      description:
        'TrackFi empowers you to take full control of your money with real-time budget tracking, intelligent category breakdowns, and AI-driven predictive cash-flow forecasting.',
      features: [
        'Real-time cash flow & balance tracking',
        'Category budget limits with warning notifications',
        'Predictive sustainability scores & burn rate analysis',
        'CSV/Excel bank statement bulk import & PDF reports'
      ],
      tabTarget: 'dashboard'
    },
    {
      id: 'transactions',
      icon: Receipt,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'Step 1: Ledger & Tracking',
      title: 'Record Entries & Bulk Statement Imports',
      description:
        'Keep an accurate record of all your incoming revenues and outgoing expenses with tag categorization and payment method metadata.',
      features: [
        'Click "+ Add" or the floating action button to log transactions',
        'Support for recurring subscriptions & income payments',
        'Bulk import bank statements directly from CSV or Excel files',
        'Filter and search transaction history instantly'
      ],
      tabTarget: 'transactions'
    },
    {
      id: 'budgets',
      icon: Target,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'Step 2: Budget Caps',
      title: 'Define Weekly & Monthly Expense Limits',
      description:
        'Set spending caps for specific categories or overall monthly budgets to prevent overspending before it happens.',
      features: [
        'Custom weekly, monthly, or custom period budget caps',
        'Automated progress bars tracking spent vs limit',
        'Low-balance and threshold warnings when approaching budget limits'
      ],
      tabTarget: 'budgets'
    },
    {
      id: 'predictions',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'Step 3: Predictive AI',
      title: 'Cash Flow Forecast & Sustainability Scoring',
      description:
        'TrackFi evaluates your 30-day trailing burn rate to project your future account balance across 7, 30, or 90-day horizons.',
      features: [
        'Sustainability Score (0 - 100) indicating cash flow health',
        'Explainable risk levels: Low (Sustainable), Moderate, or High',
        'Estimated cash exhaustion date alert if daily burn exceeds income'
      ],
      tabTarget: 'predictions'
    },
    {
      id: 'reports',
      icon: FileSpreadsheet,
      iconBg: 'bg-[#f4f0f8] text-[#6e44ff] border-purple-200',
      badge: 'Step 4: Analytics & Export',
      title: 'Visual Trends & Statement Export',
      description:
        'Gain deep insight into your spending patterns with interactive visual charts, category statistics, and PDF statement generation.',
      features: [
        'Interactive Area Charts grouped by Day, Week, or Month',
        'Export clean financial statements in CSV or PDF formats',
        'Custom category manager and currency preferences'
      ],
      tabTarget: 'analytics'
    }
  ];

  const activeStep = steps[currentStep];
  const Icon = activeStep.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('intellibudget_onboarding_completed', 'true');
    onClose();
    if (onNavigateTab && activeStep.tabTarget) {
      onNavigateTab('dashboard');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 bg-[#f4f0f8]/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#6e44ff] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <span className="text-sm font-extrabold text-[#332a54]">TrackFi Quick Start Guide</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-[#8b849c]">
              {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleComplete}
              className="p-1.5 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-purple-50 transition"
              title="Close Tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Badge & Step Indicator Pills */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${activeStep.iconBg}`}>
              {activeStep.badge}
            </span>

            {/* Progress Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-6 bg-[#6e44ff]'
                      : idx < currentStep
                      ? 'w-2 bg-purple-300'
                      : 'w-2 bg-purple-100'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Main Title & Description */}
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl border ${activeStep.iconBg} shrink-0 shadow-sm`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#332a54] leading-tight">{activeStep.title}</h2>
                <p className="text-xs text-[#8b849c] leading-relaxed mt-1.5">{activeStep.description}</p>
              </div>
            </div>
          </div>

          {/* Feature List Checklist */}
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-100/80 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase text-[#6e44ff] tracking-wider mb-3">Key Features & Tips</h4>
            {activeStep.features.map((feat, fIdx) => (
              <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#332a54]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Control Actions Footer */}
        <div className="px-6 py-4 border-t border-purple-50 bg-slate-50/50 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed text-[#8b849c]'
                : 'text-[#8b849c] hover:text-[#332a54] hover:bg-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-3">
            {currentStep < steps.length - 1 && (
              <button
                onClick={handleComplete}
                className="px-4 py-2.5 text-xs font-bold text-[#8b849c] hover:text-[#332a54] transition"
              >
                Skip Tutorial
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white font-bold rounded-2xl text-xs shadow-md shadow-purple-500/20 transition active:scale-95"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}</span>
              {currentStep === steps.length - 1 ? (
                <Sparkles className="w-4 h-4 fill-white" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
