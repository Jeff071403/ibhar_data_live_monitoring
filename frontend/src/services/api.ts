import type {
  Hospital,
  Encounter,
  Discharge,
  DataIngestionLog,
  Alert,
  TimeSeriesPoint,
  DataOperationItem,
  TopHospitalMetric,
  ReportItem,
  ReportFilters,
  ReportDetailData,
  DashboardMetrics,
  HospitalIntegrationTrend
} from '../types';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json() as T;
    return result;
  } catch (error) {
    console.warn(`[API] Backend endpoint ${endpoint} unavailable:`, error);
    return null;
  }
}

function mapHospitalFromBackend(h: any): Hospital {
  const statusStr = (h.status || 'unknown').toLowerCase();
  const validStatus: Hospital['status'] = ['healthy', 'delayed', 'warning', 'critical', 'offline', 'unknown'].includes(statusStr)
    ? (statusStr as Hospital['status'])
    : (h.status === 'ACTIVE' ? 'healthy' : 'offline');

  return {
    id: h.hospital_id || h.id || '',
    name: h.hospital_name || h.name || h.hospital_code || h.hospital_id || '',
    city: h.city || (h.hospital_name && h.hospital_name.includes(',') ? h.hospital_name.split(',')[1].trim() : 'India'),
    status: validStatus,
    lastDataReceived: h.last_data_received || 'Just now',
    expectedDataTime: h.expected_data_time || '12:00 PM',
    delayMinutes: h.delay_minutes ?? 0,
    dataFrequency: h.data_frequency || h.expected_interval_minutes || 30,
    dataVolumeMB: h.data_volume_mb ?? 0.0,
    recordsReceived: h.records_received ?? h.encounter_count ?? 0,
    serviceStatus: h.service_status || (h.status === 'ACTIVE' ? 'running' : 'stopped'),
    dataQuality: h.data_quality ?? 100,
    awsCost: h.aws_cost ?? 800,
    ipAddress: h.ip_address || '10.142.0.1',
    region: h.region || 'ap-south-1',
    hospitalCode: h.hospital_code || '',
    created_at: h.created_at,
    updated_at: h.updated_at
  };
}

