export interface Hospital {
  id: string;
  name: string;
  city: string;
  status: 'healthy' | 'delayed' | 'warning' | 'critical' | 'offline';
  lastDataReceived: string;
  expectedDataTime: string;
  delayMinutes: number;
  dataFrequency: number; // in minutes
  dataVolumeMB: number;
  recordsReceived: number;
  serviceStatus: 'running' | 'degraded' | 'stopped';
  dataQuality: number; // percentage
  awsCost: number; // in INR ₹
  ipAddress?: string;
  region?: string;
}

const INDIAN_CITIES = [
  'Chennai', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad',
  'Kolkata', 'Pune', 'Ahmedabad', 'Kochi', 'Jaipur',
  'Chandigarh', 'Coimbatore', 'Lucknow', 'Thiruvananthapuram', 'Indore'
];

const HOSPITAL_CHAINS = [
  'Apollo Hospital', 'Fortis Healthcare', 'Manipal Hospital', 'Max Super Speciality',
  'Yashoda Hospital', 'Narayana Health', 'Aster Medcity', 'Gleneagles Global',
  'Medanta Medicity', 'KIMS Hospital', 'Columbia Asia', 'Artemis Hospital',
  'Lilavati Hospital', 'Breach Candy Hospital', 'Kokilaben Dhirubhai Ambani Hospital',
  'VPS Lakeshore', 'MIOT International', 'Kauvery Hospital', 'SIMS Hospital', 'Amrita Hospital'
];

const generate90Hospitals = (): Hospital[] => {
  const list: Hospital[] = [];

  for (let i = 1; i <= 90; i++) {
    const paddedId = `HOSP-${i.toString().padStart(3, '0')}`;
    const chain = HOSPITAL_CHAINS[(i - 1) % HOSPITAL_CHAINS.length];
    const city = INDIAN_CITIES[(i - 1) % INDIAN_CITIES.length];
    const name = `${chain}, ${city}`;

    // Realistic status distribution: 72 Healthy, 12 Delayed, 4 Warning, 2 Critical/Offline
    let status: 'healthy' | 'delayed' | 'warning' | 'critical' | 'offline' = 'healthy';
    let delayMinutes = 0;
    let serviceStatus: 'running' | 'degraded' | 'stopped' = 'running';
    let dataQuality = Math.floor(92 + Math.random() * 8);
    let dataVolumeMB = Math.floor(80 + Math.random() * 100);
    let recordsReceived = Math.floor(8000 + Math.random() * 12000);
    let awsCost = Math.floor(800 + Math.random() * 1200);

    if (i === 23) {
      status = 'critical';
      delayMinutes = 240;
      serviceStatus = 'stopped';
      dataQuality = 45;
      dataVolumeMB = 12;
      recordsReceived = 950;
      awsCost = 350;
    } else if (i === 41) {
      status = 'offline';
      delayMinutes = 310;
      serviceStatus = 'stopped';
      dataQuality = 0;
      dataVolumeMB = 0;
      recordsReceived = 0;
      awsCost = 120;
    } else if (i === 12) {
      status = 'warning';
      delayMinutes = 95;
      serviceStatus = 'degraded';
      dataQuality = 78;
      dataVolumeMB = 45;
      recordsReceived = 3400;
      awsCost = 610;
    } else if (i === 67) {
      status = 'warning';
      delayMinutes = 80;
      serviceStatus = 'degraded';
      dataQuality = 82;
      dataVolumeMB = 58;
      recordsReceived = 4200;
      awsCost = 740;
    } else if (i === 84) {
      status = 'critical';
      delayMinutes = 190;
      serviceStatus = 'degraded';
      dataQuality = 52;
      dataVolumeMB = 22;
      recordsReceived = 1500;
      awsCost = 420;
    } else if (i === 89) {
      status = 'warning';
      delayMinutes = 110;
      serviceStatus = 'degraded';
      dataQuality = 74;
      dataVolumeMB = 38;
      recordsReceived = 2900;
      awsCost = 530;
    } else if (i % 7 === 0 && list.filter(h => h.status === 'delayed').length < 12) {
      status = 'delayed';
      delayMinutes = 35 + ((i * 3) % 25);
      serviceStatus = 'running';
      dataQuality = Math.floor(85 + Math.random() * 8);
      dataVolumeMB = Math.floor(60 + Math.random() * 40);
      recordsReceived = Math.floor(5000 + Math.random() * 4000);
      awsCost = Math.floor(700 + Math.random() * 400);
    }

    const currentHour = 12;
    const currentMin = 2;
    const totalCurrentMin = currentHour * 60 + currentMin;
    const lastMinTotal = totalCurrentMin - delayMinutes;
    const lastHour = Math.floor((lastMinTotal / 60) % 24);
    const lastMin = Math.floor(Math.abs(lastMinTotal) % 60);
    const period = lastHour >= 12 ? 'PM' : 'AM';
    const displayHour = lastHour % 12 === 0 ? 12 : lastHour % 12;

    const lastDataReceived = `${displayHour.toString().padStart(2, '0')}:${lastMin.toString().padStart(2, '0')} ${period}`;
    const expectedDataTime = `12:00 PM`;

    list.push({
      id: paddedId,
      name,
      city,
      status,
      lastDataReceived,
      expectedDataTime,
      delayMinutes,
      dataFrequency: 30,
      dataVolumeMB,
      recordsReceived,
      serviceStatus,
      dataQuality,
      awsCost,
      ipAddress: `10.142.${(i * 3) % 255}.${(i * 7) % 255}`,
      region: city === 'Chennai' || city === 'Bengaluru' || city === 'Kochi' || city === 'Coimbatore' || city === 'Thiruvananthapuram' ? 'ap-south-1' : 'ap-south-2'
    });
  }

  return list;
};

export const MOCK_HOSPITALS: Hospital[] = generate90Hospitals();
