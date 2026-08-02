import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_CURRENCIES } from '../types';
import { Sparkles, ArrowRight, Lock, Mail, User, DollarSign } from 'lucide-react';

interface SignUpProps {
  onNavigateLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onNavigateLogin }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signUp(email, password, fullName, currency);
    if (!res.success) {
      setError(res.error || 'Sign up failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f0f8] text-[#332a54]">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-purple-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#6e44ff] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#332a54]">TrackFi</h1>
          <p className="text-xs text-[#8b849c]">Join TrackFi to manage expenses & predictive sustainability</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-[#8b849c]" />
              <input
                type="text"
                required
                placeholder="Ismail Alabi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8b849c]" />
              <input
                type="email"
                required
                placeholder="ismail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Preferred Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff] font-mono"
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.symbol} {c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8b849c]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#6e44ff] hover:bg-[#5b32e0] text-white font-semibold rounded-2xl text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{loading ? 'Creating Account...' : 'Register & Provision Tracker'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-[#8b849c]">
            Already have an account?{' '}
            <button onClick={onNavigateLogin} className="text-[#6e44ff] font-bold hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
