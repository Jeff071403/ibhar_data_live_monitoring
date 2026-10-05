import type { Hospital } from '../types';

export interface MonitoringThresholds {
  healthyMaxMinutes: number; // 0-30 min
  delayedMaxMinutes: number; // 30-60 min
  warningMaxMinutes: number; // 60-120 min
}

export const DEFAULT_THRESHOLDS: MonitoringThresholds = {
  healthyMaxMinutes: 30,
  delayedMaxMinutes: 60,
  warningMaxMinutes: 120,
};

export const parseDateComponents = (tsStr?: string | null): Date | null => {
  if (!tsStr || typeof tsStr !== 'string') return null;
  const clean = tsStr.trim();
  if (!clean) return null;

  const match = clean.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = match[6] ? parseInt(match[6], 10) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }

  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? null : fallback;
};

export const computeDelayMinutes = (receivedAt?: string | null, serverDelay?: number): number => {
  if (!receivedAt) return serverDelay ?? 0;
  try {
    const recDate = parseDateComponents(receivedAt);
    if (!recDate || isNaN(recDate.getTime())) return serverDelay ?? 0;
    const now = new Date();
    const diffMs = now.getTime() - recDate.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  } catch {
    return serverDelay ?? 0;
  }
};

export interface LiveStatusInfo {
  label: 'CRITICAL' | 'DELAYED' | 'RECEIVING';
  priority: number;
  rowBg: string;
  textColor: string;
}

export const getHospitalLiveStatus = (
  delay: number,
  thresholds: { receivingMaxMinutes?: number; delayedMaxMinutes?: number } = { receivingMaxMinutes: 30, delayedMaxMinutes: 61 }
): LiveStatusInfo => {
  const delayedMax = thresholds.delayedMaxMinutes ?? 61;
  const receivingMax = thresholds.receivingMaxMinutes ?? 30;

  if (delay > delayedMax) {
    return {
      label: 'CRITICAL',
      priority: 1,
      rowBg: 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/40',
      textColor: 'text-rose-600 dark:text-rose-400',
    };
  }
  if (delay > receivingMax) {
    return {
      label: 'DELAYED',
      priority: 2,
      rowBg: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
    };
  }
  return {
    label: 'RECEIVING',
    priority: 3,
    rowBg: 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  };
};

export const getStoredThresholds = () => {
  let customThresholds: Record<string, { receivingMaxMinutes: number; delayedMaxMinutes: number }> = {};
  let globalThresh = { receivingMaxMinutes: 30, delayedMaxMinutes: 61 };
  try {
    const savedCustom = localStorage.getItem('ibhar_hospital_thresholds');
    if (savedCustom) customThresholds = JSON.parse(savedCustom);
    const savedGlobal = localStorage.getItem('ibhar_global_threshold');
    if (savedGlobal) globalThresh = JSON.parse(savedGlobal);
  } catch {
    // Ignore error
  }
  return { customThresholds, globalThresh };
};

export const getHospitalStatus = (
  delayMinutes: number,
  serviceStatus: 'running' | 'degraded' | 'stopped',
  thresholds: MonitoringThresholds = DEFAULT_THRESHOLDS
): 'healthy' | 'delayed' | 'warning' | 'critical' | 'offline' => {
  if (serviceStatus === 'stopped') {
    return delayMinutes > 300 ? 'offline' : 'critical';
  }
  if (delayMinutes <= thresholds.healthyMaxMinutes && serviceStatus === 'running') {
    return 'healthy';
  }
  if (delayMinutes <= thresholds.delayedMaxMinutes) {
    return 'delayed';
  }
  if (delayMinutes <= thresholds.warningMaxMinutes || serviceStatus === 'degraded') {
    return 'warning';
  }
  return 'critical';
};

export const getStatusLabel = (status: Hospital['status']): string => {
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'delayed': return 'Delayed';
    case 'warning': return 'Warning';
    case 'critical': return 'Issue';
    case 'offline': return 'Offline';
    default: return 'Unknown';
  }
};

