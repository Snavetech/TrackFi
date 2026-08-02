import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'blue',
}) => {
  const iconBgStyles = {
    blue: 'bg-purple-50 text-[#6e44ff] border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-[#6e44ff] border-purple-100',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-purple-100/80 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#8b849c] uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl font-extrabold text-[#332a54] tracking-tight">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-[#8b849c]">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl border ${iconBgStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
          <span className={`flex items-center gap-1 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            <i className={`fa-solid ${trend.isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-[11px]`} />
            <span>{trend.value}</span>
          </span>
          <span className="text-[#a09aa6]">vs last period</span>
        </div>
      )}
    </div>
  );
};
