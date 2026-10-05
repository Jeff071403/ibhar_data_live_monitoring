import { CheckCircle2, Clock, Activity, RefreshCw } from 'lucide-react';

interface HospitalTimelineProps {
  delayMinutes?: number;
  lastSyncedAt?: string | null;
  lastDataReceived?: string;
  status?: string;
  expectedIntervalMinutes?: number;
}

function getTimeSinceLastData(timestamp?: string | null, fallback?: string): string {
  const target = timestamp || fallback;
  if (!target) return 'Just now';
  try {
    const d = new Date(target);
    if (isNaN(d.getTime())) {
      return target;
    }
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 0) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHrs < 24) {
      const remMin = diffMin % 60;
      return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ${remMin}m ago`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch {
    return target;
  }
}

function formatExactSyncTime(timestamp?: string | null, fallback?: string): string {
  const target = timestamp || fallback;
  if (!target) return 'Just now';
  try {
    const d = new Date(target);
    if (isNaN(d.getTime())) return target;
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return target;
  }
}

export const HospitalTimeline: React.FC<HospitalTimelineProps> = ({
  lastSyncedAt,
  lastDataReceived,
  expectedIntervalMinutes = 30
}) => {
  const timeSinceLastData = getTimeSinceLastData(lastSyncedAt, lastDataReceived);
  const exactSyncTime = formatExactSyncTime(lastSyncedAt, lastDataReceived);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-heading font-extrabold text-sm text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>DATA FLOW TIMELINE</span>
          </h4>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Real-time telemetry synchronization status and verified transmission timestamps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-nude-cardSec dark:bg-night-cardSoft border border-black/5 dark:border-white/5 text-textLight-muted dark:text-textNight-muted flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-blue-500" /> Interval: {expectedIntervalMinutes} min
          </span>
        </div>
      </div>

      {/* Two Timeline Cards: Time Since Last Data & Last Successful Sync */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Time Since Last Data */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-blue-200/60 dark:border-blue-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-cute font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Time Since Last Data
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-textLight-heading dark:text-textNight-heading">
            {timeSinceLastData}
          </div>
          <p className="text-xs text-textLight-muted dark:text-textNight-muted font-sans mt-1">
            Real-time elapsed duration since last data packet transmission
          </p>
        </div>

        {/* 2. Last Successful Sync */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-cute font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Last Successful Sync
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              VERIFIED
            </span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-textLight-heading dark:text-textNight-heading">
            {exactSyncTime}
          </div>
          <p className="text-xs text-textLight-muted dark:text-textNight-muted font-sans mt-1">
            Confirmed telemetry batch receipt and processing at gateway
          </p>
        </div>
      </div>
    </div>
  );
};

