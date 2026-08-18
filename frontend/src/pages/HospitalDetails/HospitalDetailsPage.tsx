import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMonitoring } from '../../hooks/useMonitoring';
import { apiService } from '../../services/api';
import type { Hospital } from '../../data/mockHospitals';
import type { TimeSeriesPoint } from '../../data/mockAnalytics';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';
import { HospitalTimeline } from '../../components/hospitals/HospitalTimeline';
import { Skeleton } from '../../components/common/Skeleton';
import { formatCurrencyINR, formatVolume, formatNumber } from '../../utils/formatters';
import {
  ArrowLeft,
  Server,
  Globe,
  Sparkles,
  FileText,
  Download,
  Calendar,
  Loader2,
  MoreHorizontal,
  Settings
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const HospitalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getHospitalById, hospitals } = useMonitoring();
  const navigate = useNavigate();

  const hospitalIndex = hospitals.findIndex(h => h.id === id);
  const colors: ('blue' | 'sage' | 'yellow' | 'peach')[] = ['blue', 'sage', 'yellow', 'peach'];
  const cardColorVariant = hospitalIndex !== -1 ? colors[hospitalIndex % colors.length] : 'peach';

  const [hospital, setHospital] = useState<Hospital | undefined>(undefined);
  const [history, setHistory] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Report center states
  const [reportType, setReportType] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [reportRange, setReportRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [reportReady, setReportReady] = useState(false);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);

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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const found = getHospitalById(id);
    if (found) {
      setHospital(found);
      apiService.getHospitalHistory(id).then(res => {
        setHistory(res);
        setLoading(false);
      });
    } else {
      apiService.getHospitalById(id).then(res => {
        setHospital(res);
        if (res) {
          apiService.getHospitalHistory(id).then(hRes => {
            setHistory(hRes);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
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
  const strokeColor = themeColor;

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

      {/* 8 Primary Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            Last Received
          </span>
          <span className="font-mono text-xs font-bold text-textLight-heading dark:text-textNight-heading">
            {hospital.lastDataReceived}
          </span>
        </Card>

        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            Expected
          </span>
          <span className="font-mono text-xs font-bold text-textLight-heading dark:text-textNight-heading">
            {hospital.expectedDataTime}
          </span>
        </Card>

        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            Delay
          </span>
          <span className={`font-mono text-xs font-bold ${
            hospital.delayMinutes > 30 ? 'text-[#8E3B49] dark:text-[#D99AA5]' : 'text-[#47664B] dark:text-[#91B7A5]'
          }`}>
            {hospital.delayMinutes} min
          </span>
        </Card>

        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            Service
          </span>
          <span className="font-cute text-xs font-bold uppercase text-textLight-heading dark:text-textNight-heading">
            {hospital.serviceStatus}
          </span>
        </Card>

        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            Quality
          </span>
          <span className="font-mono text-xs font-bold text-textLight-heading dark:text-textNight-heading">
            {hospital.dataQuality}%
          </span>
        </Card>

        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            Records
          </span>
          <span className="font-mono text-xs font-bold text-textLight-heading dark:text-textNight-heading">
            {formatNumber(hospital.recordsReceived)}
          </span>
        </Card>

        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            Volume
          </span>
          <span className="font-mono text-xs font-bold text-textLight-heading dark:text-textNight-heading">
            {formatVolume(hospital.dataVolumeMB)}
          </span>
        </Card>

        <Card variant="default" style={{ borderColor: `${themeColor}35` }} className="p-3 text-center">
          <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted block mb-1">
            AWS Cost
          </span>
          <span className="font-mono text-xs font-bold text-[#8A6F1E] dark:text-[#E5C46E]">
            {formatCurrencyINR(hospital.awsCost)}
          </span>
        </Card>
      </div>

      {/* Data Flow Timeline Section */}
      <Card variant="default" style={{ borderColor: `${themeColor}35` }}>
        <HospitalTimeline delayMinutes={hospital.delayMinutes} />
      </Card>

      {/* Historical Payload Volume Chart for this Hospital */}
      <Card variant="default" style={{ borderColor: `${themeColor}35` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
              HOURLY TELEMETRY VOLUME TREND
            </h3>
            <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
              Transmission volume profile for {hospital.id} in past 7 hours
            </p>
          </div>
          <Sparkles className={`w-4 h-4 ${themeTextClass}`} />
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hospHistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke={strokeColor} fontSize={11} fontFamily="Manrope" />
              <YAxis stroke={strokeColor} fontSize={11} fontFamily="Manrope" unit=" MB" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-nude-card dark:bg-night-cardElevated p-3 rounded-xl border border-[#EFE4DC] dark:border-[#193247] shadow-xl text-xs font-sans">
                        <p className="font-bold text-textLight-heading dark:text-textNight-heading mb-1">{label}</p>
                        <p className="text-lightAccent-softBlue dark:text-nightAccent-powderBlue font-mono font-bold">
                          Volume: {payload[0].value} MB
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="volumeMB" stroke={strokeColor} strokeWidth={2.5} fill="url(#hospHistGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
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

          {/* Column 2: Data Options */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80">
            <h4 className="font-cute font-extrabold text-xs text-textLight-heading dark:text-textNight-heading uppercase tracking-wider">
              2. Data Content
            </h4>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 text-xs text-textLight-secondary dark:text-textNight-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={isGenerating}
                  checked={includeAlerts}
                  onChange={(e) => setIncludeAlerts(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold block">Include Incident Records</span>
                  <span className="text-[10px] text-textLight-muted dark:text-textNight-muted">
                    Append recent connection drops and delay flags.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-textLight-secondary dark:text-textNight-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={isGenerating}
                  checked={includeTimeline}
                  onChange={(e) => setIncludeTimeline(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold block">Include Raw Metrics Stream</span>
                  <span className="text-[10px] text-textLight-muted dark:text-textNight-muted">
                    Include data volumes and quality scores.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Column 3: Actions & Progress Center */}
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
