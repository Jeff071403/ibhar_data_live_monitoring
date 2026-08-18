import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useMonitoring } from '../../hooks/useMonitoring';
import { useTheme } from '../../hooks/useTheme';

export const HospitalHealthDonut: React.FC = () => {
  const { hospitals } = useMonitoring();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const healthyCount = hospitals.filter(h => h.status === 'healthy').length;
  const delayedCount = hospitals.filter(h => h.status === 'delayed').length;
  const criticalCount = hospitals.filter(h => h.status === 'critical' || h.status === 'warning' || h.status === 'offline').length;

  const data = [
    { name: 'Healthy', value: healthyCount, colorLight: '#059669', colorDark: '#34D399' },
    { name: 'Delayed', value: delayedCount, colorLight: '#D97706', colorDark: '#FBBF24' },
    { name: 'Critical/Warning', value: criticalCount, colorLight: '#DC2626', colorDark: '#F87171' },
  ];

  const totalHospitals = hospitals.length;

  return (
    <div className="relative w-full h-52 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={78}
            paddingAngle={4}
            dataKey="value"
            cornerRadius={6}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={isDark ? entry.colorDark : entry.colorLight}
                stroke={isDark ? '#0F172A' : '#FFFFFF'}
                strokeWidth={3}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold">
                    <p className="text-slate-900 dark:text-white">
                      {item.name}: <span className="font-black text-sm">{item.value}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold">
                      {Math.round(((item.value as number) / totalHospitals) * 100)}% of network
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-heading font-black text-2xl text-slate-900 dark:text-white">
          {totalHospitals}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold">
          Hospitals
        </span>
      </div>
    </div>
  );
};
