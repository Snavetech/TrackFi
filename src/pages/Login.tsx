import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginProps {
  onNavigateSignUp: () => void;
  onNavigateForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateSignUp, onNavigateForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('ismail@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f0f8] text-[#332a54]">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-purple-100 shadow-xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#6e44ff] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#332a54]">TrackFi</h1>
          <p className="text-xs text-[#8b849c]">Predictive Financial Sustainability & Expense Tracker</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8b849c]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-[#8b849c] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8b849c]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-bold focus:outline-none focus:border-[#6e44ff]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onNavigateForgotPassword}
              className="text-xs font-bold text-[#6e44ff] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#8b849c]">
          Don't have an account?{' '}
          <button onClick={onNavigateSignUp} className="text-[#6e44ff] font-bold hover:underline">
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};
