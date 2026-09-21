import React, { useEffect, useState } from 'react';
import type { ReportFilters, Hospital } from '../../types';
import { apiService } from '../../services/api';
import { Calendar, Filter, Building2, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface ReportFilterBarProps {
  filters: ReportFilters;
  onFilterChange: (filters: ReportFilters) => void;
  onResetFilters: () => void;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    apiService.getHospitals().then(data => {
      setHospitals(data || []);
    });
  }, []);

  const handleDatePresetChange = (preset: string) => {
    if (preset === 'custom') {
      onFilterChange({ ...filters, date_preset: 'custom' });
    } else {
      onFilterChange({
        ...filters,
        date_preset: preset,
        start_date: undefined,
        end_date: undefined
      });
    }
  };

  return (
    <div className="bg-bgLight-card dark:bg-bgNight-card border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2 text-xs font-heading font-extrabold text-textLight-heading dark:text-textNight-heading uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>REPORT AUDIT FILTERS</span>
        </div>

        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-[11px] font-sans font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Date Range Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date Range
          </label>
          <select
            value={filters.date_preset || 'today'}
            onChange={(e) => handleDatePresetChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-textLight-heading dark:text-textNight-heading font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Hospital Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Hospital
          </label>
          <select
            value={filters.hospital_id || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, hospital_id: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-textLight-heading dark:text-textNight-heading font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="ALL">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.id})
              </option>
            ))}
          </select>
        </div>

        {/* Data Type Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Data Type
          </label>
          <select
            value={filters.data_type || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, data_type: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-textLight-heading dark:text-textNight-heading font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Data Types</option>
            <option value="ENCOUNTER">Encounter</option>
            <option value="DISCHARGE">Discharge</option>
            <option value="HEARTBEAT">Heartbeat</option>
            <option value="BATCH_TRANSMISSION">Batch Transmission</option>
            <option value="HL7_ADT_A01">HL7 ADT A01</option>
            <option value="OPENROUTER_MANUAL_GEN">Simulation Gen</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Ingestion Status
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-textLight-heading dark:text-textNight-heading font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="DELAYED">DELAYED</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Alert Severity
          </label>
          <select
            value={filters.severity || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-textLight-heading dark:text-textNight-heading font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {filters.date_preset === 'custom' && (
        <div className="pt-2 flex flex-wrap items-center gap-4 bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Start Date:</span>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => onFilterChange({ ...filters, start_date: e.target.value })}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">End Date:</span>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => onFilterChange({ ...filters, end_date: e.target.value })}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
