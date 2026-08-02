import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showDetails?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showDetails = true }) => {
  const configs = {
    low: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      label: 'Low Risk (Sustainable)',
    },
    moderate: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'Moderate Risk (Caution)',
    },
    high: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
      label: 'High Risk (Critical)',
    },
  };

  const config = configs[level] || configs.low;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md ${config.bg}`}>
      <span className={`w-2 h-2 rounded-full animate-pulse ${config.dot}`} />
      <Icon className="w-4 h-4" />
      <span>{showDetails ? config.label : level.toUpperCase()}</span>
      {score !== undefined && (
        <span className="ml-1 pl-2 border-l border-current/20 opacity-90 font-mono">
          {score}/100
        </span>
      )}
    </div>
  );
};
