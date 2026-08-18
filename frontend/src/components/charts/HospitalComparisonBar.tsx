import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { MOCK_TOP_HOSPITALS_COMPARISON } from '../../data/mockAnalytics';
import { useTheme } from '../../hooks/useTheme';

export const HospitalComparisonBar: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#CBD5E1' : '#334155';

  const colorsLight = ['#2563EB', '#059669', '#7C3AED', '#EA580C', '#D97706', '#DC2626'];
  const colorsDark = ['#60A5FA', '#34D399', '#A78BFA', '#FB923C', '#FBBF24', '#F87171'];

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={MOCK_TOP_HOSPITALS_COMPARISON}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="id"
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }}
            width={75}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1 font-bold">
                    <p className="font-heading font-black text-slate-900 dark:text-white">
                      {data.name} ({data.id})
                    </p>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <span>Volume:</span>
                      <span className="font-mono font-black">{data.volumeMB} MB</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span>Quality:</span>
                      <span className="font-mono font-black">{data.quality}%</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="volumeMB" radius={[0, 8, 8, 0]} barSize={18}>
            {MOCK_TOP_HOSPITALS_COMPARISON.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={isDark ? colorsDark[index % colorsDark.length] : colorsLight[index % colorsLight.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
