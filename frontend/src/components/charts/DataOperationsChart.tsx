import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MOCK_OPERATIONS } from '../../data/mockAnalytics';
import { useTheme } from '../../hooks/useTheme';

export const DataOperationsChart: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const lineData = [
    { time: '8 AM', Insert: 28, Update: 24, Read: 26, Delete: 8 },
    { time: '9 AM', Insert: 30, Update: 26, Read: 28, Delete: 9 },
    { time: '10 AM', Insert: 31, Update: 27, Read: 29, Delete: 10 },
    { time: '11 AM', Insert: 34, Update: 29, Read: 31, Delete: 11 },
    { time: '12 PM', Insert: 32, Update: 28, Read: 30, Delete: 10 },
    { time: '1 PM', Insert: 33, Update: 27, Read: 32, Delete: 9 },
    { time: '2 PM', Insert: 31, Update: 28, Read: 30, Delete: 10 },
  ];

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#CBD5E1' : '#334155';

  return (
    <div className="space-y-3">
      {/* Legend & Percentages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MOCK_OPERATIONS.map((op) => (
          <div
            key={op.name}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: isDark ? op.colorDark : op.colorLight }}
              />
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {op.name}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-heading font-black text-xl text-slate-900 dark:text-white">
                {op.percentage}%
              </span>
              <span className="text-xs text-slate-500 font-extrabold">
                {(op.count / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Smooth Multi-Line Graph */}
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              unit="%"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1 font-bold">
                      <p className="font-heading font-black text-slate-900 dark:text-white">
                        {label} Operations Breakdown
                      </p>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 font-extrabold" style={{ color: entry.color }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}:
                          </span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">
                            {entry.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {MOCK_OPERATIONS.map((op) => (
              <Line
                key={op.name}
                type="monotone"
                dataKey={op.name}
                stroke={isDark ? op.colorDark : op.colorLight}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
