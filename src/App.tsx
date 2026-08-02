import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import { AppLayout } from './components/layout/AppLayout';

import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { SavingsGoals } from './pages/SavingsGoals';
import { Predictions } from './pages/Predictions';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { Categories } from './pages/Categories';
import { Settings } from './pages/Settings';

import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');

  if (!isAuthenticated) {
    if (authView === 'signup') {
      return <SignUp onNavigateLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return <ForgotPassword onNavigateLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onNavigateSignUp={() => setAuthView('signup')}
        onNavigateForgotPassword={() => setAuthView('forgot')}
      />
    );
  }

  return (
    <FinancialProvider>
      <AppLayout>
        {({ currentTab, setCurrentTab }) => {
          switch (currentTab) {
            case 'dashboard':
              return <Dashboard onNavigate={setCurrentTab} />;
            case 'transactions':
              return <Transactions />;
            case 'budgets':
              return <Budgets />;
            case 'savings':
              return <SavingsGoals />;
            case 'predictions':
              return <Predictions />;
            case 'analytics':
              return <Analytics />;
            case 'reports':
              return <Reports />;
            case 'categories':
              return <Categories />;
            case 'settings':
              return <Settings />;
            default:
              return <Dashboard onNavigate={setCurrentTab} />;
          }
        }}
      </AppLayout>
    </FinancialProvider>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TrackFi Application Error Boundary Caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('intellibudget_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f0f8] text-[#332a54] font-sans">
          <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-purple-100 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-[#332a54]">Something went wrong</h2>
              <p className="text-xs text-[#8b849c] font-semibold">
                An unexpected error occurred while loading your workspace. Click below to reload your session cleanly.
              </p>
              {this.state.error?.message && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-mono font-bold break-all text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95"
            >
              Reload Workspace Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
