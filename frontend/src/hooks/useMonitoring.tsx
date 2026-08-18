import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_HOSPITALS, type Hospital } from '../data/mockHospitals';
import { MOCK_ALERTS, type Alert } from '../data/mockAlerts';
import { MOCK_HOURLY_SERIES, type TimeSeriesPoint } from '../data/mockAnalytics';

export type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

interface MonitoringContextType {
  hospitals: Hospital[];
  alerts: Alert[];
  timeSeries: TimeSeriesPoint[];
  lastUpdated: string;
  autoRefresh: boolean;
  timeRange: TimeRange;
  toggleAutoRefresh: () => void;
  manualRefresh: () => void;
  setTimeRange: (range: TimeRange) => void;
  markAlertAsRead: (alertId: string) => void;
  getHospitalById: (id: string) => Hospital | undefined;
  unreadAlertsCount: number;
  isSimulatingUpdate: boolean;
  importHospitals: (newHospitals: Hospital[]) => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>(MOCK_HOSPITALS);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>(MOCK_HOURLY_SERIES);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [isSimulatingUpdate, setIsSimulatingUpdate] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const performLiveUpdate = useCallback(() => {
    setIsSimulatingUpdate(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setHospitals(prevHospitals =>
      prevHospitals.map(h => {
        if (h.status === 'healthy' || h.status === 'delayed') {
          const volumeDelta = (Math.random() - 0.48) * 1.5;
          const recordsDelta = Math.floor((Math.random() - 0.45) * 120);
          return {
            ...h,
            dataVolumeMB: Math.max(10, Math.round((h.dataVolumeMB + volumeDelta) * 10) / 10),
            recordsReceived: Math.max(500, h.recordsReceived + recordsDelta),
          };
        }
        return h;
      })
    );

    setTimeSeries(prev => {
      const next = [...prev];
      if (next.length > 0) {
        const last = { ...next[next.length - 1] };
        last.volumeMB = Math.max(100, Math.round((last.volumeMB + (Math.random() - 0.4) * 2) * 10) / 10);
        next[next.length - 1] = last;
      }
      return next;
    });

    setLastUpdated(timeStr);
    setTimeout(() => setIsSimulatingUpdate(false), 800);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      performLiveUpdate();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, performLiveUpdate]);

  const toggleAutoRefresh = () => setAutoRefresh(prev => !prev);
  const manualRefresh = () => performLiveUpdate();

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const getHospitalById = (id: string) => {
    return hospitals.find(h => h.id.toLowerCase() === id.toLowerCase());
  };

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  const importHospitals = useCallback((newHospitals: Hospital[]) => {
    setHospitals(prev => [...prev, ...newHospitals]);
  }, []);

  return (
    <MonitoringContext.Provider
      value={{
        hospitals,
        alerts,
        timeSeries,
        lastUpdated,
        autoRefresh,
        timeRange,
        toggleAutoRefresh,
        manualRefresh,
        setTimeRange,
        markAlertAsRead,
        getHospitalById,
        unreadAlertsCount,
        isSimulatingUpdate,
        importHospitals
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = (): MonitoringContextType => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};
