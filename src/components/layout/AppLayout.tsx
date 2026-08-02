import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TransactionModal } from '../modals/TransactionModal';
import { InteractiveUITour } from '../modals/InteractiveUITour';
import { LayoutDashboard, Receipt, Target, TrendingUp, Menu, Plus } from 'lucide-react';

interface AppLayoutProps {
  children: (tabProps: { currentTab: string; setCurrentTab: (tab: string) => void }) => React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    const isCompleted = localStorage.getItem('intellibudget_onboarding_completed');
    if (!isCompleted) {
      // Auto-open step-by-step UI tour for first-time users
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const tabTitles: Record<string, string> = {
    dashboard: 'Financial Dashboard',
    transactions: 'Transaction Ledger',
    budgets: 'Budgets & Expense Caps',
    savings: 'Savings Goals & Vaults',
    predictions: 'Predictive Sustainability Engine',
    analytics: 'Financial Analytics & Trends',
    reports: 'Reports & Statement Export',
    categories: 'Categories & Custom Tags',
    settings: 'Profile & System Preferences',
  };

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'predictions', label: 'Forecast', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen flex bg-[#f4f0f8] text-[#332a54]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenTutorial={() => setIsTourOpen(true)}
        />
      </div>

      {/* Mobile Slide-Over Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative z-10 w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col">
            <Sidebar
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
              onOpenTutorial={() => setIsTourOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <Header
          pageTitle={tabTitles[currentTab] || 'Dashboard'}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenTutorial={() => setIsTourOpen(true)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children({ currentTab, setCurrentTab })}
        </main>
      </div>

      {/* Mobile Floating Action Button (FAB) for Add Transaction */}
      <button
        onClick={() => setIsTxModalOpen(true)}
        className="md:hidden fixed bottom-16 right-4 z-40 w-12 h-12 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-full shadow-2xl shadow-purple-600/40 flex items-center justify-center border-2 border-white transition active:scale-90"
        aria-label="Add Transaction"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#e8e2f2] flex items-center justify-around py-2 px-1 shadow-lg">
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition ${isActive ? 'text-[#6e44ff] font-bold' : 'text-[#8b849c] hover:text-[#332a54]'}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        {/* Mobile "More" Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition text-[#8b849c] hover:text-[#332a54]`}
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>

      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} />

      <InteractiveUITour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentTab={currentTab}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
};


