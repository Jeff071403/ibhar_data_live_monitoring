export interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: 'summary' | 'delay' | 'volume' | 'frequency' | 'cost';
  lastGenerated: string;
  fileSize: string;
  recordCount: number;
  iconName: string;
}

export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'REP-001',
    title: 'Data Summary Report',
    description: 'Comprehensive overall hospital telemetry summary, packet integrity & total record stats.',
    category: 'summary',
    lastGenerated: 'Today at 12:00 PM',
    fileSize: '4.8 MB',
    recordCount: 90,
    iconName: 'FileText'
  },
  {
    id: 'REP-002',
    title: 'Delay & Latency Audit Report',
    description: 'Detailed analysis of transmission delays, connector timeouts and offline intervals.',
    category: 'delay',
    lastGenerated: 'Today at 11:30 AM',
    fileSize: '2.3 MB',
    recordCount: 18,
    iconName: 'Clock'
  },
  {
    id: 'REP-003',
    title: 'Data Volume & Payload Report',
    description: 'Breakdown of megabytes transferred per hospital, bandwidth utilization & compression ratio.',
    category: 'volume',
    lastGenerated: 'Today at 10:45 AM',
    fileSize: '3.1 MB',
    recordCount: 90,
    iconName: 'HardDrive'
  },
  {
    id: 'REP-004',
    title: 'Sync Frequency & Reliability Report',
    description: 'Evaluation of 30-minute sync windows, missing intervals and expected vs actual arrivals.',
    category: 'frequency',
    lastGenerated: 'Yesterday at 11:59 PM',
    fileSize: '5.2 MB',
    recordCount: 90,
    iconName: 'Activity'
  },
  {
    id: 'REP-005',
    title: 'AWS Infrastructure Cost Report',
    description: 'Monthly cloud infrastructure allocation, egress charges per hospital & ingestion pipeline expenses.',
    category: 'cost',
    lastGenerated: '1st of this month',
    fileSize: '1.9 MB',
    recordCount: 90,
    iconName: 'DollarSign'
  }
];
