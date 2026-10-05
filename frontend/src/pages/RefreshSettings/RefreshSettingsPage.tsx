import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/common/Card';
import {
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2,
  Sparkles,
  Play,
  Pause,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useMonitoring } from '../../hooks/useMonitoring';

interface RefreshOption {
  minutes: number;
  label: string;
  sublabel: string;
  badge?: string;
  description: string;
  recommended?: boolean;
}

export const RefreshSettingsPage: React.FC = () => {
  const {
    refreshIntervalMinutes,
    setRefreshIntervalMinutes,
    autoRefresh,
    toggleAutoRefresh,
    manualRefresh,
    isSimulatingUpdate,
    lastUpdated
  } = useMonitoring();

  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const refreshOptions: RefreshOption[] = [
    {
      minutes: 5,
      label: '5 Minutes',
      sublabel: '300 seconds',
      badge: 'High Frequency',
      description: 'Rapid real-time telemetry polling for intensive monitoring and critical alert surveillance.',
    },
    {
      minutes: 10,
      label: '10 Minutes',
      sublabel: '600 seconds',
      badge: 'Fast',
      description: 'Frequent telemetry intake suitable for high-volume hospital intake hours.',
    },
    {
      minutes: 20,
      label: '20 Minutes',
      sublabel: '1,200 seconds',
      description: 'Balanced frequency that minimizes client compute while maintaining fresh dashboards.',
    },
    {
      minutes: 30,
      label: '30 Minutes',
      sublabel: '1,800 seconds',
      badge: 'Standard',
      recommended: true,
      description: 'Default hospital batch schedule matching standard HL7 and clinical pipeline sync intervals.',
    },
    {
      minutes: 40,
      label: '40 Minutes',
      sublabel: '2,400 seconds',
      description: 'Extended window for stable institutions with low hourly transaction fluctuations.',
    },
    {
      minutes: 45,
      label: '45 Minutes',
      sublabel: '2,700 seconds',
      description: 'Reduced polling rate for conserving bandwidth and client-side processing.',
    },
    {
      minutes: 60,
      label: '60 Minutes',
      sublabel: '1 Hour',
      badge: 'Hourly',
      description: 'Hourly snapshot cadence for administrative overview and high-level health tracking.',
    },
    {
      minutes: 120,
      label: '120 Minutes',
      sublabel: '2 Hours',
      badge: 'Archival',
      description: 'Long-cadence periodic synchronization for background auditing and archival nodes.',
    },
  ];

  const handleSelect = (mins: number) => {
    setRefreshIntervalMinutes(mins);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleManualSyncNow = () => {
    manualRefresh();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            TELEMETRY REFRESH SETTINGS
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans mt-1">
            Configure automatic background synchronization intervals for live hospital telemetry streams
          </p>
        </div>

        {/* Current Active Cadence Status Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
              Active: {refreshIntervalMinutes} Minutes
            </span>
          </div>
        </div>
      </div>

      {/* Control Banner */}
      <Card className="p-5 sm:p-6 border-2 border-slate-200/80 dark:border-slate-800 shadow-md bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Live Sync Engine Status
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
              Automatic Sync is {autoRefresh ? 'Enabled' : 'Paused'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last Telemetry Sync: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lastUpdated}</span> • Running every <span className="font-bold text-blue-600 dark:text-blue-400">{refreshIntervalMinutes} min</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm border ${
                autoRefresh
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-4 h-4" /> Pause Auto-Sync
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume Auto-Sync
                </>
              )}
            </button>

            <button
              onClick={handleManualSyncNow}
              disabled={isSimulatingUpdate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSimulatingUpdate ? 'animate-spin' : ''}`} />
              Trigger Sync Now
            </button>
          </div>
        </div>

        <AnimatePresence>
          {savedNotice && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Refresh setting updated! The dashboard will now automatically poll telemetry every {refreshIntervalMinutes} minutes.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Interval Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-cute uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            CHOOSE DESIRED TELEMETRY REFRESH INTERVAL
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {refreshOptions.length} available rates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {refreshOptions.map((opt) => {
            const isSelected = refreshIntervalMinutes === opt.minutes;

            return (
              <div
                key={opt.minutes}
                onClick={() => handleSelect(opt.minutes)}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-md'
                }`}
              >
                {/* Top Row: Icon & Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`p-2.5 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-slate-700/80 group-hover:text-blue-600'
                    }`}
                  >
                    {opt.minutes <= 10 ? (
                      <Zap className="w-5 h-5" />
                    ) : opt.minutes <= 30 ? (
                      <RefreshCw className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {opt.badge && (
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Labels */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                      {opt.label}
                    </h4>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 font-bold mb-2">
                    {opt.sublabel}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                {/* Bottom Selection Indicator */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-extrabold ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? 'Active Interval' : 'Click to Apply'}
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400 translate-x-0.5'
                        : 'text-slate-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-slate-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Architecture Footnote */}
      <Card className="p-5 border-2 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          How Telemetry Syncing Works
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">
              1. Non-Blocking REST API
            </span>
            <p>
              Telemetry polling queries the live cloud endpoint without locking hospital database instances or draining connection pools.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">
              2. Local Preference Persistence
            </span>
            <p>
              Your chosen refresh rate is stored securely in your browser cache and maintained across subsequent sessions and browser tabs.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">
              3. Rate Throttling & Resilience
            </span>
            <p>
              Built-in debounce guards prevent multiple duplicate requests from triggering if a previous telemetry batch is still synchronizing.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
