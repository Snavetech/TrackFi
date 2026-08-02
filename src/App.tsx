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

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
