export interface Alert {
  id: string;
  hospitalId: string;
  hospitalName: string;
  type: 'critical' | 'warning' | 'resolved';
  title: string;
  message: string;
  timestamp: string;
  lastReceived: string;
  expectedTime: string;
  category: 'delay' | 'volume' | 'service' | 'quality';
  isRead: boolean;
}

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-1001',
    hospitalId: 'HOSP-023',
    hospitalName: 'Apollo Hospital, Chennai',
    type: 'critical',
    title: 'Data Delayed by 4 Hours',
    message: 'No HL7 batch files received since 08:00 AM. Ingestion pipeline waiting.',
    timestamp: '12:02 PM',
    lastReceived: '08:00 AM',
    expectedTime: '12:00 PM',
    category: 'delay',
    isRead: false
  },
  {
    id: 'ALT-1002',
    hospitalId: 'HOSP-041',
    hospitalName: 'Fortis Healthcare, Bengaluru',
    type: 'critical',
    title: 'Service Unavailable (Stopped)',
    message: 'Local connector agent offline. Ping test timed out after 3000ms.',
    timestamp: '11:45 AM',
    lastReceived: '06:50 AM',
    expectedTime: '12:00 PM',
    category: 'service',
    isRead: false
  },
  {
    id: 'ALT-1003',
    hospitalId: 'HOSP-012',
    hospitalName: 'Manipal Hospital, Delhi NCR',
    type: 'warning',
    title: 'Data Volume Dropped by 60%',
    message: 'Received only 45 MB compared to 3-day average of 115 MB.',
    timestamp: '11:30 AM',
    lastReceived: '10:25 AM',
    expectedTime: '12:00 PM',
    category: 'volume',
    isRead: false
  },
  {
    id: 'ALT-1004',
    hospitalId: 'HOSP-084',
    hospitalName: 'Narayana Health, Kolkata',
    type: 'critical',
    title: 'Data Quality Threshold Warning (52%)',
    message: 'High duplicate patient records detected in payload (48% rejected).',
    timestamp: '11:15 AM',
    lastReceived: '08:50 AM',
    expectedTime: '12:00 PM',
    category: 'quality',
    isRead: false
  },
  {
    id: 'ALT-1005',
    hospitalId: 'HOSP-067',
    hospitalName: 'Aster Medcity, Kochi',
    type: 'warning',
    title: 'Ingestion Delay (80 Minutes)',
    message: 'Queue processing backlog in ap-south-1 worker instances.',
    timestamp: '10:50 AM',
    lastReceived: '10:40 AM',
    expectedTime: '12:00 PM',
    category: 'delay',
    isRead: true
  },
  {
    id: 'ALT-1006',
    hospitalId: 'HOSP-089',
    hospitalName: 'VPS Lakeshore, Thiruvananthapuram',
    type: 'warning',
    title: 'Connector Memory Spike',
    message: 'Connector memory usage > 88%. Data sync interval extended to 45 min.',
    timestamp: '10:15 AM',
    lastReceived: '10:10 AM',
    expectedTime: '12:00 PM',
    category: 'service',
    isRead: true
  },
  {
    id: 'ALT-1007',
    hospitalId: 'HOSP-007',
    hospitalName: 'Medanta Medicity, Lucknow',
    type: 'resolved',
    title: 'Ingestion Pipeline Restored',
    message: 'Delayed batch processed successfully. 14,200 records indexed.',
    timestamp: '09:40 AM',
    lastReceived: '09:35 AM',
    expectedTime: '09:30 AM',
    category: 'delay',
    isRead: true
  },
  {
    id: 'ALT-1008',
    hospitalId: 'HOSP-014',
    hospitalName: 'Kauvery Hospital, Coimbatore',
    type: 'resolved',
    title: 'API Gateway SSL Certificate Renewed',
    message: 'SSL Handshake issue resolved. Data transfer back to 30 min frequency.',
    timestamp: '08:20 AM',
    lastReceived: '08:15 AM',
    expectedTime: '08:30 AM',
    category: 'service',
    isRead: true
  }
];
