import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowLeft, Mail } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigateLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateLogin }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const res = await resetPassword(email);
    if (res.success) {
      setMessage(res.message || 'Password reset link dispatched to your inbox.');
    } else {
      setError(res.error || 'Failed to send reset link.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f0f8] text-[#332a54]">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-purple-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#6e44ff] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#332a54]">TrackFi</h1>
          <p className="text-xs text-[#8b849c]">Enter your email to receive recovery instructions</p>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs shadow-lg transition"
          >
            Send Password Reset Link
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={onNavigateLogin}
            className="inline-flex items-center gap-1 text-xs text-cyan-400 font-semibold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
