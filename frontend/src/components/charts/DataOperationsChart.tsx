import React from 'react';
import type { DataOperationItem } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface DataOperationsChartProps {
  operations?: DataOperationItem[];
}

export const DataOperationsChart: React.FC<DataOperationsChartProps> = ({ operations = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const defaultOps: DataOperationItem[] = operations.length > 0 ? operations : [
    { name: 'Insert', percentage: 0, count: 0, colorLight: '#10B981', colorDark: '#34D399' },
    { name: 'Update', percentage: 0, count: 0, colorLight: '#3B82F6', colorDark: '#60A5FA' },
    { name: 'Read', percentage: 0, count: 0, colorLight: '#8B5CF6', colorDark: '#A78BFA' },
    { name: 'Delete', percentage: 0, count: 0, colorLight: '#EF4444', colorDark: '#F87171' },
  ];

  return (
    <div className="space-y-3">
      {/* Legend & Percentages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {defaultOps.map((op) => (
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
                {op.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
