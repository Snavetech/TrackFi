import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  TrendingUp,
  RefreshCw,
  Sparkles,
  AlertOctagon,
  Calendar,
  DollarSign,
  Info,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { addDays, format, parseISO } from 'date-fns';

export const Predictions: React.FC = () => {
  const { prediction, activeHorizon, recalculatePrediction, predictionHistory, currentBalance, budgets, transactions } = useFinancial();
  const { currencySymbol } = useAuth();
  const [horizon, setHorizon] = useState<number>(activeHorizon || 30);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const formatYAxisTick = (val: number) => {
    if (val === 0) return `${currencySymbol}0`;
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    if (absVal >= 1000) {
      return `${isNeg ? '-' : ''}${currencySymbol}${(absVal / 1000).toFixed(0)}k`;
    }
    return `${isNeg ? '-' : ''}${currencySymbol}${absVal}`;
  };

  const handleHorizonChange = (days: number) => {
    setHorizon(days);
    recalculatePrediction(days);
  };

  const handleRecalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      recalculatePrediction(horizon);
      setIsCalculating(false);
    }, 600);
  };

  // Forecast Simulation Curve (Current balance to Projected balance over selected horizon)
  const forecastCurveData = [];
  const daysStep = Math.max(1, Math.floor(horizon / 10));
  const dailyBurn = prediction?.avg_daily_burn_rate || 0;

  for (let d = 0; d <= horizon; d += daysStep) {
    const simDate = addDays(new Date(), d);
    const simBalance = currentBalance - (dailyBurn * d);
    forecastCurveData.push({
      day: `Day ${d}`,
      date: format(simDate, 'MMM dd'),
      balance: Math.round(simBalance),
    });
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[#6e44ff] font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 fill-purple-100" />
            <span>Financial Sustainability Analytics Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#332a54] mt-1">Predictive Cash Flow Forecast</h2>
          <p className="text-xs text-[#8b849c]">Explainable financial forecast derived from trailing 30-day transaction burn rate</p>
        </div>

        {/* Horizon Buttons & Recalculate */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-purple-50 border border-purple-100 text-xs">
            {[7, 14, 30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => handleHorizonChange(days)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${horizon === days ? 'bg-[#6e44ff] text-white shadow-sm' : 'text-[#8b849c] hover:text-[#332a54]'}`}
              >
                {days}D
              </button>
            ))}
          </div>

          <button
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-semibold shadow-md shadow-purple-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Now</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sustainability Score Gauge */}
          <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm flex flex-col justify-between items-center text-center">
            <span className="text-xs font-bold uppercase text-[#8b849c] tracking-wider">Sustainability Index</span>
            
            <div className="relative my-4 flex items-center justify-center">
              <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center font-mono ${
                prediction.sustainability_score >= 70 ? 'border-emerald-500 text-emerald-600' :
                prediction.sustainability_score >= 40 ? 'border-amber-500 text-amber-600' : 'border-rose-500 text-rose-600'
              }`}>
                <span className="text-3xl font-extrabold">{prediction.sustainability_score}</span>
                <span className="text-[10px] text-[#8b849c]">/ 100</span>
              </div>
            </div>

            <RiskBadge level={prediction.risk_level} showDetails={false} />
          </div>

          {/* Daily Burn Rate Card */}
          <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-[#8b849c] tracking-wider">Daily Net Burn Rate</span>
            <div className="my-2">
              <span className={`text-2xl font-extrabold font-mono ${prediction.avg_daily_burn_rate > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {prediction.avg_daily_burn_rate > 0 ? '-' : '+'}{currencySymbol}{Math.abs(prediction.avg_daily_burn_rate).toFixed(2)}
              </span>
              <p className="text-[11px] text-[#8b849c] mt-1">Net daily cash drain (Expense - Income)</p>
            </div>
            <div className="text-xs text-[#a09aa6] border-t border-purple-50 pt-2">
              30-day window basis
            </div>
          </div>

          {/* Projected Balance */}
          <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-[#8b849c] tracking-wider">Projected {horizon}-Day Balance</span>
            <div className="my-2">
              <span className={`text-2xl font-extrabold font-mono ${prediction.projected_balance >= 0 ? 'text-[#6e44ff]' : 'text-rose-500'}`}>
                {prediction.projected_balance < 0 ? '-' : ''}{currencySymbol}{Math.abs(prediction.projected_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-[#8b849c] mt-1">Current: {currencySymbol}{currentBalance.toLocaleString()}</p>
            </div>
            <div className="text-xs text-[#a09aa6] border-t border-purple-50 pt-2">
              {prediction.projected_balance >= currentBalance ? 'Growth trend' : 'Shrinking trend'}
            </div>
          </div>

          {/* Estimated Exhaustion Date */}
          <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-[#8b849c] tracking-wider">Zero-Balance Exhaustion</span>
            <div className="my-2">
              <span className="text-lg font-extrabold font-mono text-[#332a54]">
                {prediction.estimated_exhaustion_date || 'N/A (Cash Positive)'}
              </span>
              <p className="text-[11px] text-[#8b849c] mt-1">
                {prediction.estimated_exhaustion_date ? 'Estimated date balance reaches 0' : 'No depletion predicted'}
              </p>
            </div>
            <div className="text-xs text-[#a09aa6] border-t border-purple-50 pt-2">
              Based on linear daily burn
            </div>
          </div>
        </div>
      )}

      {/* Forecast Simulation Chart */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#332a54]">Simulated Balance Curve ({horizon} Days)</h3>
            <p className="text-xs text-[#8b849c]">Projected cash pool progression over time</p>
          </div>
        </div>

        <div className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastCurveData} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
              <defs>
                <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6e44ff" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6e44ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2f2" vertical={false} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} label={{ value: 'Zero Balance Baseline', fill: '#ef4444', fontSize: 11, fontWeight: 'bold', position: 'insideBottomRight' }} />
              <XAxis dataKey="date" stroke="#4c416e" fontSize={12} fontWeight={700} tickLine={false} dy={8} />
              <YAxis stroke="#4c416e" fontSize={12} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={formatYAxisTick} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#6e44ff20', borderRadius: '16px', color: '#332a54', fontWeight: 'bold', boxShadow: '0 10px 25px -5px rgba(110,68,255,0.15)', padding: '12px 16px' }}
                formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Projected Balance']}
                labelStyle={{ fontWeight: '800', color: '#6e44ff', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#6e44ff"
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#simGrad)"
                name="Balance"
                activeDot={{ r: 7, fill: '#6e44ff', stroke: '#ffffff', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Structured Executive Forecast Report */}
      {prediction && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-purple-100/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-purple-50 pb-4">
            <div className="flex items-center gap-2.5 text-[#332a54] font-extrabold text-lg">
              <Activity className="w-5 h-5 text-[#6e44ff]" />
              <span>Financial Sustainability Executive Report</span>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-[#6e44ff] border border-purple-100 font-mono">
              Horizon: {horizon} Days
            </span>
          </div>

          {/* Structured Key Metrics Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Financial Health Score */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs font-semibold uppercase text-[#8b849c]">Financial Health Score</span>
              <p className="text-xl font-extrabold text-[#332a54] mt-1 font-mono">
                {prediction.sustainability_score}/100 <span className="text-xs font-bold text-[#6e44ff]">({prediction.score_label || 'Good'})</span>
              </p>
            </div>

            {/* Current Balance */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs font-semibold uppercase text-[#8b849c]">Current Balance</span>
              <p className="text-xl font-extrabold text-[#332a54] mt-1 font-mono">
                {currencySymbol}{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Daily Net Cash Burn */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs font-semibold uppercase text-[#8b849c]">Daily Net Cash Burn</span>
              <p className={`text-xl font-extrabold mt-1 font-mono ${prediction.avg_daily_burn_rate > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {prediction.avg_daily_burn_rate > 0 ? '-' : '+'}{currencySymbol}{Math.abs(prediction.avg_daily_burn_rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
              </p>
            </div>

            {/* Horizon Projection */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs font-semibold uppercase text-[#8b849c]">{horizon}-Day Projection</span>
              <p className="text-xl font-extrabold text-[#6e44ff] mt-1 font-mono">
                {currencySymbol}{prediction.projected_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Estimated Cash Runway */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 sm:col-span-2">
              <span className="text-xs font-semibold uppercase text-[#8b849c]">Estimated Cash Runway</span>
              <p className="text-base font-extrabold text-[#332a54] mt-1 font-mono">
                {prediction.estimated_exhaustion_date
                  ? `Until ${prediction.estimated_exhaustion_date} (${prediction.days_remaining} days remaining)`
                  : 'Sustainable cash flow (No balance depletion predicted)'}
              </p>
            </div>
          </div>

          {/* Primary Insight */}
          <div className="p-5 rounded-2xl bg-[#f4f0f8]/80 border border-purple-100 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#6e44ff]">
              <Info className="w-4 h-4 text-[#6e44ff]" />
              <span>Primary Insight</span>
            </div>
            <p className="text-sm text-[#332a54] font-medium leading-relaxed">
              {prediction.primary_insight || prediction.explanation_text}
            </p>
          </div>

          {/* Recommendations */}
          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Actionable Recommendations</span>
              </div>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#332a54] font-medium leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Disclaimer:</strong> Financial sustainability predictions are mathematical estimates derived from historical spending patterns over a trailing 30-day window. They serve as guidance and are not financial guarantees.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
