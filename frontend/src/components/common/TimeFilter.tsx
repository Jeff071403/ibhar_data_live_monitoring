import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useMonitoring, type TimeRange } from '../../hooks/useMonitoring';

export const TimeFilter: React.FC = () => {
  const { timeRange, setTimeRange } = useMonitoring();

  const options: { id: TimeRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white text-xs font-bold font-sans">
        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="bg-transparent pr-5 focus:outline-none cursor-pointer appearance-none text-slate-900 dark:text-white font-extrabold"
        >
          {options.map((opt) => (
            <option
              key={opt.id}
              value={opt.id}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 stroke-[2.5]" />
      </div>
    </div>
  );
};
