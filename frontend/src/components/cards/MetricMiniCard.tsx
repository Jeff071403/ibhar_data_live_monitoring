import React from 'react';
import { Card, type CardVariant } from '../common/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MetricMiniCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: string;
  isPositive?: boolean;
  variant: CardVariant;
  sparklineData: number[];
  gradientColors: [string, string];
}

export const MetricMiniCard: React.FC<MetricMiniCardProps> = ({
  title,
  value,
  subtext,
  trend,
  isPositive = true,
  variant,
  sparklineData,
  gradientColors
}) => {
  const chartData = sparklineData.map((val, idx) => ({ idx, val }));
  const gradId = `sparkGrad-${title.replace(/\s+/g, '')}`;

  const outlineVariant = `outline-${variant}` as CardVariant;

  return (
    <Card variant={outlineVariant} hoverEffect={true} className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {title}
          </span>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border shadow-sm ${
              isPositive 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30' 
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100/50 dark:border-red-900/30'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4 stroke-[2.5]" /> : <TrendingDown className="w-4 h-4 stroke-[2.5]" />}
              <span>{trend}</span>
            </div>
          )}
        </div>

        <div className="font-heading font-black text-2xl lg:text-3xl text-slate-950 dark:text-white">
          {value}
        </div>

        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-extrabold">
          {subtext}
        </p>
      </div>

      {/* Mini Sparkline Chart */}
      <div className="w-full h-12 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientColors[0]} stopOpacity={0.6} />
                <stop offset="100%" stopColor={gradientColors[1]} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="val"
              stroke={gradientColors[0]}
              strokeWidth={3}
              fill={`url(#${gradId})`}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
