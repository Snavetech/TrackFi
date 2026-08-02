import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EditProfileModal } from '../modals/EditProfileModal';
import {
  LayoutDashboard,
  Receipt,
  Target,
  PiggyBank,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Tag,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  Edit3,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onCloseMobile?: () => void;
  onOpenTutorial?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, onCloseMobile, onOpenTutorial }) => {
  const { user, logout } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleSelectTab = (id: string) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-[#e8e2f2] flex flex-col h-full md:h-screen sticky top-0 z-40 shadow-sm overflow-hidden">
        {/* Top Fixed Area */}
        <div className="shrink-0">
          {/* Top Logo & Optional Close Button */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#6e44ff] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <span className="text-xl font-extrabold text-[#332a54] tracking-tight font-sans">TrackFi</span>
            </div>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Profile Card Section */}
          <div className="px-6 pb-4 pt-1 flex flex-col items-center text-center border-b border-purple-50/60">
            <div className="relative mb-2 group cursor-pointer" onClick={() => setIsEditProfileOpen(true)}>
              <img
                src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={user?.full_name || "Rachel Simmons"}
                className="w-14 h-14 rounded-full object-cover shadow-sm ring-4 ring-purple-50 transition group-hover:opacity-90"
              />
              <div className="absolute bottom-0 right-0 p-1 rounded-full bg-[#6e44ff] text-white shadow-md">
                <Edit3 className="w-2.5 h-2.5" />
              </div>
            </div>
            <h2 className="text-xs font-bold text-[#6e44ff] truncate max-w-[180px]">{user?.full_name || 'Rachel Simmons'}</h2>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="mt-0.5 text-[10px] font-semibold text-[#8b849c] hover:text-[#6e44ff] transition flex items-center gap-1"
            >
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Links */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#f4f0f8] text-[#6e44ff] shadow-2xs font-bold'
                    : 'text-[#8b849c] hover:text-[#332a54] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#6e44ff]' : 'text-[#8b849c]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-100 text-[#6e44ff]">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pinned Bottom Footer Actions */}
        <div className="shrink-0 p-3.5 space-y-1 border-t border-[#e8e2f2] bg-white">
          {onOpenTutorial && (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onOpenTutorial();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#6e44ff] bg-purple-50/80 hover:bg-purple-100 transition shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 text-[#6e44ff] shrink-0" />
              <span>Quick Start Guide</span>
            </button>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#8b849c] hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </>
  );
};

