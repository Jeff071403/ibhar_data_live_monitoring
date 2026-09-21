import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMonitoring } from '../../hooks/useMonitoring';
import type { IntegrationHealthLog, IntegrationHealthResponse, IntegrationTrendPoint, HealthTrendPoint } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';
import { MetricMiniCard } from '../../components/cards/MetricMiniCard';
import { formatVolume } from '../../utils/formatters';
import {
  Activity,
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

export const IntegrationHealthPage: React.FC = () => {
  const {
    integrationHealthData: initialData,
    hospitals,
    lastUpdated: defaultLastUpdated,
    autoRefresh,
    manualRefresh,
    isLoading: isGlobalLoading,
    isBackendConnected,
    apiError
  } = useMonitoring();

  const [filteredHealthData, setFilteredHealthData] = useState<IntegrationHealthResponse | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('ALL');
  const [selectedDataType, setSelectedDataType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch filtered health data (including backend trend points) whenever date range or dropdown filters change
  const fetchFilteredData = useCallback(async () => {
    if (!startDate && !endDate && selectedHospital === 'ALL' && selectedStatus === 'ALL') {
      setFilteredHealthData(null);
      return;
    }
    setIsFilterLoading(true);
    try {
      const res = await apiService.getIntegrationHealth({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        hospital_id: selectedHospital !== 'ALL' ? selectedHospital : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined
      });
      if (res && res.success !== false) {
        setFilteredHealthData(res);
      }
    } catch (e) {
      console.error('[IntegrationHealth] Date filter fetch error:', e);
    } finally {
      setIsFilterLoading(false);
    }
  }, [startDate, endDate, selectedHospital, selectedStatus]);

  useEffect(() => {
    fetchFilteredData();
  }, [fetchFilteredData]);

  // Active data source: filteredHealthData if date range/dropdown active, else initialData from Context
  const activeData = filteredHealthData || initialData;

  const summary = activeData?.summary || {
    total_hospitals: hospitals.length || 0,
    receiving: 0,
    delayed: 0,
    failed: 0,
    unknown: 0,
    total_records: 0,
    total_volume_mb: 0.0,
    average_response_time_ms: 0,
    last_successful_ingestion: null
  };

  const logs: IntegrationHealthLog[] = useMemo(() => {
    return activeData?.data || [];
  }, [activeData]);

  const issues: IntegrationHealthLog[] = useMemo(() => {
    return activeData?.issues || [];
  }, [activeData]);

  const recentActivity: IntegrationHealthLog[] = useMemo(() => {
    return activeData?.recent_activity || [];
  }, [activeData]);

  // Extract unique data types for dropdown
  const availableDataTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.data_type && l.data_type !== 'N/A') set.add(l.data_type);
    });
    return Array.from(set);
  }, [logs]);

  // Filter logs based on search and client-side refinements
  const displayLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedHospital !== 'ALL' && log.hospital_id !== selectedHospital) return false;
      if (selectedDataType !== 'ALL' && log.data_type !== selectedDataType) return false;
      if (selectedStatus !== 'ALL' && log.integration_status !== selectedStatus) return false;

      // Date range check
      if (startDate || endDate) {
        if (!log.received_at && !log.created_at) return false;
        const logDateStr = (log.received_at || log.created_at || '').substring(0, 10);
        if (startDate && logDateStr < startDate) return false;
        if (endDate && logDateStr > endDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = log.hospital_name?.toLowerCase().includes(q);
        const matchId = log.hospital_id?.toLowerCase().includes(q);
        const matchType = log.data_type?.toLowerCase().includes(q);
        const matchStatus = log.integration_status?.toLowerCase().includes(q);
        const matchError = log.error_message?.toLowerCase().includes(q);
        return matchName || matchId || matchType || matchStatus || matchError;
      }
      return true;
    });
  }, [logs, selectedHospital, selectedDataType, selectedStatus, startDate, endDate, searchQuery]);

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
    setSelectedHospital('ALL');
    setSelectedDataType('ALL');
    setSelectedStatus('ALL');
    setStartDate('');
    setEndDate('');
    setFilteredHealthData(null);
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedHospital !== 'ALL' || selectedDataType !== 'ALL' || selectedStatus !== 'ALL' || startDate || endDate
  );

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

      {/* Date Range & Filter Control Bar */}
      <Card variant="default" className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
            <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Filter Integration Telemetry By Date Range & Criteria
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
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            />
          </div>

          {/* Hospital Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Hospital
            </label>
            <select
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Hospitals ({hospitals.length})</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.id} — {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data Type Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Data Type
            </label>
            <select
              value={selectedDataType}
              onChange={e => setSelectedDataType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Data Types</option>
              {availableDataTypes.map(dt => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="RECEIVING">RECEIVING</option>
              <option value="DELAYED">DELAYED</option>
              <option value="FAILED">FAILED</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </div>

          {/* Search Bar Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Applied Filters Banner */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-blue-600 dark:text-blue-400">Active Filters:</span>
              {startDate && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">From: {startDate}</span>}
              {endDate && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">To: {endDate}</span>}
              {selectedHospital !== 'ALL' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Hospital: {selectedHospital}</span>}
              {selectedDataType !== 'ALL' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Type: {selectedDataType}</span>}
              {selectedStatus !== 'ALL' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Status: {selectedStatus}</span>}
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

      {/* 8 Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricMiniCard
          title="Total Hospitals"
          value={`${summary.total_hospitals}`}
          subtext="Configured connectors"
          trend="Live DB"
          isPositive={true}
          variant="peach"
          sparklineData={[summary.total_hospitals, summary.total_hospitals]}
          gradientColors={['#F43F5E', '#FDA4AF']}
        />

        <MetricMiniCard
          title="Receiving Data"
          value={`${summary.receiving}`}
          subtext="Healthy telemetry feed"
          trend="Active"
          isPositive={true}
          variant="sage"
          sparklineData={[0, summary.receiving]}
          gradientColors={['#10B981', '#34D399']}
        />

        <MetricMiniCard
          title="Delayed Connectors"
          value={`${summary.delayed}`}
          subtext="Pending expected sync"
          trend={summary.delayed === 0 ? 'Optimal' : 'Needs audit'}
          isPositive={summary.delayed === 0}
          variant="yellow"
          sparklineData={[0, summary.delayed]}
          gradientColors={['#F59E0B', '#FBBF24']}
        />

        <MetricMiniCard
          title="Failed / Errored"
          value={`${summary.failed}`}
          subtext="Ingestion errors"
          trend={summary.failed === 0 ? 'Clear' : 'Critical'}
          isPositive={summary.failed === 0}
          variant="peach"
          sparklineData={[0, summary.failed]}
          gradientColors={['#EF4444', '#FCA5A5']}
        />

        <MetricMiniCard
          title="Total Records Received"
          value={`${summary.total_records}`}
          subtext="Parsed HL7/FHIR payloads"
          trend="Live DB"
          isPositive={true}
          variant="lavender"
          sparklineData={[0, Math.min(summary.total_records, 100), summary.total_records]}
          gradientColors={['#8B5CF6', '#C084FC']}
        />

        <MetricMiniCard
          title="Average Response Time"
          value={`${summary.average_response_time_ms} ms`}
          subtext="Ingestion server latency"
          trend={summary.average_response_time_ms < 300 ? 'Fast' : 'Slow'}
          isPositive={summary.average_response_time_ms < 300}
          variant="sage"
          sparklineData={[summary.average_response_time_ms, summary.average_response_time_ms]}
          gradientColors={['#3B82F6', '#60A5FA']}
        />

        <MetricMiniCard
          title="Total Data Volume"
          value={`${summary.total_volume_mb} MB`}
          subtext="Cumulative payload size"
          trend="Live DB"
          isPositive={true}
          variant="peach"
          sparklineData={[0, summary.total_volume_mb]}
          gradientColors={['#EA580C', '#F97316']}
        />

        <MetricMiniCard
          title="Last Successful Sync"
          value={formatTimestamp(summary.last_successful_ingestion)}
          subtext="Most recent ingestion"
          trend="Synced"
          isPositive={true}
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
            ← Scroll horizontally to view all 12 telemetry columns →
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

                <th className="py-3.5 px-3.5 w-[130px] min-w-[130px]">Data Type</th>
                <th className="py-3.5 px-3.5 w-[145px] min-w-[145px]">Last Received</th>
                <th className="py-3.5 px-3.5 w-[90px] min-w-[90px] text-right">Delay</th>
                <th className="py-3.5 px-3.5 w-[90px] min-w-[90px] text-right">Records</th>
                <th className="py-3.5 px-3.5 w-[100px] min-w-[100px] text-right">Volume</th>
                <th className="py-3.5 px-3.5 w-[115px] min-w-[115px] text-right leading-tight">
                  Response<br />Time
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
                displayLogs.map(log => (
                  <tr key={log.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Sticky Cell 1: Hospital ID */}
                    <td className="py-3.5 px-3.5 w-[110px] min-w-[110px] font-mono font-bold sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors shadow-[1px_0_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_0_rgba(30,41,59,1)]">
                      <CopyButton text={log.hospital_id} />
                    </td>

                    {/* Sticky Cell 2: Hospital Name (Supports 1-2 line natural wrapping for long names) */}
                    <td className="py-3.5 px-3.5 w-[220px] min-w-[220px] font-bold text-slate-900 dark:text-white leading-snug whitespace-normal break-words sticky left-[110px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <Link to={`/hospitals/${log.hospital_id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {log.hospital_name}
                      </Link>
                    </td>

                    <td className="py-3.5 px-3.5 w-[130px] min-w-[130px] font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-extrabold text-[11px] inline-block">
                        {log.data_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 w-[145px] min-w-[145px] font-mono whitespace-nowrap">
                      {formatTimestamp(log.received_at)}
                    </td>

                    <td className={`py-3.5 px-3.5 w-[90px] min-w-[90px] text-right font-mono font-bold ${
                      log.delay_minutes > 30 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {log.delay_minutes} min
                    </td>

                    <td className="py-3.5 px-3.5 w-[90px] min-w-[90px] text-right font-mono font-bold">
                      {log.record_count}
                    </td>

                    <td className="py-3.5 px-3.5 w-[100px] min-w-[100px] text-right font-mono font-bold">
                      {formatVolume(log.data_size_mb)}
                    </td>

                    <td className="py-3.5 px-3.5 w-[115px] min-w-[115px] text-right font-mono font-bold">
                      {log.response_time_ms} ms
                    </td>

                    <td className="py-3.5 px-3.5 w-[120px] min-w-[120px] text-center">
                      <Badge
                        status={
                          log.integration_status === 'RECEIVING' ? 'healthy' :
                          log.integration_status === 'DELAYED' ? 'delayed' :
                          log.integration_status === 'FAILED' ? 'critical' : 'offline'
                        }
                        size="sm"
                        customLabel={log.integration_status}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Integration Issues Section */}
      <Card variant="default" className="space-y-4 border-2 border-rose-200/50 dark:border-rose-900/40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
          <h3 className="font-heading font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">
            INTEGRATION ISSUES & TELEMETRY FAILURES
          </h3>
        </div>

        {issues.length === 0 ? (
          <div className="p-6 text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span>All integrations are healthy — No telemetry failures or error messages detected in Supabase DB for this date range.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500">
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Error Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {issues.map(iss => (
                  <tr key={iss.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                    <td className="py-2.5 px-3 font-bold">
                      <Link to={`/hospitals/${iss.hospital_id}`} className="hover:underline text-slate-900 dark:text-white">
                        {iss.hospital_name} ({iss.hospital_id})
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{iss.data_type}</td>
                    <td className="py-2.5 px-3 font-mono">{formatTimestamp(iss.received_at)}</td>
                    <td className="py-2.5 px-3">
                      <Badge status="critical" size="sm" customLabel={iss.status} />
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                      {iss.error_message || 'Ingestion Failed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Ingestion Activity Section */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
          <h3 className="font-heading font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">
            RECENT INGESTION ACTIVITY LOGS
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Hospital</th>
                <th className="py-2.5 px-3">Data Type</th>
                <th className="py-2.5 px-3 text-right">Records</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-3 text-right">Response Time</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-bold">
                    No recent ingestion logs available for this date range.
                  </td>
                </tr>
              ) : (
                recentActivity.map(act => (
                  <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-mono font-bold">{formatTimestamp(act.received_at)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      <Link to={`/hospitals/${act.hospital_id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                        {act.hospital_name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{act.data_type}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{act.record_count}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{formatVolume(act.data_size_mb)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{act.response_time_ms} ms</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge
                        status={act.status === 'SUCCESS' ? 'healthy' : 'critical'}
                        size="sm"
                        customLabel={act.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};
