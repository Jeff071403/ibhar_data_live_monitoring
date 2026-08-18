import React from 'react';
import { Card, type CardVariant } from '../common/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend: string;
  isPositive?: boolean;
  variant: CardVariant;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  isPositive = true,
  variant,
  onClick
}) => {
  return (
    <Card variant={variant} hoverEffect={true} onClick={onClick} className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-wider text-white/90">
          {label}
        </span>
        <div className="p-2.5 rounded-2xl bg-white/20 text-white backdrop-blur-md shadow-inner border border-white/30 animate-pulse-slow">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="font-heading font-black text-3xl lg:text-4xl text-white tracking-tight animate-fade-in">
          {value}
        </div>

        <div className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-sm">
          {isPositive ? <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" /> : <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />}
          <span>{trend}</span>
        </div>
      </div>
      <p className="text-[11px] text-white/80 font-bold mt-1">
        from yesterday
      </p>
    </Card>
  );
};
