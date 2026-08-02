import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_CURRENCIES } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { Save, Database, User, Check, Upload, Camera, Trash2, Sparkles } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || PRESET_AVATARS[0]);
  const [currency, setCurrency] = useState(user?.preferred_currency || 'NGN');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(user?.low_balance_threshold?.toString() || '10000');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
      preferred_currency: currency,
      low_balance_threshold: parseFloat(lowBalanceThreshold) || 10000,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn pb-6">
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#332a54]">User Profile & Preferences</h2>
        <p className="text-xs text-[#8b849c] mt-1">Manage display currency, avatar image, low balance alerts, and account configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm space-y-6">
        {/* Profile Avatar Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-2">Profile Picture</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('settings-avatar-file')?.click()}>
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-purple-100 transition group-hover:opacity-80"
              />
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                <Camera className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="settings-avatar-file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatarUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('settings-avatar-file')?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-[#6e44ff] rounded-2xl text-xs font-semibold border border-purple-100 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Picture</span>
                </button>
              </div>

              <div>
                <p className="text-[11px] text-[#8b849c] mb-1.5">Or choose an avatar preset:</p>
                <div className="flex items-center gap-2.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition ${avatarUrl === url ? 'border-[#6e44ff] scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-sm focus:outline-none focus:border-[#6e44ff] font-medium"
          />
        </div>

        {/* Preferred Currency */}
        <div>
          <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-1">Preferred Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-sm focus:outline-none focus:border-[#6e44ff] font-mono font-semibold"
          >
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.symbol} {c.code})</option>
            ))}
          </select>
        </div>

        {/* Low Balance Warning Threshold */}
        <div>
          <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-1">Low Balance Alert Threshold</label>
          <input
            type="number"
            step="100"
            min="0"
            value={lowBalanceThreshold}
            onChange={(e) => setLowBalanceThreshold(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] font-mono text-sm focus:outline-none focus:border-[#6e44ff]"
          />
          <p className="text-[11px] text-[#8b849c] mt-1">Triggers an in-app notification when net balance drops below this threshold.</p>
        </div>

        {/* System Backend Connection Status */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#6e44ff]" />
            <span className="font-semibold text-[#332a54]">Database & Storage Engine:</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${isSupabaseConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-purple-100 border-purple-200 text-[#6e44ff]'}`}>
            {isSupabaseConfigured ? 'Live Supabase Cloud Connected' : 'Local Storage Engine (Demo Active)'}
          </span>
        </div>

        {/* Re-launch Onboarding Tutorial */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-[#332a54]">App Onboarding & Feature Guide</p>
            <p className="text-[11px] text-[#8b849c]">Re-watch the interactive 5-step quick start guide on managing budgets, transactions, and predictive forecasting.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('intellibudget_onboarding_completed');
              window.location.reload();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-bold transition shadow-sm shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Quick Start Tour</span>
          </button>
        </div>

        {/* Clear Demo Data Management */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-rose-950">Clear Ledger & Demo Data</p>
            <p className="text-[11px] text-rose-700">Wipe all initial sample transactions so you can work exclusively with your own CSV / Excel uploads.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Wipe all demo transactions and start with a clean slate?')) {
                localStorage.setItem('intellibudget_transactions', JSON.stringify([]));
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition shadow-sm shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo Ledger</span>
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedMessage ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <Check className="w-4 h-4" /> Settings & profile saved successfully!
            </span>
          ) : <span />}
          <button
            type="submit"
            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-semibold shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

