import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinancial } from '../../context/FinancialContext';
import { TransactionModal } from '../modals/TransactionModal';
import { Bell, Plus, ShieldCheck, CheckCheck, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  pageTitle: string;
  onOpenMobileMenu?: () => void;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, onOpenMobileMenu, onOpenTutorial }) => {
  const { user, currencyCode, currencySymbol } = useAuth();
  const { notifications, unreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, prediction } = useFinancial();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-2.5 sm:px-6 py-3 bg-[#f4f0f8]/90 backdrop-blur-xl border-b border-[#e8e2f2]">
        {/* Left: Mobile Menu Trigger & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl bg-white border border-purple-100 text-[#332a54] hover:text-[#6e44ff] shadow-sm transition shrink-0"
              aria-label="Open Navigation Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-extrabold text-[#332a54] tracking-tight truncate max-w-[125px] min-[380px]:max-w-[160px] sm:max-w-none">{pageTitle}</h1>
            <p className="text-[10px] sm:text-xs text-[#8b849c] truncate max-w-[125px] min-[380px]:max-w-[180px] sm:max-w-none">
              <span className="hidden sm:inline">{format(new Date(), 'EEEE, dd MMMM yyyy')} • </span>Currency: <span className="font-mono font-semibold text-[#6e44ff]">{currencyCode} ({currencySymbol})</span>
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Sustainability Quick Indicator */}
          {prediction && (
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-purple-100 text-xs shadow-sm">
              <span className="text-[#8b849c]">Burn Rate:</span>
              <span className={`font-mono font-semibold ${prediction.avg_daily_burn_rate > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {prediction.avg_daily_burn_rate > 0 ? '-' : '+'}{currencySymbol}{Math.abs(prediction.avg_daily_burn_rate)}/day
              </span>
            </div>
          )}

          {/* Quick Add Transaction Button */}
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="p-2 sm:px-4 sm:py-2 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-xl sm:rounded-2xl text-xs font-semibold shadow-md shadow-purple-500/20 transition active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            title="Record New Transaction"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>

          {/* Help & Tutorial Button */}
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="p-2.5 rounded-2xl bg-white border border-purple-100 text-[#332a54] hover:text-[#6e44ff] hover:bg-purple-50 transition shadow-sm"
              title="Open App Onboarding Tutorial"
            >
              <HelpCircle className="w-4 h-4 text-[#6e44ff]" />
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 rounded-2xl bg-white border border-purple-100 text-[#332a54] hover:text-[#6e44ff] hover:bg-purple-50 transition shadow-sm"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white border border-purple-100 shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50 bg-slate-50/50">
                  <span className="text-xs font-bold text-[#332a54] uppercase tracking-wider">Notifications ({unreadNotificationCount} unread)</span>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-semibold text-[#6e44ff] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-purple-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8b849c]">No active notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3.5 text-xs cursor-pointer transition ${n.is_read ? 'bg-white text-[#8b849c]' : 'bg-purple-50/50 text-[#332a54] font-medium'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-[#332a54]">{n.title}</span>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#6e44ff] shrink-0 mt-1" />}
                        </div>
                        <p className="mt-1 text-[#8b849c] leading-relaxed text-[11px]">{n.body}</p>
                        <span className="mt-2 block text-[10px] text-[#a09aa6]">{format(new Date(n.created_at), 'hh:mm a, dd MMM')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-purple-100">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.full_name || 'User'}
              className="w-8 h-8 rounded-full border border-purple-200 object-cover shadow-sm"
            />
            <span className="hidden lg:inline text-xs font-semibold text-[#332a54]">{user?.full_name}</span>
          </div>
        </div>
      </header>

      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} />
    </>
  );
};
