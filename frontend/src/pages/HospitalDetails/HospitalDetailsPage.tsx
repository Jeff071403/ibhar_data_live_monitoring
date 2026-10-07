import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMonitoring } from '../../hooks/useMonitoring';
import { apiService } from '../../services/api';
import type { Hospital, LiveHospital } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';
import { HospitalTimeline } from '../../components/hospitals/HospitalTimeline';
import { Skeleton } from '../../components/common/Skeleton';
import { formatVolume, formatNumber } from '../../utils/formatters';
import { parseDateComponents } from '../../utils/monitoring';
import {
  ArrowLeft,
  Server,
  Globe,
  FileText,
  Download,
  Calendar,
  Loader2,
  MoreHorizontal,
  Settings,
  AlertTriangle,
  Code2,
  Terminal,
  Check,
  Copy,
  Database,
  Layers
} from 'lucide-react';

export const HospitalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getHospitalById, hospitals, alerts } = useMonitoring();
  const navigate = useNavigate();

  const hospitalIndex = hospitals.findIndex(h => h.id === id);
  const colors: ('blue' | 'sage' | 'yellow' | 'peach')[] = ['blue', 'sage', 'yellow', 'peach'];
  const cardColorVariant = hospitalIndex !== -1 ? colors[hospitalIndex % colors.length] : 'peach';

  const [hospital, setHospital] = useState<Hospital | undefined>(undefined);
  const [liveHospital, setLiveHospital] = useState<LiveHospital | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeQueryTab, setActiveQueryTab] = useState<'insert' | 'update' | 'general'>('insert');
  const [copiedQueryKey, setCopiedQueryKey] = useState<string | null>(null);

  // Report center states
  const [reportType, setReportType] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [reportRange, setReportRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [reportReady, setReportReady] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setReportReady(false);
    setGenerationProgress(0);
    setGenerationStep('Initializing connection to hospital node...');

    const steps = [
      { progress: 20, step: 'Downloading telemetry records...' },
      { progress: 45, step: 'Auditing transmission frequency gaps...' },
      { progress: 70, step: 'Calculating average data latency...' },
      { progress: 90, step: 'Generating statistical summaries...' },
      { progress: 100, step: 'Compiling export document...' }
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setGenerationProgress(s.progress);
        setGenerationStep(s.step);
        if (s.progress === 100) {
          setTimeout(() => {
            setIsGenerating(false);
            setReportReady(true);
          }, 300);
        }
      }, (idx + 1) * 600);
    });
  };

  const handleDownload = () => {
    if (!hospital) return;
    const reportTitle = `${hospital.name.replace(/ /g, '_')}_Telemetry_Report.txt`;
    const reportContent = `
========================================================================
             IBHAR LIVE NETWORK MONITORING AUDIT REPORT
========================================================================
Generated On: ${new Date().toLocaleString()}
Hospital Node: ${hospital.name} (ID: ${hospital.id})
Region: ${hospital.region}
IP Address: ${hospital.ipAddress}
Agent Status: ${hospital.serviceStatus.toUpperCase()}

-------------------------- AUDIT METRICS -------------------------------
Expected Interval:  ${hospital.dataFrequency} minutes
Quality Score:      ${hospital.dataQuality}%
Data Volume Today:  ${formatVolume(hospital.dataVolumeMB)}
Records Received:   ${formatNumber(hospital.recordsReceived)}
Current Delay:      ${hospital.delayMinutes} minutes
Last Sync Time:     ${hospital.lastDataReceived}

-------------------------- AUDIT SUMMARY -------------------------------
Node ${hospital.name} is currently running at ${hospital.serviceStatus} service level.
Telemetry health score is audited at ${hospital.dataQuality}%, representing ${
      hospital.dataQuality >= 90 ? 'OPTIMAL' : 'DEGRADED'
    } transmission health.
A total of ${formatNumber(hospital.recordsReceived)} packets were audited today, comprising
${formatVolume(hospital.dataVolumeMB)} of total telemetry data volume.
Sync delay is currently at ${hospital.delayMinutes} minutes.

------------------------------------------------------------------------
                       End of Telemetry Audit Report
========================================================================
`;
    const element = document.createElement("a");
    const file = new Blob([reportContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = reportTitle;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyQuery = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryKey(key);
    setTimeout(() => setCopiedQueryKey(null), 2000);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const found = getHospitalById(id);
    if (found) {
      setHospital(found);
      setLoading(false);
      const codeToFetch = found.hospitalCode || found.id || id;
      apiService.getLiveHospital(codeToFetch).then(liveRes => {
        if (liveRes) setLiveHospital(liveRes);
      });
    } else {
      apiService.getHospitalById(id).then(res => {
        if (res) {
          setHospital(res);
          const codeToFetch = res.hospitalCode || res.id || id;
          apiService.getLiveHospital(codeToFetch).then(liveRes => {
            if (liveRes) setLiveHospital(liveRes);
          });
        }
        setLoading(false);
      });
    }
  }, [id, getHospitalById]);

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="text-center py-16">
        <h2 className="font-heading font-bold text-xl text-textLight-heading dark:text-textNight-heading mb-2">
          Hospital Not Found
        </h2>
        <p className="text-xs text-textLight-secondary dark:text-textNight-secondary mb-4">
          No hospital telemetry node matching ID "{id}" was registered in IBHAR network.
        </p>
        <button
          onClick={() => navigate('/hospitals')}
          className="px-4 py-2 rounded-xl bg-lightAccent-peach/20 text-lightAccent-peach text-xs font-bold font-cute"
        >
          Return to Hospital Directory
        </button>
      </div>
    );
  }

  const getThemeHexColor = (variant: 'blue' | 'sage' | 'yellow' | 'peach') => {
    switch (variant) {
      case 'sage': return '#10b981'; // emerald-500
      case 'yellow': return '#f59e0b'; // amber-500
      case 'blue': return '#3b82f6'; // blue-500
      case 'peach':
      default: return '#f43f5e'; // rose-500
    }
  };

  const getThemeTextClass = (variant: 'blue' | 'sage' | 'yellow' | 'peach') => {
    switch (variant) {
      case 'sage': return 'text-emerald-500';
      case 'yellow': return 'text-amber-500';
      case 'blue': return 'text-blue-500';
      case 'peach':
      default: return 'text-rose-500';
    }
  };

  const getThemeClasses = (variant: 'blue' | 'sage' | 'yellow' | 'peach') => {
    switch (variant) {
      case 'sage':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/25',
          border: 'border-emerald-500/30 dark:border-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'yellow':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/25',
          border: 'border-amber-500/30 dark:border-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400'
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/25',
          border: 'border-blue-500/30 dark:border-blue-500/20',
          text: 'text-blue-600 dark:text-blue-400'
        };
      case 'peach':
      default:
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/25',
          border: 'border-rose-500/30 dark:border-rose-500/20',
          text: 'text-rose-600 dark:text-rose-400'
        };
    }
  };

  const getFormattedFolderDate = () => {
    const d = new Date();
    const days = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getFormattedFolderTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const themeColor = getThemeHexColor(cardColorVariant);
  const themeTextClass = getThemeTextClass(cardColorVariant);
  const currentTheme = getThemeClasses(cardColorVariant);
  const detailBorderClass = currentTheme.border;

  // Compute active & historical errors within the 20-day retention window
  const currentCode = (hospital?.hospitalCode || hospital?.id || id || '').toLowerCase();
  const currentName = (hospital?.name || '').toLowerCase();

  const hospitalAlerts = alerts.filter(a => {
    const aHospId = (a.hospitalId || '').toLowerCase();
    const aHospName = (a.hospitalName || '').toLowerCase();
    return (aHospId && (aHospId === currentCode || aHospId === (id || '').toLowerCase())) ||
           (aHospName && currentName && aHospName === currentName);
  });

  const rawErrors: Array<{
    data_structure?: string;
    error_text?: string;
    time?: string | null;
    insert_sql?: string | null;
    update_sql?: string | null;
    general_sql?: string | null;
  }> = [
    ...(liveHospital?.latest_errors || []),
    ...hospitalAlerts.map(a => ({
      data_structure: a.category || 'IN_PATIENT_INFO',
      error_text: a.message,
      time: a.timestamp,
      insert_sql: a.insert_sql,
      update_sql: a.update_sql,
      general_sql: a.general_sql
    }))
  ];

  const now = new Date();
  const RETENTION_DAYS = 20;
  const seenErrors = new Set<string>();
  const errorList = rawErrors.filter(err => {
    if (!err.error_text) return false;
    const key = `${err.error_text}-${err.data_structure || ''}-${err.time || ''}`;
    if (seenErrors.has(key)) return false;
    seenErrors.add(key);

    if (err.time) {
      try {
        const dt = parseDateComponents(err.time) || new Date(err.time);
        if (!isNaN(dt.getTime())) {
          const diffDays = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > RETENTION_DAYS) {
            return false;
          }
        }
      } catch {
        // preserve if unparseable
      }
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/hospitals"
          className="inline-flex items-center gap-1.5 text-xs font-cute font-bold text-textLight-secondary dark:text-textNight-secondary hover:text-lightAccent-peach dark:hover:text-nightAccent-peach transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hospitals List</span>
        </Link>

        <div className="flex items-center gap-2">
          <CopyButton text={hospital.id} />
          <Badge status={hospital.status} size="lg" />
        </div>
      </div>

      {/* Main Hero Header Card */}
      <Card variant={cardColorVariant} className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-cute uppercase tracking-wider text-white/80 mb-1">
              <span>{hospital.city} Node</span>
              <span>•</span>
              <span>{hospital.region}</span>
            </div>

            <h1 className="font-heading font-extrabold text-2xl lg:text-3xl text-white tracking-tight mb-2">
              {hospital.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/85">
              <span className="flex items-center gap-1 font-mono">
                <Globe className="w-3.5 h-3.5 text-white/90" /> IP: {hospital.ipAddress}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-white/90" /> Agent Status:{' '}
                <strong className="text-white underline decoration-2">
                  {hospital.serviceStatus.toUpperCase()}
                </strong>
              </span>
            </div>
          </div>

        </div>
      </Card>

      {/* 8 Primary Metrics Cards Grid (Derived from Live Telemetry API) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Last Received / Last Sync */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            LAST RECEIVED
          </span>
          <span className="font-mono text-sm sm:text-base font-black text-textLight-heading dark:text-textNight-heading">
            {liveHospital?.last_synced_at
              ? new Date(liveHospital.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : hospital.lastDataReceived}
          </span>
        </div>

        {/* 2. Expected Interval */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            EXPECTED
          </span>
          <span className="font-mono text-sm sm:text-base font-black text-textLight-heading dark:text-textNight-heading leading-tight">
            {hospital.dataFrequency || 30} min
          </span>
          <span className="text-[9px] font-mono font-medium text-textLight-muted dark:text-textNight-muted mt-0.5">
            interval
          </span>
        </div>

        {/* 3. Delay */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            DELAY
          </span>
          <span className={`font-mono text-sm sm:text-base font-black ${
            hospital.delayMinutes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {hospital.delayMinutes} min
          </span>
        </div>

        {/* 4. Service / Sync Status */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            STATUS
          </span>
          <span className={`font-mono text-xs sm:text-sm font-black uppercase ${
            (liveHospital?.status || hospital.status) === 'error'
              ? 'text-red-600 dark:text-red-400'
              : (liveHospital?.status || hospital.status) === 'delayed'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {(liveHospital?.status || hospital.status || 'healthy').toUpperCase()}
          </span>
        </div>

        {/* 5. Quality / Completeness */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            COMPLETENESS
          </span>
          <span className="font-mono text-sm sm:text-base font-black text-textLight-heading dark:text-textNight-heading">
            {Math.round((liveHospital?.completeness ?? (hospital.dataQuality / 100)) * 100)}%
          </span>
        </div>

        {/* 6. Records Processed */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            PROCESSED
          </span>
          <span className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
            {formatNumber(liveHospital?.records_processed ?? liveHospital?.success_count ?? hospital.recordsReceived)}
          </span>
        </div>

        {/* 7. Records Available (Replaced mock Volume) */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            AVAILABLE
          </span>
          <span className="font-mono text-sm sm:text-base font-black text-textLight-heading dark:text-textNight-heading">
            {formatNumber(liveHospital?.records_available ?? liveHospital?.records_processed ?? hospital.recordsReceived)}
          </span>
        </div>

        {/* 8. Errors / Failures (Captured in last 20 days) */}
        <div className="bg-white/80 dark:bg-night-card/80 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/40 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[95px] transition-all hover:border-amber-300 dark:hover:border-white/20">
          <span className="text-[10px] font-sans font-semibold tracking-wider text-textLight-muted dark:text-textNight-muted uppercase block mb-1">
            ERRORS
          </span>
          <span className={`font-mono text-sm sm:text-base font-black ${
            errorList.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {errorList.length}
          </span>
        </div>
      </div>

      {/* Live Telemetry Error & SQL Query Trace Inspector */}
      {errorList.length > 0 && (
        <Card variant="default" className="border-red-400/60 dark:border-red-500/40 overflow-hidden shadow-xl bg-gradient-to-b from-red-500/[0.04] to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-500/10 dark:bg-red-950/40 border-b border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-black text-sm sm:text-base text-red-600 dark:text-red-400 tracking-tight">
                    LIVE TELEMETRY ERROR & SQL QUERY TRACE
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40">
                    {errorList.length} Incident{errorList.length > 1 ? 's' : ''} (Last 20 Days)
                  </span>
                </div>
                <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
                  Exact API failure diagnostics, error trace, and executed SQL query payloads captured from telemetry stream.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {errorList.map((errItem, errIdx) => {
              const activeQuery =
                activeQueryTab === 'insert'
                  ? (errItem.insert_sql || 'No Insert SQL query payload recorded.')
                  : activeQueryTab === 'update'
                  ? (errItem.update_sql || 'No Update SQL query payload recorded.')
                  : (errItem.general_sql || 'No General SQL query payload recorded.');

              const hasActiveQuery =
                activeQueryTab === 'insert'
                  ? !!errItem.insert_sql
                  : activeQueryTab === 'update'
                  ? !!errItem.update_sql
                  : !!errItem.general_sql;

              return (
                <div key={errIdx} className="space-y-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 p-4 border border-red-200/50 dark:border-red-900/30 shadow-sm">
                  {/* Error Meta Information */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-textLight-heading dark:text-textNight-heading flex items-center gap-1.5 font-mono">
                        <Layers className="w-3.5 h-3.5 text-lightAccent-peach dark:text-nightAccent-peach" />
                        Component / Data Structure: <span className="px-2 py-0.5 rounded-md bg-nude-peachTint/60 dark:bg-night-cardElevated text-xs font-bold">{errItem.data_structure || 'IN_PATIENT_INFO'}</span>
                      </span>
                    </div>

                    {errItem.time && (
                      <span className="text-[11px] font-mono text-textLight-muted dark:text-textNight-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Timestamp: {errItem.time}
                      </span>
                    )}
                  </div>

                  {/* Exact Error Message from JSON */}
                  <div>
                    <label className="text-[11px] font-cute font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1.5 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" /> Exact Error Message (ErrorText)
                    </label>
                    <div className="p-3.5 rounded-xl bg-red-950/10 dark:bg-red-950/40 border border-red-400/40 dark:border-red-800/40 text-xs font-mono text-red-700 dark:text-red-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                      {errItem.error_text}
                    </div>
                  </div>

                  {/* SQL Queries from API */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <label className="text-[11px] font-cute font-extrabold uppercase tracking-wider text-textLight-heading dark:text-textNight-heading flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-500" /> Executed SQL Queries from API
                      </label>

                      {/* Query Selection Tabs */}
                      <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-black/5 dark:border-white/10 shadow-sm">
                        {(['insert', 'update', 'general'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveQueryTab(tab)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              activeQueryTab === tab
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-textLight-secondary dark:text-textNight-secondary hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            {tab === 'insert' ? 'InsertSQL' : tab === 'update' ? 'UpdateSQL' : 'GeneralSQL'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SQL Code Block */}
                    <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                        <span className="font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          {activeQueryTab === 'insert' ? 'Insert Query Payload (InsertSQL)' : activeQueryTab === 'update' ? 'Update Query Payload (UpdateSQL)' : 'General Query Payload (GeneralSQL)'}
                        </span>

                        {hasActiveQuery && (
                          <button
                            onClick={() => handleCopyQuery(activeQuery, `${errIdx}-${activeQueryTab}`)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                          >
                            {copiedQueryKey === `${errIdx}-${activeQueryTab}` ? (
                              <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Query</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <pre className="whitespace-pre-wrap leading-relaxed select-all text-slate-200">
                        {activeQuery}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Data Flow Timeline Section */}
      <Card variant="default" style={{ borderColor: `${themeColor}35` }}>
        <HospitalTimeline
          delayMinutes={hospital.delayMinutes}
          lastSyncedAt={liveHospital?.last_synced_at}
          lastDataReceived={hospital.lastDataReceived}
          status={liveHospital?.status || hospital.status}
          expectedIntervalMinutes={hospital.dataFrequency || 30}
        />
      </Card>

      {/* Hospital Telemetry Report Center Card */}
      <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${detailBorderClass}`}>
              <FileText className={`w-5 h-5 ${themeTextClass}`} />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-textLight-heading dark:text-textNight-heading tracking-tight">
                HOSPITAL TELEMETRY REPORT CENTER
              </h3>
              <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
                Configure, compile and download detailed performance reports and raw audit files.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Column 1: Config Form */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80">
            <h4 className="font-cute font-extrabold text-xs text-textLight-heading dark:text-textNight-heading uppercase tracking-wider">
              1. Report Settings
            </h4>
            
            {/* Format Selection */}
            <div>
              <label className="block text-[11px] font-cute uppercase text-textLight-muted dark:text-textNight-muted mb-1.5">
                Document Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pdf', 'excel', 'csv'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => { if (!isGenerating) setReportType(fmt); }}
                    className={`py-1.5 rounded-xl text-xs font-cute font-bold transition-all border ${
                      reportType === fmt
                        ? `${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shadow-sm`
                        : 'bg-white dark:bg-slate-900 text-textLight-secondary dark:text-textNight-secondary border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Range Selection */}
            <div>
              <label className="block text-[11px] font-cute uppercase text-textLight-muted dark:text-textNight-muted mb-1.5">
                Audit Date Range
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: '24h', label: '24 Hours' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' }
                ] as const).map((rng) => (
                  <button
                    key={rng.id}
                    onClick={() => { if (!isGenerating) setReportRange(rng.id); }}
                    className={`py-1.5 rounded-xl text-xs font-cute font-bold transition-all border ${
                      reportRange === rng.id
                        ? `${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shadow-sm`
                        : 'bg-white dark:bg-slate-900 text-textLight-secondary dark:text-textNight-secondary border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {rng.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Actions & Progress Center */}
          <div className="flex flex-col justify-center items-center p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 text-center">
            {/* Case A: Initial State */}
            {!isGenerating && !reportReady && (
              <div className="space-y-3 w-full">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-slate-100 dark:bg-slate-800 border ${detailBorderClass}`}>
                  <Calendar className={`w-5 h-5 ${themeTextClass}`} />
                </div>
                <div>
                  <h5 className="font-heading font-bold text-sm text-textLight-heading dark:text-textNight-heading">
                    Report Ready to Compile
                  </h5>
                  <p className="text-[11px] text-textLight-muted dark:text-textNight-muted mt-0.5">
                    Click below to compile telemetry logs.
                  </p>
                </div>
                <button
                  onClick={handleGenerateReport}
                  className={`w-full py-2 rounded-xl text-xs font-cute font-extrabold text-white cursor-pointer transition-all shadow-md ${
                    cardColorVariant === 'sage'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                      : cardColorVariant === 'yellow'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                      : cardColorVariant === 'blue'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  Generate Telemetry Report
                </button>
              </div>
            )}

            {/* Case B: Generating Loader State */}
            {isGenerating && (
              <div className="space-y-4 w-full px-4">
                <Loader2 className={`w-8 h-8 animate-spin mx-auto ${themeTextClass}`} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-sans text-textLight-muted dark:text-textNight-muted">
                    <span className="font-medium animate-pulse">{generationStep}</span>
                    <span className="font-mono font-bold">{generationProgress}%</span>
                  </div>
                  {/* Progress Bar Track */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className={`h-full rounded-full ${
                        cardColorVariant === 'sage'
                          ? 'bg-emerald-500'
                          : cardColorVariant === 'yellow'
                          ? 'bg-amber-500'
                          : cardColorVariant === 'blue'
                          ? 'bg-blue-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Case C: Report Ready State (Folder Design aligned to screenshot) */}
            {reportReady && (
              <div className="relative w-full max-w-[280px] mx-auto select-none mt-2">
                {/* Folder Tab (Back Flap) */}
                <div className="flex items-end">
                  <div
                    className="h-8 w-24 rounded-tl-2xl"
                    style={{ backgroundColor: themeColor }}
                  />
                  <div
                    className="h-5 flex-1 rounded-tr-2xl"
                    style={{ backgroundColor: themeColor }}
                  />
                </div>

                {/* Folder Back Body */}
                <div
                  className="w-full h-10 relative z-0"
                  style={{ backgroundColor: themeColor }}
                >
                  {/* Document Sticking Out (The white sheet of paper) */}
                  <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    className="absolute left-3 right-3 top-2 bg-white rounded-xl shadow-md px-3 py-2 z-10 flex items-center justify-between border border-slate-200"
                    style={{ height: '56px' }}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="font-mono font-bold text-slate-800 text-[10px] whitespace-nowrap">
                        {getFormattedFolderDate()}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                        cardColorVariant === 'sage'
                          ? 'bg-emerald-50 text-emerald-600'
                          : cardColorVariant === 'yellow'
                          ? 'bg-amber-50 text-amber-600'
                          : cardColorVariant === 'blue'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {getFormattedFolderTime()}
                      </span>
                    </div>
                    <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </motion.div>
                </div>

                {/* Folder Front Pocket */}
                <div
                  className="relative z-20 w-full rounded-b-3xl rounded-t-none p-4 shadow-xl text-white flex flex-col justify-between animate-fade-in-up"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
                    marginTop: '44px', // pushes it down to reveal the document
                    height: '160px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-white/5 rounded-b-3xl rounded-t-xl pointer-events-none" />

                  {/* Front Pocket Top Content */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <h4 className="font-heading font-extrabold text-sm tracking-tight text-white">
                        Audit Reports
                      </h4>
                      <p className="text-[9px] text-white/80 font-sans mt-0.5">
                        {formatNumber(hospital.recordsReceived)} records compiled
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 shrink-0">
                      <Calendar className="w-4 h-4" />
                      <Settings className="w-4 h-4 hover:rotate-90 transition-transform duration-500 cursor-pointer" />
                    </div>
                  </div>

                  {/* Front Pocket Footer Actions */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-cute font-extrabold bg-white text-slate-800 hover:bg-white/95 shadow-sm cursor-pointer transition-all"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                      <button
                        onClick={() => { setReportReady(false); handleGenerateReport(); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-cute font-extrabold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm cursor-pointer transition-all"
                      >
                        Re-Compile
                      </button>
                    </div>
                    <p className="text-[9px] text-white/70 text-center font-mono">
                      Last Created: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
