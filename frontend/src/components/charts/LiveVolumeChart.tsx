import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useMonitoring } from '../../hooks/useMonitoring';
import { useTheme } from '../../hooks/useTheme';

export const LiveVolumeChart: React.FC = () => {
  const { timeSeries } = useMonitoring();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const strokeColor = isDark ? '#60A5FA' : '#2563EB';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#CBD5E1' : '#334155';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="liveVolumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.45} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 11, fontWeight: 'bold' }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 11, fontWeight: 'bold' }}
            unit=" MB"
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold">
                    <p className="font-heading font-black text-slate-900 dark:text-white mb-1">
                      {label} Telemetry
                    </p>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold">
                      <span>Data Volume:</span>
                      <span className="font-mono text-sm font-black">{payload[0].value} MB</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">
                      Expected sync interval: 30 min
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="volumeMB"
            stroke={strokeColor}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#liveVolumeGrad)"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
