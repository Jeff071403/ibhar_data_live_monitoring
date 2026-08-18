export interface TimeSeriesPoint {
  time: string;
  volumeMB: number;
  frequencyScore: number; // %
  avgDelayMin: number;
  issuesCount: number;
  dataQuality: number;
}

export interface DataOperationItem {
  name: string;
  percentage: number;
  colorLight: string;
  colorDark: string;
  count: number;
}

export interface TopHospitalMetric {
  id: string;
  name: string;
  volumeMB: number;
  delayMin: number;
  quality: number;
  frequency: number;
}

export const MOCK_HOURLY_SERIES: TimeSeriesPoint[] = [
  { time: '8 AM', volumeMB: 88, frequencyScore: 92, avgDelayMin: 18, issuesCount: 12, dataQuality: 97 },
  { time: '9 AM', volumeMB: 104, frequencyScore: 94, avgDelayMin: 22, issuesCount: 14, dataQuality: 96 },
  { time: '10 AM', volumeMB: 115, frequencyScore: 96, avgDelayMin: 20, issuesCount: 15, dataQuality: 95 },
  { time: '11 AM', volumeMB: 128, frequencyScore: 93, avgDelayMin: 28, issuesCount: 20, dataQuality: 94 },
  { time: '12 PM', volumeMB: 140, frequencyScore: 95, avgDelayMin: 25, issuesCount: 18, dataQuality: 98 },
  { time: '1 PM', volumeMB: 132, frequencyScore: 97, avgDelayMin: 19, issuesCount: 11, dataQuality: 97 },
  { time: '2 PM', volumeMB: 126, frequencyScore: 96, avgDelayMin: 16, issuesCount: 9, dataQuality: 98 },
];

export const MOCK_OPERATIONS: DataOperationItem[] = [
  { name: 'Insert', percentage: 32, colorLight: '#7FA8C9', colorDark: '#8FB9D9', count: 48500 },
  { name: 'Update', percentage: 28, colorLight: '#A99BCB', colorDark: '#A99BD0', count: 42400 },
  { name: 'Read', percentage: 30, colorLight: '#9CC8BA', colorDark: '#83C9C0', count: 45400 },
  { name: 'Delete', percentage: 10, colorLight: '#E8A982', colorDark: '#DDA27E', count: 15100 },
];

export const MOCK_TOP_HOSPITALS_COMPARISON: TopHospitalMetric[] = [
  { id: 'HOSP-001', name: 'Apollo Hospital, Chennai', volumeMB: 140, delayMin: 0, quality: 98, frequency: 100 },
  { id: 'HOSP-002', name: 'Fortis Hospital, Bengaluru', volumeMB: 125, delayMin: 10, quality: 96, frequency: 98 },
  { id: 'HOSP-004', name: 'Max Super Speciality, Delhi', volumeMB: 110, delayMin: 5, quality: 95, frequency: 99 },
  { id: 'HOSP-006', name: 'Narayana Health, Kolkata', volumeMB: 90, delayMin: 15, quality: 94, frequency: 95 },
  { id: 'HOSP-003', name: 'Manipal Hospital, Bengaluru', volumeMB: 85, delayMin: 25, quality: 93, frequency: 94 },
  { id: 'HOSP-005', name: 'Yashoda Hospital, Hyderabad', volumeMB: 60, delayMin: 35, quality: 88, frequency: 89 },
];
