import React from 'react';
import { getStatusLabel } from '../../utils/monitoring';

export type StatusType = 'healthy' | 'delayed' | 'warning' | 'critical' | 'offline';

interface BadgeProps {
  status: StatusType;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  customLabel?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  showDot = true,
  size = 'md',
  customLabel,
  className = ''
}) => {
  const getColors = () => {
    switch (status) {
      case 'healthy':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-800 dark:text-emerald-300 font-black',
          dot: 'bg-emerald-600',
          border: 'border-2 border-emerald-300 dark:border-emerald-700'
        };
      case 'delayed':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-800 dark:text-amber-300 font-black',
          dot: 'bg-amber-600',
          border: 'border-2 border-amber-300 dark:border-amber-700'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-800 dark:text-amber-300 font-black',
          dot: 'bg-amber-500',
          border: 'border-2 border-amber-300 dark:border-amber-700'
        };
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/60',
          text: 'text-red-800 dark:text-red-300 font-black',
          dot: 'bg-red-600 animate-pulse',
          border: 'border-2 border-red-300 dark:border-red-700'
        };
      case 'offline':
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300 font-black',
          dot: 'bg-slate-500',
          border: 'border-2 border-slate-300 dark:border-slate-700'
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-800 dark:text-slate-200 font-black',
          dot: 'bg-slate-500',
          border: 'border-2 border-slate-300 dark:border-slate-700'
        };
    }
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-cute tracking-wide',
    md: 'px-2.5 py-1 text-[12px] font-cute tracking-wide',
    lg: 'px-3 py-1.5 text-[13px] font-cute tracking-wide'
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <span className={`rounded-full ${colors.dot} ${dotSize[size]}`} />}
      <span className="font-semibold uppercase tracking-wider">
        {customLabel || getStatusLabel(status)}
      </span>
    </span>
  );
};
