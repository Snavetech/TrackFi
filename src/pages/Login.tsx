import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Lock, Mail, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onNavigateSignUp: () => void;
  onNavigateForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateSignUp, onNavigateForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#f8f6fc] text-[#332a54] font-sans selection:bg-[#6e44ff] selection:text-white">
      {/* LEFT COLUMN: Brand, Value Proposition & Floating UI Graphic */}
      <div className="lg:col-span-6 xl:col-span-7 p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#f8f6fc] via-[#f2ebfa] to-[#e4d7f8]">
        
        {/* Top Header & Brand */}
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#6e44ff] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <span className="text-2xl font-black text-[#332a54] tracking-tight">TrackFi</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-[#6e44ff] text-xs font-extrabold tracking-wide">
            Smart Finance. Better Future.
          </div>

          <div className="space-y-3 max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-black text-[#332a54] tracking-tight leading-[1.15]">
              Take Control of <br />
              Your Finances <br />
              with <span className="text-[#6e44ff]">TrackFi</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#7a7293] leading-relaxed">
              Track your income, manage expenses, set goals, and get predictive insights to achieve financial freedom.
            </p>
          </div>

          {/* Features Checkmark List */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#6e44ff] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#332a54]">Real-time Tracking</h4>
                <p className="text-[11px] font-semibold text-[#8b849c]">Track income and expenses in real time</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#6e44ff] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#332a54]">Smart Insights</h4>
                <p className="text-[11px] font-semibold text-[#8b849c]">Predictive analytics engine to help you save more</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#6e44ff] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#332a54]">Secure & Private</h4>
                <p className="text-[11px] font-semibold text-[#8b849c]">Your data is encrypted and always protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Floating UI Card Showcase Graphic (Middle Left) */}
        <div className="relative my-8 lg:my-0 flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            {/* Background Wavy Card Mockup */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#6e44ff] to-[#4c24cc] text-white shadow-2xl shadow-purple-900/30 relative z-10 transform -rotate-1 hover:rotate-0 transition duration-500">
              <span className="text-[10px] font-bold tracking-widest text-purple-200 uppercase">Available Balance</span>
              <h3 className="text-2xl font-black text-white font-mono mt-1">₦ 592.02</h3>
              
              {/* Wavy Chart Line SVG */}
              <div className="my-3">
                <svg className="w-full h-8 text-white/40" viewBox="0 0 100 30" fill="none">
                  <path d="M0 25 Q25 5 50 20 T100 10" stroke="currentColor" strokeWidth="2.5" fill="none" />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-200">
                <span>•••• 3922</span>
                <div className="flex items-center -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#eb001b]" />
                  <div className="w-5 h-5 rounded-full bg-[#ff5f00]" />
                </div>
              </div>
            </div>

            {/* Floating Top-Right Badge: Monthly Expenses */}
            <div className="absolute -top-6 -right-4 z-20 p-3 rounded-2xl bg-white shadow-xl border border-purple-100/80 animate-bounce duration-1000">
              <span className="text-[9px] font-extrabold text-[#8b849c] uppercase tracking-wider block">Monthly Expenses</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-[#332a54] font-mono">₦ 294,671</span>
                <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">+8.2%</span>
              </div>
            </div>

            {/* Floating Bottom-Right Badge: Sustainability Score */}
            <div className="absolute -bottom-6 -right-2 z-20 p-3.5 rounded-2xl bg-white shadow-xl border border-purple-100/80">
              <span className="text-[9px] font-extrabold text-[#8b849c] uppercase tracking-wider block">Sustainability Score</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="relative w-8 h-8 rounded-full border-4 border-[#6e44ff] border-t-transparent flex items-center justify-center">
                  <span className="text-[9px] font-extrabold text-[#332a54]">84</span>
                </div>
                <div>
                  <span className="text-xs font-black text-[#332a54] block">84 <span className="text-[10px] font-normal text-[#8b849c]">/100</span></span>
                  <span className="text-[9px] font-extrabold text-emerald-600">Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-4 flex flex-wrap items-center gap-3 border-t border-purple-200/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7a7293]">
            <ShieldCheck className="w-4 h-4 text-[#6e44ff]" />
            <span>Trusted by thousands of users</span>
          </div>
          <div className="flex items-center -space-x-2">
            <img className="w-7 h-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="user" />
            <img className="w-7 h-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="user" />
            <img className="w-7 h-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="user" />
            <img className="w-7 h-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="user" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#6e44ff]">
            +2.5k
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form Card */}
      <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-10 flex flex-col items-center justify-center bg-[#faf8fc]">
        <div className="w-full max-w-md p-8 sm:p-9 rounded-3xl bg-white border border-purple-100/80 shadow-2xl shadow-purple-900/10 space-y-6">
          
          {/* Top Auth Tab Header */}
          <div className="flex border-b border-slate-100 pb-1">
            <button
              type="button"
              className="flex-1 pb-3 text-sm font-extrabold text-[#6e44ff] border-b-2 border-[#6e44ff] text-center"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="flex-1 pb-3 text-sm font-extrabold text-[#8b849c] hover:text-[#332a54] text-center transition"
            >
              Sign Up
            </button>
          </div>

          {/* Title Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#332a54] flex items-center gap-2">
              <span>Welcome back!</span>
              <span className="text-xl">👋</span>
            </h2>
            <p className="text-xs font-semibold text-[#8b849c]">Login to continue managing your finances</p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold text-[#332a54] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8b849c]" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-extrabold text-[#332a54]">Password</label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-[11px] font-bold text-[#6e44ff] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8b849c]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-xs font-semibold focus:outline-none focus:border-[#6e44ff] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8b849c] hover:text-[#332a54] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#6e44ff] focus:ring-[#6e44ff] border-purple-200 accent-[#6e44ff] cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-semibold text-[#7a7293] cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-bold shadow-lg shadow-purple-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Logging in...' : 'Login'}</span>
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="text-center pt-2 text-xs text-[#8b849c]">
            Don't have an account?{' '}
            <button onClick={onNavigateSignUp} className="text-[#6e44ff] font-bold hover:underline">
              Sign up
            </button>
          </div>
        </div>

        {/* Bottom Trust Guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#8b849c] font-bold pt-6">
          <ShieldCheck className="w-4 h-4 text-[#8b849c]" />
          <span>Your data is 100% secure and encrypted</span>
        </div>
      </div>
    </div>
  );
};
