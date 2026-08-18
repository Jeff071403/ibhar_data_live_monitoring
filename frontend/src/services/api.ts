import { MOCK_HOSPITALS, type Hospital } from '../data/mockHospitals';
import { MOCK_ALERTS, type Alert } from '../data/mockAlerts';
import { MOCK_HOURLY_SERIES, MOCK_OPERATIONS, MOCK_TOP_HOSPITALS_COMPARISON, type TimeSeriesPoint, type DataOperationItem, type TopHospitalMetric } from '../data/mockAnalytics';
import { MOCK_REPORTS, type ReportItem } from '../data/mockReports';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper to determine if we should fall back to mock data
let useMockFallback = false;

const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (useMockFallback) {
    return null;
  }
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
    return await response.json() as T;
  } catch (error) {
    console.warn(`Django backend connection failed for ${endpoint}. Falling back to client-side mock data.`, error);
    return null;
  }
}

function mapHospitalFromBackend(h: any): Hospital {
  return {
    id: h.hospital_id,
    name: h.name,
    city: h.city,
    status: h.status,
    lastDataReceived: h.last_data_received,
    expectedDataTime: h.expected_data_time,
    delayMinutes: h.delay_minutes,
    dataFrequency: h.data_frequency,
    dataVolumeMB: h.data_volume_mb,
    recordsReceived: h.records_received,
    serviceStatus: h.service_status,
    dataQuality: h.data_quality,
    awsCost: h.aws_cost,
    ipAddress: h.ip_address || '',
    region: h.region || 'ap-south-1'
  };
}

export const apiService = {
  async getHospitals(): Promise<Hospital[]> {
    const data = await fetchFromBackend<any[]>('/hospitals/');
    if (data) return data.map(mapHospitalFromBackend);
    
    await delay(50);
    return [...MOCK_HOSPITALS];
  },

  async getHospitalById(id: string): Promise<Hospital | undefined> {
    const data = await fetchFromBackend<any>(`/hospitals/${id}/`);
    if (data) return mapHospitalFromBackend(data);

    await delay(30);
    return MOCK_HOSPITALS.find(h => h.id.toUpperCase() === id.toUpperCase());
  },

  async getHospitalStatus(id: string): Promise<{ status: Hospital['status']; delayMinutes: number; lastReceived: string } | undefined> {
    const data = await fetchFromBackend<any>(`/hospitals/${id}/`);
    if (data) {
      return {
        status: data.status,
        delayMinutes: data.delay_minutes,
        lastReceived: data.last_data_received
      };
    }

    await delay(30);
    const hospital = MOCK_HOSPITALS.find(h => h.id.toUpperCase() === id.toUpperCase());
    if (!hospital) return undefined;
    return {
      status: hospital.status,
      delayMinutes: hospital.delayMinutes,
      lastReceived: hospital.lastDataReceived
    };
  },

  async getHospitalHistory(id: string): Promise<TimeSeriesPoint[]> {
    await delay(40);
    const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return MOCK_HOURLY_SERIES.map((pt, idx) => ({
      ...pt,
      volumeMB: Math.max(10, pt.volumeMB + (charCodeSum % 15) - idx * 2),
      dataQuality: Math.min(100, pt.dataQuality + (idx % 2 === 0 ? 1 : -1))
    }));
  },

  async getAlerts(filterType?: string): Promise<Alert[]> {
    const data = await fetchFromBackend<any[]>('/alerts/');
    if (data) {
      const mappedAlerts: Alert[] = data.map((a: any) => ({
        id: String(a.id),
        hospitalId: a.hospital || '',
        hospitalName: a.hospital_name || '',
        type: a.type || 'warning',
        title: a.title || '',
        message: a.message || '',
        timestamp: a.time || '',
        lastReceived: a.last_received || '',
        expectedTime: a.expected_time || '',
        category: a.category || 'delay',
        isRead: a.is_read || false
      }));

      if (!filterType || filterType === 'all') return mappedAlerts;
      return mappedAlerts.filter(a => a.type === filterType);
    }

    await delay(40);
    if (!filterType || filterType === 'all') return [...MOCK_ALERTS];
    return MOCK_ALERTS.filter(a => a.type === filterType);
  },

  async markAlertAsRead(alertId: string): Promise<boolean> {
    const result = await fetchFromBackend<{ status: string }>(`/alerts/${alertId}/read/`, {
      method: 'POST'
    });
    return result !== null;
  },

  async getAnalytics(): Promise<{ hourly: TimeSeriesPoint[]; operations: DataOperationItem[] }> {
    await delay(50);
    return {
      hourly: [...MOCK_HOURLY_SERIES],
      operations: [...MOCK_OPERATIONS]
    };
  },

  async getHospitalComparison(): Promise<TopHospitalMetric[]> {
    await delay(40);
    return [...MOCK_TOP_HOSPITALS_COMPARISON];
  },

  async getReports(): Promise<ReportItem[]> {
    await delay(30);
    return [...MOCK_REPORTS];
  },

  async validateExcel(rows: any[]): Promise<any> {
    const data = await fetchFromBackend<any>('/hospitals/validate/', {
      method: 'POST',
      body: JSON.stringify({ rows })
    });
    return data;
  },

  async confirmImport(rows: any[]): Promise<any> {
    const data = await fetchFromBackend<any>('/hospitals/import/', {
      method: 'POST',
      body: JSON.stringify({ rows })
    });
    return data;
  }
};
