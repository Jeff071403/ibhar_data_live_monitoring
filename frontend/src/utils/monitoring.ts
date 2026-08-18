import type { Hospital } from '../data/mockHospitals';

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
    case 'critical': return 'Critical';
    case 'offline': return 'Offline';
    default: return 'Unknown';
  }
};