export const apiService = {
  async getHospitals(): Promise<Hospital[] | null> {
    const res = await fetchFromBackend<any>('/hospitals/');
    if (res && res.success !== false) {
      const dataList = Array.isArray(res) ? res : (res.data || []);
      return dataList.map(mapHospitalFromBackend);
    }
    return res === null ? null : [];
  },

  async getHospitalById(id: string): Promise<Hospital | undefined> {
    const res = await fetchFromBackend<any>(`/hospitals/${id}/`);
    if (res && res.success !== false) {
      const item = res.data || res;
      return mapHospitalFromBackend(item);
    }
    return undefined;
  },

  async getHospitalHistory(id: string): Promise<TimeSeriesPoint[]> {
    const res = await fetchFromBackend<any>(`/analytics/${id}/`);
    if (res && res.success !== false) {
      const data = res.data || res;
      return data.hourly || data.ingestion_trend || [];
    }
    return [];
  },

  async getEncounters(hospitalId?: string): Promise<Encounter[]> {
    const query = hospitalId ? `?hospital_id=${encodeURIComponent(hospitalId)}` : '';
    const res = await fetchFromBackend<any>(`/encounters/${query}`);
    if (res && res.success !== false) {
      return Array.isArray(res) ? res : (res.data || []);
    }
    return [];
  },

  async getDischarges(hospitalId?: string): Promise<Discharge[]> {
    const query = hospitalId ? `?hospital_id=${encodeURIComponent(hospitalId)}` : '';
    const res = await fetchFromBackend<any>(`/discharges/${query}`);
    if (res && res.success !== false) {
      return Array.isArray(res) ? res : (res.data || []);
    }
    return [];
  },

  async getIngestionLogs(hospitalId?: string): Promise<DataIngestionLog[]> {
    const query = hospitalId ? `?hospital_id=${encodeURIComponent(hospitalId)}` : '';
    const res = await fetchFromBackend<any>(`/ingestion/${query}`);
    if (res && res.success !== false) {
      return Array.isArray(res) ? res : (res.data || []);
    }
    return [];
  },

  async getAlerts(filterType?: string): Promise<Alert[]> {
    const res = await fetchFromBackend<any>('/alerts/');
    if (res && res.success !== false) {
      const dataList = Array.isArray(res) ? res : (res.data || []);
      const mappedAlerts: Alert[] = dataList.map((a: any) => ({
        id: String(a.id),
        hospitalId: a.hospital || a.hospital_id || '',
        hospitalName: a.hospital_name || a.hospital_name_display || '',
        type: (a.type || a.severity || 'warning').toLowerCase(),
        title: a.title || a.alert_type || 'Alert',
        message: a.message || '',
        timestamp: a.time || a.detected_at || a.created_at || '',
        lastReceived: a.last_received || '',
        expectedTime: a.expected_time || '',
        category: a.category || a.metric_name || 'delay',
        isRead: Boolean(a.is_read || a.status === 'ACKNOWLEDGED' || a.status === 'RESOLVED'),
        severity: a.severity || 'WARNING',
        status: a.status || 'ACTIVE'
      }));

      if (!filterType || filterType === 'all') return mappedAlerts;
      return mappedAlerts.filter(a => a.type === filterType.toLowerCase() || a.severity?.toLowerCase() === filterType.toLowerCase());
    }
    return [];
  },

  async markAlertAsRead(alertId: string): Promise<boolean> {
    const result = await fetchFromBackend<{ status: string }>(`/alerts/${alertId}/read/`, {
      method: 'POST'
    });
    return result !== null;
  },

  async getDashboard(): Promise<DashboardMetrics | null> {
    const res = await fetchFromBackend<any>('/dashboard/');
    if (res && res.success !== false) {
      return res.data || res;
    }
    return null;
  },

  async getAnalytics(): Promise<{ hourly: TimeSeriesPoint[]; operations: DataOperationItem[] }> {
    const res = await fetchFromBackend<any>('/analytics/');
    if (res && res.success !== false) {
      const data = res.data || res;
      return {
        hourly: data.hourly || data.ingestion_trend || [],
        operations: data.operations || []
      };
    }
    return { hourly: [], operations: [] };
  },

  async getHospitalComparison(): Promise<TopHospitalMetric[]> {
    const res = await fetchFromBackend<any>('/hospitals/comparison/');
    if (res && res.success !== false) {
      const dataList = Array.isArray(res) ? res : (res.data || []);
      return dataList.map((item: any) => ({
        id: item.hospital_id,
        name: item.hospital_name,
        volumeMB: item.data_volume_mb || 0,
        quality: item.data_quality || 100
      }));
    }
    return [];
  },

  async getReports(filters?: ReportFilters): Promise<ReportItem[]> {
    const params = new URLSearchParams();
    if (filters?.date_preset) params.append('date_preset', filters.date_preset);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.hospital_id && filters.hospital_id !== 'ALL') params.append('hospital_id', filters.hospital_id);
    if (filters?.data_type && filters.data_type !== 'ALL') params.append('data_type', filters.data_type);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchFromBackend<any>(`/reports/${queryStr}`);
    if (res && res.success !== false) {
      return Array.isArray(res) ? res : (res.data || []);
    }
    return [];
  },

  async getReportDetails(reportId: string, filters?: ReportFilters): Promise<ReportDetailData | null> {
    const endpointMap: Record<string, string> = {
      'data-summary': '/reports/summary/',
      'delay-report': '/reports/delay/',
      'volume-report': '/reports/volume/',
      'latency-report': '/reports/latency/',
      'error-report': '/reports/errors/',
      'integration-health-report': '/reports/integration-health/'
    };

    const targetEndpoint = endpointMap[reportId];
    if (!targetEndpoint) return null;

    const params = new URLSearchParams();
    if (filters?.date_preset) params.append('date_preset', filters.date_preset);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.hospital_id && filters.hospital_id !== 'ALL') params.append('hospital_id', filters.hospital_id);
    if (filters?.data_type && filters.data_type !== 'ALL') params.append('data_type', filters.data_type);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchFromBackend<any>(`${targetEndpoint}${queryStr}`);
    if (res && res.success !== false) {
      return res.data || res;
    }
    return null;
  },


  async validateExcel(rows: any[]): Promise<any> {
    return await fetchFromBackend<any>('/hospitals/validate/', {
      method: 'POST',
      body: JSON.stringify({ rows })
    });
  },

  async confirmImport(rows: any[]): Promise<any> {
    return await fetchFromBackend<any>('/hospitals/import/', {
      method: 'POST',
      body: JSON.stringify({ rows })
    });
  },

  async getIntegrationHealth(filters?: { start_date?: string; end_date?: string; hospital_id?: string; status?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.hospital_id && filters.hospital_id !== 'ALL') params.append('hospital_id', filters.hospital_id);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchFromBackend<any>(`/ingestion/health/${queryStr}`);
    if (res && res.success !== false) {
      return res;
    }
    return null;
  },

  async getIntegrationHealthLogs(filters?: { hospital_id?: string; data_type?: string; status?: string }): Promise<DataIngestionLog[]> {
    const params = new URLSearchParams();
    if (filters?.hospital_id) params.append('hospital_id', filters.hospital_id);
    if (filters?.data_type) params.append('data_type', filters.data_type);
    if (filters?.status) params.append('status', filters.status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchFromBackend<any>(`/ingestion/${queryStr}`);
    if (res && res.success !== false) {
      return Array.isArray(res) ? res : (res.data || []);
    }
    return [];
  },

  async getLatestIntegration(hospitalId: string): Promise<DataIngestionLog | null> {
    const res = await fetchFromBackend<any>(`/ingestion/latest/${encodeURIComponent(hospitalId)}/`);
    if (res && res.success !== false) {
      return res.data || res;
    }
    return null;
  },

  async getIntegrationTrends(filters?: { start_date?: string; end_date?: string; hospital_id?: string; data_type?: string; status?: string }): Promise<HospitalIntegrationTrend[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.hospital_id && filters.hospital_id !== 'ALL') params.append('hospital_id', filters.hospital_id);
    if (filters?.data_type && filters.data_type !== 'ALL') params.append('data_type', filters.data_type);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchFromBackend<any>(`/ingestion/trend/${queryStr}`);
    if (res && res.success !== false) {
      return Array.isArray(res) ? res : (res.data || []);
    }
    return [];
  },

  async getProactiveHealthTrends(filters?: { start_date?: string; end_date?: string; hospital_id?: string; data_type?: string; status?: string; severity?: string; issue_type?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.hospital_id && filters.hospital_id !== 'ALL') params.append('hospital_id', filters.hospital_id);
    if (filters?.data_type && filters.data_type !== 'ALL') params.append('data_type', filters.data_type);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);
    if (filters?.issue_type && filters.issue_type !== 'ALL') params.append('issue_type', filters.issue_type);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchFromBackend<any>(`/ingestion/health-trend/${queryStr}`);
    if (res && res.success !== false) {
      return Array.isArray(res) ? res : (res.data || []);
    }
    return [];
  }
};
