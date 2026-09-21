import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Hospital,
  Alert,
  TimeSeriesPoint,
  Encounter,
  Discharge,
  DataIngestionLog,
  DashboardMetrics,
  IntegrationHealthResponse
} from '../types';
import { apiService } from '../services/api';

export type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

interface MonitoringContextType {
  hospitals: Hospital[];
  alerts: Alert[];
  timeSeries: TimeSeriesPoint[];
  encounters: Encounter[];
  discharges: Discharge[];
  ingestionLogs: DataIngestionLog[];
  dashboardMetrics: DashboardMetrics | null;
  integrationHealthData: IntegrationHealthResponse | null;
  lastUpdated: string;
  autoRefresh: boolean;
  timeRange: TimeRange;
  isLoading: boolean;
  isBackendConnected: boolean;
  apiError: string | null;
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
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [ingestionLogs, setIngestionLogs] = useState<DataIngestionLog[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [integrationHealthData, setIntegrationHealthData] = useState<IntegrationHealthResponse | null>(null);

  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSimulatingUpdate, setIsSimulatingUpdate] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);

  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const loadDataFromApi = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const [
        hospitalsRes,
        alertsRes,
        analyticsRes,
        dashboardRes,
        encountersRes,
        dischargesRes,
        ingestionRes,
        healthRes
      ] = await Promise.all([
        apiService.getHospitals(),
        apiService.getAlerts(),
        apiService.getAnalytics(),
        apiService.getDashboard(),
        apiService.getEncounters(),
        apiService.getDischarges(),
        apiService.getIngestionLogs(),
        apiService.getIntegrationHealth()
      ]);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (hospitalsRes !== null) {
        setHospitals(hospitalsRes);
        setIsBackendConnected(true);
        setApiError(null);
      } else {
        setIsBackendConnected(false);
        setApiError('Unable to connect to Django API backend (http://localhost:8000/api/). Please verify backend server is running.');
      }

      setAlerts(alertsRes || []);
      
      if (dashboardRes?.hourly_volume_trend && dashboardRes.hourly_volume_trend.length > 0) {
        setTimeSeries(dashboardRes.hourly_volume_trend);
      } else {
        setTimeSeries(analyticsRes.hourly || []);
      }

      if (dashboardRes?.recent_alerts && dashboardRes.recent_alerts.length > 0 && alertsRes.length === 0) {
        setAlerts(dashboardRes.recent_alerts);
      }

      setDashboardMetrics(dashboardRes);
      setEncounters(encountersRes || []);
      setDischarges(dischargesRes || []);
      setIngestionLogs(ingestionRes || []);
      if (healthRes) {
        setIntegrationHealthData(healthRes);
      }
      setLastUpdated(timeStr);

    } catch (error: any) {
      console.error('[Monitoring] Error loading live database data:', error);
      setIsBackendConnected(false);
      setApiError('Unable to load live telemetry data from Django backend API.');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDataFromApi();
  }, [loadDataFromApi]);

  const performLiveUpdate = useCallback(() => {
    setIsSimulatingUpdate(true);
    loadDataFromApi().finally(() => {
      setTimeout(() => setIsSimulatingUpdate(false), 500);
    });
  }, [loadDataFromApi]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      performLiveUpdate();
    }, 10000); // 10-second polling interval for live database monitoring
    return () => clearInterval(interval);
  }, [autoRefresh, performLiveUpdate]);

  const toggleAutoRefresh = () => setAutoRefresh(prev => !prev);
  const manualRefresh = () => performLiveUpdate();

  const markAlertAsRead = async (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
    await apiService.markAlertAsRead(alertId);
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
        encounters,
        discharges,
        ingestionLogs,
        dashboardMetrics,
        integrationHealthData,
        lastUpdated,
        autoRefresh,
        timeRange,
        isLoading,
        isBackendConnected,
        apiError,
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
