import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMonitoring, mergeWithPersistedNonZeroRecords } from '../../hooks/useMonitoring';
import type { IntegrationHealthLog, IntegrationHealthResponse, IntegrationTrendPoint, HealthTrendPoint } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';
import { MetricMiniCard } from '../../components/cards/MetricMiniCard';
import { computeDelayMinutes, getHospitalLiveStatus, getStoredThresholds } from '../../utils/monitoring';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Radio,
  ShieldCheck,
  Calendar,
  FilterX,
  TrendingUp,
  ActivitySquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip
} from 'recharts';

/**
 * Compact Ingestion Activity Sparkline (record_count line graph - UNCHANGED)
 */
const SparklineCell: React.FC<{ points?: IntegrationTrendPoint[] }> = ({ points }) => {
  if (!points || points.length === 0) {
    return <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] italic">No data</span>;
  }

  return (
    <div className="w-32 sm:w-36 h-9 inline-block relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Tooltip
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as IntegrationTrendPoint;
                return (
                  <div className="w-[170px] max-w-[170px] bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-xl shadow-2xl text-[10px] font-mono border border-slate-700 pointer-events-none z-50 space-y-0.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="font-bold text-slate-300">{data.time_label || 'Time'}</span>
                      <span className="text-blue-400 font-black">{data.record_count} recs</span>
                    </div>
                    <p className="text-slate-400 text-[9px] pt-0.5">{data.data_size_mb} MB • {data.response_time_ms}ms</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="record_count"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={points.length === 1 ? { r: 3, fill: '#3B82F6' } : false}
            activeDot={{ r: 4, fill: '#2563EB' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Compact Proactive Health Trend Sparkline (Anomaly & Integration Health Event Line Graph)
 * Features compact fixed-width tooltip (180px) to prevent table overflow & row expansion.
 */
const HealthSparklineCell: React.FC<{ points?: HealthTrendPoint[] }> = ({ points }) => {
  if (!points || points.length === 0) {
    return <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] italic">No data</span>;
  }

  const hasCritical = points.some(p => p.status === 'CRITICAL');
  const hasWarning = points.some(p => p.status === 'WARNING');
  const strokeColor = hasCritical ? '#EF4444' : hasWarning ? '#F59E0B' : '#10B981';

  return (
    <div className="w-36 sm:w-40 h-9 inline-block relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Tooltip
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as HealthTrendPoint;
                const statusDot = data.status === 'CRITICAL' ? '🔴' : data.status === 'WARNING' ? '🟡' : '🟢';

                return (
                  <div className="w-[180px] max-w-[180px] bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-xl shadow-2xl text-[10px] font-mono border border-slate-700 pointer-events-none z-50 space-y-1">
                    {/* Compact Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="font-bold flex items-center gap-1">
                        <span>{statusDot}</span>
                        <span className={
                          data.status === 'CRITICAL' ? 'text-rose-400 font-black' :
                          data.status === 'WARNING' ? 'text-amber-400 font-black' : 'text-emerald-400 font-black'
                        }>
                          {data.status}
                        </span>
                      </span>
                      <span className="text-slate-400 text-[9px] font-bold">{data.time_label || 'Time'}</span>
                    </div>

                    {/* Compact Issues Body */}
                    {data.issues && data.issues.length > 0 ? (
                      data.issues.map((iss, idx) => (
                        <div key={idx} className="space-y-0.5 text-[9.5px]">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-amber-300 tracking-wide uppercase">{iss.type}</span>
                            {iss.deviation && <span className="text-rose-400 font-bold">{iss.deviation}</span>}
                          </div>
                          <div className="text-slate-300 font-semibold space-y-0.2">
                            <p>Response: <strong className="text-white">{iss.value}</strong></p>
                            <p>Baseline: <span className="text-slate-400">{iss.baseline}</span></p>
                          </div>
                          {iss.message && (
                            <p className="text-slate-400 text-[9px] font-sans line-clamp-2 leading-tight pt-0.5 truncate">
                              {iss.message}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-emerald-400 text-[9.5px] font-semibold pt-0.5">
                        Normal Operation
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="health_score"
            stroke={strokeColor}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.status === 'CRITICAL') {
                return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#EF4444" stroke="#FFF" strokeWidth={1} />;
              }
              if (payload.status === 'WARNING') {
                return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#F59E0B" />;
              }
              return points.length === 1 ? <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} fill="#10B981" /> : null;
            }}
            activeDot={{ r: 4, fill: strokeColor }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SERVICE_TO_DATA_STRUCTURE_MAP: Record<string, string[]> = {
  'GENERAL Process Data Entities': [
    'ANTIBIOTICS_DISPENSED',
    'ANTIBIOTICS_RETURNED',
    'AREA_MASTER',
    'AST_ANTIBIOTIC_DATA',
    'AST_DEMOGRAPHIC_DATA',
    'CULTURE_HEADER',
    'CULTURE_REQUEST',
    'DEMOGRAPHIC_DATA',
    'IN_ANBX_DISP_INFO',
    'IN_ANBX_RETN_INFO',
    'IN_PATIENT_INFO',
    'IN_SURG_INFO',
    'IPD_DATA',
    'IPD_TRANSFER_DATA',
    'OPD_DATA',
    'PATIENT_DATA',
    'PATIENT_DISCHARGE',
    'PATIENT_ENCOUNTER',
    'PATIENT_HEADER',
    'PATIENT_TRANSFER',
    'SURGERY_INFORMATION',
    'USER_MASTER',
    'VITEK_AST_DATA'
  ],
  'VAMR Process Data Entities': [
    'DEMOGRAPHIC_DATA'
  ]
};

export const SERVICE_NAME_OPTIONS = [
  'ALL',
  'GENERAL Process Data Entities',
  'VAMR Process Data Entities'
] as const;

export const ALL_DATA_STRUCTURES: string[] = Array.from(
  new Set(Object.values(SERVICE_TO_DATA_STRUCTURE_MAP).flat())
).sort();

export const DATA_STRUCTURE_OPTIONS = ['ALL', ...ALL_DATA_STRUCTURES] as const;

export const IntegrationHealthPage: React.FC = () => {
  const {
    integrationHealthData: initialData,
    lastUpdated: defaultLastUpdated,
    autoRefresh,
    manualRefresh,
    isLoading: isGlobalLoading,
    isBackendConnected,
    apiError,
    thresholdVersion
  } = useMonitoring();

  const [filteredHealthData, setFilteredHealthData] = useState<IntegrationHealthResponse | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceName, setSelectedServiceName] = useState<string>('ALL');
  const [selectedDataStructure, setSelectedDataStructure] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dynamically compute available data structures based on selected parent service
  const availableDataStructures = useMemo(() => {
    if (selectedServiceName !== 'ALL' && SERVICE_TO_DATA_STRUCTURE_MAP[selectedServiceName]) {
      return SERVICE_TO_DATA_STRUCTURE_MAP[selectedServiceName];
    }
    return ALL_DATA_STRUCTURES;
  }, [selectedServiceName]);

  // Handle service change and reset data structure if current selection is invalid for new service
  const handleServiceChange = (service: string) => {
    setSelectedServiceName(service);
    if (service !== 'ALL') {
      const allowed = SERVICE_TO_DATA_STRUCTURE_MAP[service] || [];
      if (selectedDataStructure !== 'ALL' && !allowed.includes(selectedDataStructure)) {
        setSelectedDataStructure('ALL');
      }
    }
  };

  // Fetch filtered health data whenever backend filters change
  const fetchFilteredData = useCallback(async () => {
    if (!startDate && !endDate && selectedDataStructure === 'ALL' && selectedServiceName === 'ALL' && selectedStatus === 'ALL' && !searchQuery) {
      setFilteredHealthData(null);
      return;
    }
    setIsFilterLoading(true);
    try {
      const res = await apiService.getIntegrationHealth({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        data_structure: selectedDataStructure !== 'ALL' ? selectedDataStructure : undefined,
        service_name: selectedServiceName !== 'ALL' ? selectedServiceName : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined
      });
      if (res && res.success !== false) {
        const mergedData = mergeWithPersistedNonZeroRecords(res.data || []);
        setFilteredHealthData({
          ...res,
          data: mergedData,
        });
      }
    } catch (e) {
      console.error('[IntegrationHealth] Date filter fetch error:', e);
    } finally {
      setIsFilterLoading(false);
    }
  }, [startDate, endDate, selectedDataStructure, selectedServiceName, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchFilteredData();
  }, [fetchFilteredData]);

  // Active data source
  const activeData = filteredHealthData || initialData;

  const hasActiveFilters = Boolean(
    searchQuery || selectedDataStructure !== 'ALL' || selectedServiceName !== 'ALL' || selectedStatus !== 'ALL' || startDate || endDate
  );

  const logs: IntegrationHealthLog[] = useMemo(() => {
    return activeData?.data || [];
  }, [activeData]);

  // Filter logs based on search and client-side refinements
  const displayLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Data Structure Filter
      if (selectedDataStructure !== 'ALL') {
        const logDs = (log.data_structure || log.data_type || '').toLowerCase().replace(/[\s_]/g, '');
        const targetDs = selectedDataStructure.toLowerCase().replace(/[\s_]/g, '');
        if (logDs !== targetDs) return false;
      }

      // 2. Service Name Filter
      if (selectedServiceName !== 'ALL') {
        const logService = (log.service_name || 'general process data entities').toLowerCase().trim();
        const targetService = selectedServiceName.toLowerCase().trim();
        if (!logService.includes(targetService) && !targetService.includes(logService)) return false;
      }

      // 3. Process Status Filter
      if (selectedStatus !== 'ALL') {
        const statusUpper = (log.status || log.integration_status || '').toUpperCase();
        if (selectedStatus === 'SUCCESS') {
          if (statusUpper !== 'SUCCESS' && statusUpper !== 'RECEIVING') return false;
        } else if (selectedStatus === 'ERROR') {
          if (statusUpper !== 'ERROR' && statusUpper !== 'FAILED' && statusUpper !== 'CRITICAL') return false;
        }
      }

      // 4. Date range check
      if (startDate || endDate) {
        if (!log.received_at && !log.created_at) return false;
        const logDateStr = (log.received_at || log.created_at || '').substring(0, 10);
        if (startDate && logDateStr < startDate) return false;
        if (endDate && logDateStr > endDate) return false;
      }

      // 5. Search Bar: Hospital Code and Name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (log.hospital_name || '').toLowerCase().includes(q);
        const matchId = (log.hospital_id || log.hospital_code || '').toLowerCase().includes(q);
        const matchDs = (log.data_structure || log.data_type || '').toLowerCase().includes(q);
        const matchService = (log.service_name || '').toLowerCase().includes(q);
        return matchName || matchId || matchDs || matchService;
      }

      return true;
    });
  }, [logs, selectedDataStructure, selectedServiceName, selectedStatus, startDate, endDate, searchQuery]);

  // Dynamically derive all KPI metrics directly from active API response, dynamic thresholds & filter selections
  const summary = useMemo(() => {
    const { customThresholds, globalThresh } = getStoredThresholds();

    let receiving = 0;
    let delayed = 0;
    let failed = 0;
    let unknown = 0;
    let totalRecords = 0;
    let totalVolume = 0;
    let totalRespTime = 0;
    let respTimeCount = 0;
    let lastSuccessful: string | null = null;

    const uniqueHospitals = new Set<string>();

    for (const log of displayLogs) {
      const hId = log.hospital_id || log.hospital_code || '';
      if (hId) uniqueHospitals.add(hId);

      const delay = computeDelayMinutes(log.received_at || log.start_time, log.delay_minutes);
      const threshold = customThresholds[hId] || globalThresh;
      const statusInfo = getHospitalLiveStatus(delay, threshold);
      const hasError = log.status === 'ERROR' || log.integration_status === 'FAILED' || Boolean(log.error_message);

      if (hasError || statusInfo.label === 'CRITICAL') {
        failed++;
      } else if (statusInfo.label === 'DELAYED') {
        delayed++;
      } else {
        receiving++;
        if (log.received_at) {
          if (!lastSuccessful || new Date(log.received_at) > new Date(lastSuccessful)) {
            lastSuccessful = log.received_at;
          }
        }
      }

      const recs = log.record_count ?? log.records_processed ?? log.records_available ?? 0;
      totalRecords += recs;

      const vol = log.data_size_mb ?? 0;
      totalVolume += vol;

      if (log.response_time_ms && log.response_time_ms > 0) {
        totalRespTime += log.response_time_ms;
        respTimeCount++;
      }
    }

    if (!lastSuccessful && activeData?.summary?.last_successful_ingestion) {
      lastSuccessful = activeData.summary.last_successful_ingestion;
    }

    return {
      total_hospitals: uniqueHospitals.size > 0 ? uniqueHospitals.size : displayLogs.length,
      receiving,
      delayed,
      failed,
      unknown,
      total_records: totalRecords,
      total_volume_mb: Math.round(totalVolume * 100) / 100,
      average_response_time_ms: respTimeCount > 0 ? Math.round(totalRespTime / respTimeCount) : (activeData?.summary?.average_response_time_ms || 0),
      average_duration_seconds: activeData?.summary?.average_duration_seconds ?? (respTimeCount > 0 ? Math.round((totalRespTime / respTimeCount) / 10) / 100 : 0.08),
      latest_start_time: activeData?.summary?.latest_start_time || lastSuccessful,
      latest_end_time: activeData?.summary?.latest_end_time || lastSuccessful,
      last_successful_ingestion: lastSuccessful
    };
  }, [displayLogs, activeData, thresholdVersion]);

  // Dynamic sparklines derived from actual API log data
  const recordsSparkline = useMemo(() => {
    const pts = displayLogs.map(l => l.record_count ?? l.records_processed ?? 0).filter(v => v > 0);
    return pts.length >= 2 ? pts.slice(0, 10) : [0, Math.max(summary.total_records, 1)];
  }, [displayLogs, summary.total_records]);

  const latencySparkline = useMemo(() => {
    const pts = displayLogs.map(l => l.response_time_ms ?? 0).filter(v => v > 0);
    return pts.length >= 2 ? pts.slice(0, 10) : [summary.average_response_time_ms, summary.average_response_time_ms];
  }, [displayLogs, summary.average_response_time_ms]);

  // Telemetry issues filtered according to active filters
  const displayIssues = useMemo(() => {
    const failedLogs = displayLogs.filter(
      l => l.integration_status === 'FAILED' || l.status === 'ERROR' || l.status === 'FAILED' || (l.error_message && l.error_message.trim().length > 0)
    );
    if (failedLogs.length > 0) return failedLogs;

    return (activeData?.issues || []).filter(iss => {
      if (selectedDataStructure !== 'ALL') {
        const ds = (iss.data_structure || iss.data_type || '').toLowerCase().replace(/[\s_]/g, '');
        const target = selectedDataStructure.toLowerCase().replace(/[\s_]/g, '');
        if (ds !== target) return false;
      }
      if (selectedServiceName !== 'ALL') {
        const s = (iss.service_name || '').toLowerCase();
        if (!s.includes(selectedServiceName.toLowerCase())) return false;
      }
      if (selectedStatus === 'SUCCESS') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = (iss.hospital_name || '').toLowerCase().includes(q);
        const mId = (iss.hospital_id || iss.hospital_code || '').toLowerCase().includes(q);
        if (!mName && !mId) return false;
      }
      return true;
    });
  }, [displayLogs, activeData?.issues, selectedDataStructure, selectedServiceName, selectedStatus, searchQuery]);

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'N/A';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return ts;
    }
  };

  const handlePresetDate = (daysAgo: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);

    setEndDate(end.toISOString().substring(0, 10));
    setStartDate(start.toISOString().substring(0, 10));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedServiceName('ALL');
    setSelectedDataStructure('ALL');
    setSelectedStatus('ALL');
    setStartDate('');
    setEndDate('');
    setFilteredHealthData(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-blue-600 dark:text-blue-400 stroke-[2.5] animate-pulse" />
            <span>INTEGRATION HEALTH</span>
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Real-time payload arrival health, connector response latency & telemetry error audits across all hospital nodes
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold">
          <span>
            Last updated: <span className="font-mono text-slate-900 dark:text-white font-extrabold">{defaultLastUpdated}</span>
          </span>
          <button
            onClick={manualRefresh}
            disabled={isGlobalLoading || isFilterLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all cursor-pointer text-slate-800 dark:text-slate-200 font-extrabold shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${(isGlobalLoading || isFilterLoading) ? 'animate-spin text-blue-600' : ''}`} />
            <span>Auto: <strong className="text-emerald-600 font-black">{autoRefresh ? 'ON' : 'OFF'}</strong></span>
          </button>
        </div>
      </div>

      {/* Backend API Error State */}
      {!isBackendConnected && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-bold text-sm">Unable to load integration health data</p>
              <p className="text-xs opacity-90">{apiError || 'Please check backend API connection.'}</p>
            </div>
          </div>
          <button
            onClick={manualRefresh}
            disabled={isGlobalLoading}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGlobalLoading ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter Control Bar */}
      <Card variant="default" className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
            <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Filter Integration Telemetry
            </h3>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePresetDate(0)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => handlePresetDate(7)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePresetDate(30)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Last 30 Days
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Search Bar: Hospital Code and Name */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Search Hospital (Code or Name)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Hospital Code (e.g. HC2127) or Name..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold"
              />
            </div>
          </div>

          {/* 2. Service Name Dropdown (Superset) */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Service Name
            </label>
            <select
              value={selectedServiceName}
              onChange={e => handleServiceChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Services</option>
              {SERVICE_NAME_OPTIONS.filter(s => s !== 'ALL').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 3. Data Structure Dropdown (Dependent Subset) */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Data Structure
            </label>
            <select
              value={selectedDataStructure}
              onChange={e => setSelectedDataStructure(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="ALL">
                {selectedServiceName === 'ALL'
                  ? `All Data Structures (${availableDataStructures.length})`
                  : `All ${selectedServiceName.includes('VAMR') ? 'VAMR' : 'GENERAL'} Structures (${availableDataStructures.length})`}
              </option>
              {availableDataStructures.map(ds => (
                <option key={ds} value={ds}>{ds}</option>
              ))}
            </select>
          </div>

          {/* 4. Process Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Process Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="ERROR">Error</option>
            </select>
          </div>

          {/* 5. Date Range Inputs */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Date Filter
            </label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                title="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                title="End Date"
              />
            </div>
          </div>
        </div>

        {/* Applied Filters Banner */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-blue-600 dark:text-blue-400">Active Filters:</span>
              {searchQuery && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">Search: "{searchQuery}"</span>}
              {selectedServiceName !== 'ALL' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Service: {selectedServiceName}</span>}
              {selectedDataStructure !== 'ALL' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Data Structure: {selectedDataStructure}</span>}
              {selectedStatus !== 'ALL' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Status: {selectedStatus}</span>}
              {startDate && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">From: {startDate}</span>}
              {endDate && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">To: {endDate}</span>}
            </div>

            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}
      </Card>

      {/* 8 Meaningful Top Summary Metric Cards directly derived from API data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Hospitals */}
        <MetricMiniCard
          title="Total Hospitals"
          value={`${summary.total_hospitals}`}
          subtext={hasActiveFilters ? "Filtered active nodes" : "Configured connectors"}
          trend={`${summary.total_hospitals} Nodes`}
          isPositive={true}
          variant="peach"
          sparklineData={[0, Math.max(summary.total_hospitals, 1)]}
          gradientColors={['#F43F5E', '#FDA4AF']}
        />

        {/* 2. Receiving Data (Healthy) */}
        <MetricMiniCard
          title="Receiving Data"
          value={`${summary.receiving}`}
          subtext="Healthy telemetry feed"
          trend={summary.total_hospitals > 0 ? `${Math.round((summary.receiving / summary.total_hospitals) * 100)}% healthy` : 'Active'}
          isPositive={true}
          variant="sage"
          sparklineData={[0, Math.max(summary.receiving, 1)]}
          gradientColors={['#10B981', '#34D399']}
        />

        {/* 3. Delayed Connectors */}
        <MetricMiniCard
          title="Delayed Connectors"
          value={`${summary.delayed}`}
          subtext="Pending expected sync"
          trend={summary.delayed === 0 ? 'Optimal' : `${summary.delayed} delayed`}
          isPositive={summary.delayed === 0}
          variant="yellow"
          sparklineData={[0, summary.delayed]}
          gradientColors={['#F59E0B', '#FBBF24']}
        />

        {/* 4. Failed / Errored */}
        <MetricMiniCard
          title="Failed / Errored"
          value={`${summary.failed}`}
          subtext="Ingestion error streams"
          trend={summary.failed === 0 ? 'Clear' : `${summary.failed} critical`}
          isPositive={summary.failed === 0}
          variant="peach"
          sparklineData={[0, summary.failed]}
          gradientColors={['#EF4444', '#FCA5A5']}
        />

        {/* 5. Total Ingested Rows (Showing No. of Rows instead of MB) */}
        <MetricMiniCard
          title="Total Ingested Rows"
          value={`${summary.total_records.toLocaleString()} Rows`}
          subtext="Processed payload rows"
          trend="Live API"
          isPositive={true}
          variant="lavender"
          sparklineData={recordsSparkline}
          gradientColors={['#8B5CF6', '#C084FC']}
        />

        {/* 6. Average Process Duration */}
        <MetricMiniCard
          title="Average Process Duration"
          value={summary.average_duration_seconds !== undefined ? `${summary.average_duration_seconds}s` : `${summary.average_response_time_ms} ms`}
          subtext={`Start: ${formatTimestamp(summary.latest_start_time || summary.last_successful_ingestion)} • End: ${formatTimestamp(summary.latest_end_time || summary.last_successful_ingestion)}`}
          trend={summary.average_response_time_ms < 300 ? 'Optimal execution' : 'High duration'}
          isPositive={summary.average_response_time_ms < 300}
          variant="sage"
          sparklineData={latencySparkline}
          gradientColors={['#3B82F6', '#60A5FA']}
        />

        {/* 7. Active Stream Health */}
        <MetricMiniCard
          title="Active Stream Health"
          value={summary.total_hospitals > 0 ? `${Math.round((summary.receiving / summary.total_hospitals) * 100)}%` : '100%'}
          subtext="Healthy vs total node ratio"
          trend={summary.receiving >= summary.total_hospitals ? "100% Optimal" : "Audit Needed"}
          isPositive={summary.receiving >= (summary.total_hospitals * 0.8)}
          variant="peach"
          sparklineData={[100, summary.total_hospitals > 0 ? Math.round((summary.receiving / summary.total_hospitals) * 100) : 100]}
          gradientColors={['#EA580C', '#F97316']}
        />

        {/* 8. Last Successful Sync */}
        <MetricMiniCard
          title="Last Successful Sync"
          value={formatTimestamp(summary.last_successful_ingestion)}
          subtext="Most recent ingestion"
          trend={summary.last_successful_ingestion ? "Live Feed" : "No Sync"}
          isPositive={Boolean(summary.last_successful_ingestion)}
          variant="sage"
          sparklineData={[1, 1]}
          gradientColors={['#10B981', '#6EE7B7']}
        />
      </div>

      {/* Top Status Summary Bar */}
      <Card variant="default" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Integration Health Summary Breakdown
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Receiving: <strong>{summary.receiving}</strong></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Delayed: <strong>{summary.delayed}</strong></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Failed: <strong>{summary.failed}</strong></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Unknown: <strong>{summary.unknown}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Hospital Ingestion Table (Horizontally Scrollable, Min Width 1550px) */}
      <Card variant="default" className="space-y-4 p-4 overflow-visible">
        <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>Showing <strong>{displayLogs.length}</strong> of <strong>{logs.length}</strong> hospital ingestion nodes</span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
            ← Scroll horizontally to view all telemetry columns →
          </span>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-x-auto overflow-y-visible rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <table className="w-full min-w-[1550px] text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm">
                {/* Sticky Column 1: Hospital ID */}
                <th className="py-3.5 px-3.5 w-[110px] min-w-[110px] sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 shadow-[1px_0_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_0_rgba(30,41,59,1)]">
                  Hospital ID
                </th>

                {/* Sticky Column 2: Hospital Name */}
                <th className="py-3.5 px-3.5 w-[220px] min-w-[220px] sticky left-[110px] z-20 bg-slate-100 dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Hospital Name
                </th>

                <th className="py-3.5 px-3.5 w-[170px] min-w-[170px]">Service Name</th>
                <th className="py-3.5 px-3.5 w-[150px] min-w-[150px]">Data Structure</th>
                <th className="py-3.5 px-3.5 w-[145px] min-w-[145px]">Last Received</th>
                <th className="py-3.5 px-3.5 w-[90px] min-w-[90px] text-right">Delay</th>
                <th className="py-3.5 px-3.5 w-[110px] min-w-[110px] text-right">Processed Rows</th>
                <th className="py-3.5 px-3.5 w-[130px] min-w-[130px] text-right leading-tight">
                  Process Duration<br />
                  <span className="text-[10px] font-normal text-slate-400">Avg Seconds</span>
                </th>
                <th className="py-3.5 px-3.5 w-[120px] min-w-[120px] text-center">Status</th>
                <th className="py-3.5 px-3.5 w-[160px] min-w-[160px] text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Ingestion Trend</span>
                    </div>
                  </div>
                </th>
                <th className="py-3.5 px-3.5 w-[180px] min-w-[180px] text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1">
                      <ActivitySquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Health Trend</span>
                    </div>
                  </div>
                </th>
                <th className="py-3.5 px-3.5 w-[240px] min-w-[240px]">Error Message</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500 font-bold">
                    No ingestion logs found matching current date range or filters.
                  </td>
                </tr>
              ) : (
                displayLogs.map(log => {
                  const { customThresholds, globalThresh } = getStoredThresholds();
                  const delay = computeDelayMinutes(log.received_at || log.start_time, log.delay_minutes);
                  const hId = log.hospital_id || log.hospital_code || '';
                  const threshold = customThresholds[hId] || globalThresh;
                  const statusInfo = getHospitalLiveStatus(delay, threshold);
                  const isErr = log.status === 'ERROR' || Boolean(log.error_message);
                  const effectiveStatus = isErr || statusInfo.label === 'CRITICAL' ? 'FAILED' : statusInfo.label === 'DELAYED' ? 'DELAYED' : 'RECEIVING';

                  return (
                    <tr key={log.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Sticky Cell 1: Hospital ID */}
                      <td className="py-3.5 px-3.5 w-[110px] min-w-[110px] font-mono font-bold sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors shadow-[1px_0_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_0_rgba(30,41,59,1)]">
                        <CopyButton text={log.hospital_id} />
                      </td>

                      {/* Sticky Cell 2: Hospital Name */}
                      <td className="py-3.5 px-3.5 w-[220px] min-w-[220px] font-bold text-slate-900 dark:text-white leading-snug whitespace-normal break-words sticky left-[110px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <Link to={`/hospitals/${log.hospital_id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {log.hospital_name}
                        </Link>
                      </td>

                      <td className="py-3.5 px-3.5 w-[170px] min-w-[170px] font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[160px]" title={log.service_name || 'GENERAL Process Data Entities'}>
                        {log.service_name || 'GENERAL Process Data Entities'}
                      </td>

                      <td className="py-3.5 px-3.5 w-[150px] min-w-[150px] font-mono">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-extrabold text-[11px] inline-block truncate max-w-[140px]" title={log.data_structure || log.data_type}>
                          {log.data_structure || log.data_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 w-[145px] min-w-[145px] font-mono whitespace-nowrap">
                        {formatTimestamp(log.received_at)}
                      </td>

                      <td className={`py-3.5 px-3.5 w-[90px] min-w-[90px] text-right font-mono font-bold ${
                        effectiveStatus === 'FAILED' ? 'text-rose-600 dark:text-rose-400' :
                        effectiveStatus === 'DELAYED' ? 'text-amber-600 dark:text-amber-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {delay} min
                      </td>

                      <td className="py-3.5 px-3.5 w-[110px] min-w-[110px] text-right font-mono font-bold text-slate-900 dark:text-white">
                        {(log.record_count ?? log.records_processed ?? 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">rows</span>
                      </td>

                      <td className="py-3.5 px-3.5 w-[130px] min-w-[130px] text-right font-mono font-bold">
                        <div className="text-slate-900 dark:text-white">
                          {log.duration_seconds !== undefined ? `${log.duration_seconds}s` : `${log.response_time_ms} ms`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-[125px]" title={log.start_time && log.end_time ? `Start: ${formatTimestamp(log.start_time)} | End: ${formatTimestamp(log.end_time)}` : `${log.response_time_ms}ms`}>
                          {log.start_time && log.end_time 
                            ? `${(log.start_time.split('T')[1] || log.start_time).substring(0, 8)} - ${(log.end_time.split('T')[1] || log.end_time).substring(0, 8)}` 
                            : `${log.response_time_ms}ms`}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 w-[120px] min-w-[120px] text-center">
                        <Badge
                          status={
                            effectiveStatus === 'RECEIVING' ? 'healthy' :
                            effectiveStatus === 'DELAYED' ? 'delayed' : 'critical'
                          }
                          size="sm"
                          customLabel={effectiveStatus}
                        />
                      </td>

                      <td className="py-3.5 px-3.5 w-[160px] min-w-[160px] text-center align-middle">
                        <SparklineCell points={log.trend_points} />
                      </td>

                      <td className="py-3.5 px-3.5 w-[180px] min-w-[180px] text-center align-middle">
                        <HealthSparklineCell points={log.health_trend_points} />
                      </td>

                      <td
                        className="py-3.5 px-3.5 w-[240px] min-w-[240px] text-rose-600 dark:text-rose-400 font-mono text-[11px] whitespace-normal break-words line-clamp-2 leading-tight"
                        title={log.error_message || undefined}
                      >
                        {log.error_message || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Integration Issues & Telemetry Failures Section */}
      <Card variant="default" className="space-y-4 border-2 border-rose-200/50 dark:border-rose-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 dark:border-rose-950 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
            <h3 className="font-heading font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">
              INTEGRATION ISSUES & TELEMETRY FAILURES
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
            {displayIssues.length} {displayIssues.length === 1 ? 'Failure Detected' : 'Failures Detected'}
          </span>
        </div>

        {displayIssues.length === 0 ? (
          <div className="p-6 text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span>All integrations healthy — No telemetry failures or error messages detected for the selected filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-900 shadow-inner">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b-2 border-rose-200 dark:border-rose-900 text-[11px] font-black uppercase text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40">
                  <th className="py-3 px-3.5">Hospital</th>
                  <th className="py-3 px-3.5">Data Structure</th>
                  <th className="py-3 px-3.5">Service Name</th>
                  <th className="py-3 px-3.5">Failure Time</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 dark:divide-rose-950 font-medium">
                {displayIssues.map(iss => (
                  <tr key={iss.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors">
                    <td className="py-3 px-3.5 font-bold">
                      <div className="flex items-center gap-2">
                        <CopyButton text={iss.hospital_code || iss.hospital_id} />
                        <Link to={`/hospitals/${iss.hospital_id}`} className="hover:underline text-slate-900 dark:text-white font-bold">
                          {iss.hospital_name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                        {iss.data_structure || iss.data_type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {iss.service_name || 'GENERAL Process Data Entities'}
                    </td>
                    <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                      {formatTimestamp(iss.received_at || iss.created_at)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <Badge status="critical" size="sm" customLabel={iss.status || 'ERROR'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
