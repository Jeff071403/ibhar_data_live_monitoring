import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMonitoring } from '../../hooks/useMonitoring';
import type { Hospital } from '../../data/mockHospitals';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';
import { formatVolume } from '../../utils/formatters';
import { GitCompare, ArrowUpDown, Search } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

type SortField = 'id' | 'name' | 'dataVolumeMB' | 'dataFrequency' | 'delayMinutes' | 'dataQuality';
type SortOrder = 'asc' | 'desc';

export const HospitalComparisonPage: React.FC = () => {
  const { hospitals } = useMonitoring();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [sortField, setSortField] = useState<SortField>('dataVolumeMB');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedView, setSelectedView] = useState<'comparison' | 'latency' | 'volume' | 'frequency'>('comparison');

  const sortedHospitals = useMemo(() => {
    let result = [...hospitals];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(h => h.name.toLowerCase().includes(q) || h.id.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = (valA as string).toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [hospitals, sortField, sortOrder, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const top10ChartData = useMemo(() => {
    return [...hospitals]
      .sort((a, b) => b.dataVolumeMB - a.dataVolumeMB)
      .slice(0, 8);
  }, [hospitals]);

  const delayRangeData = useMemo(() => {
    return [...hospitals]
      .filter(h => h.delayMinutes > 0)
      .sort((a, b) => b.delayMinutes - a.delayMinutes)
      .slice(0, 8)
      .map(h => ({
        id: h.id,
        name: h.name,
        delayRange: [h.dataFrequency, Math.max(h.dataFrequency, h.delayMinutes)],
        expected: h.dataFrequency,
        delay: h.delayMinutes
      }));
  }, [hospitals]);

  const delayRangeData15 = useMemo(() => {
    return [...hospitals]
      .filter(h => h.delayMinutes > 0)
      .sort((a, b) => b.delayMinutes - a.delayMinutes)
      .slice(0, 15)
      .map(h => ({
        id: h.id,
        name: h.name,
        delayRange: [h.dataFrequency, Math.max(h.dataFrequency, h.delayMinutes)],
        expected: h.dataFrequency,
        delay: h.delayMinutes
      }));
  }, [hospitals]);

  const top15VolumeData = useMemo(() => {
    return [...hospitals]
      .sort((a, b) => b.dataVolumeMB - a.dataVolumeMB)
      .slice(0, 15);
  }, [hospitals]);

  const frequencyRangeData = useMemo(() => {
    return [...hospitals]
      .sort((a, b) => b.delayMinutes - a.delayMinutes)
      .slice(0, 15)
      .map(h => {
        const isHealthy = h.status === 'healthy';
        const minVal = isHealthy ? 30 - (h.id.charCodeAt(5) % 4) - 1 : 30;
        const maxVal = isHealthy ? 30 : 30 + Math.floor(h.delayMinutes / 2) + (h.id.charCodeAt(5) % 3) + 1;
        return {
          id: h.id,
          name: h.name,
          freqRange: [minVal, maxVal],
          expected: 30,
          average: Math.floor((minVal + maxVal) / 2)
        };
      });
  }, [hospitals]);

  const colors = isDark
    ? ['#8FB9D9', '#83C9C0', '#A99BD0', '#DDA27E', '#E5C46E', '#D99AA5', '#91B7A5', '#7FA8C9']
    : ['#7FA8C9', '#9CC8BA', '#A99BCB', '#E8A982', '#E6C875', '#D98F9B', '#91A995', '#91B4D4'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
            HOSPITAL COMPARISON MATRIX
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Side-by-side performance benchmarking for payload volume, delay, quality score & transmission frequency
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 shadow-inner">
            {(['comparison', 'latency', 'volume', 'frequency'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold capitalize transition-all duration-200 ${
                  selectedView === view
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm border border-slate-250/10 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-nude-card dark:bg-night-card border border-[#EFE4DC] dark:border-[#102437] text-xs font-mono">
            <GitCompare className="w-4 h-4 text-lightAccent-peach dark:text-nightAccent-peach" />
            <span>Comparing: <strong>90 Nodes</strong></span>
          </div>
        </div>
      </div>

      {/* Top Visual Charts Grid / Full-Width Views */}
      {selectedView === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 8 Volume Benchmark */}
          <Card variant="default">
            <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading mb-3">
              TOP VOLUME TRANSMISSION BENCHMARK (MB)
            </h3>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={top10ChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace' }} width={80} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
                            <p className="font-bold text-slate-900 dark:text-white mb-1">{payload[0].payload.name}</p>
                            <p className="text-blue-600 font-bold">Volume: {payload[0].value} MB</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="dataVolumeMB" radius={[0, 8, 8, 0]} barSize={16}>
                    {top10ChartData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Sync & Latency Range Benchmark */}
          <Card variant="default">
            <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading mb-3">
              NODE SYNC & LATENCY RANGE BENCHMARK (MIN)
            </h3>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={delayRangeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="bar-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#E6C875" />
                      <stop offset="95%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis dataKey="id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace' }} width={80} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
                            <p className="font-bold text-slate-900 dark:text-white mb-1">{data.name}</p>
                            <p className="text-slate-500">Expected Sync: <strong className="text-slate-700 dark:text-slate-350">{data.expected} min</strong></p>
                            <p className="text-rose-600 font-bold">Actual Delay: {data.delay} min</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="delayRange" radius={[6, 6, 6, 6]} barSize={16} fill="url(#bar-gradient)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {selectedView === 'latency' && (
        <Card variant="default">
          <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading mb-3">
            DETAILED NODE SYNC & LATENCY RANGE BENCHMARK (MIN)
          </h3>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={delayRangeData15} margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="bar-gradient-det" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#E6C875" />
                    <stop offset="95%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis dataKey="id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace' }} width={80} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
                          <p className="font-bold text-slate-900 dark:text-white mb-1">{data.name}</p>
                          <p className="text-slate-500">Expected Sync: <strong className="text-slate-700 dark:text-slate-350">{data.expected} min</strong></p>
                          <p className="text-rose-600 font-bold">Actual Delay: {data.delay} min</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="delayRange" radius={[6, 6, 6, 6]} barSize={16} fill="url(#bar-gradient-det)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {selectedView === 'volume' && (
        <Card variant="default">
          <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading mb-3">
            DETAILED DATA VOLUME TRANSMISSION BENCHMARK (MB)
          </h3>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={top15VolumeData} margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="volume-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#3B82F6" />
                    <stop offset="95%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis dataKey="id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace' }} width={80} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
                          <p className="font-bold text-slate-900 dark:text-white mb-1">{payload[0].payload.name}</p>
                          <p className="text-blue-600 font-bold">Volume: {payload[0].value} MB</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="dataVolumeMB" radius={[0, 8, 8, 0]} barSize={16} fill="url(#volume-gradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {selectedView === 'frequency' && (
        <Card variant="default">
          <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading mb-3">
            DETAILED NODE SYNC FREQUENCY INTERVAL RANGE (MIN)
          </h3>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={frequencyRangeData} margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="freq-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#10B981" />
                    <stop offset="95%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis dataKey="id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace' }} width={80} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
                          <p className="font-bold text-slate-900 dark:text-white mb-1">{data.name}</p>
                          <p className="text-slate-500">Expected Cycle: <strong className="text-slate-700 dark:text-slate-350">{data.expected} min</strong></p>
                          <p className="text-teal-600 dark:text-teal-400 font-bold">Actual Sync Cycle Range: {data.freqRange[0]} - {data.freqRange[1]} min</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="freqRange" radius={[6, 6, 6, 6]} barSize={16} fill="url(#freq-gradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Search & Sortable Table */}
      <Card variant="default" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-textLight-muted dark:text-textNight-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by hospital name or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547] text-xs font-sans text-textLight-heading dark:text-textNight-heading placeholder:text-textLight-muted dark:placeholder:text-textNight-muted focus:outline-none focus:ring-2 focus:ring-lightAccent-peach/50 transition-all"
            />
          </div>

          <span className="text-xs text-textLight-muted dark:text-textNight-muted font-mono">
            Showing {sortedHospitals.length} of {hospitals.length} hospitals
          </span>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[#EFE4DC] dark:border-[#102437] text-[11px] font-cute uppercase text-textLight-muted dark:text-textNight-muted">
                <th className="py-3 px-3 cursor-pointer hover:text-textLight-heading" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">Hospital ID <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-textLight-heading" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Hospital Name <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-textLight-heading" onClick={() => handleSort('dataVolumeMB')}>
                  <div className="flex items-center justify-end gap-1">Volume <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-textLight-heading" onClick={() => handleSort('dataFrequency')}>
                  <div className="flex items-center justify-end gap-1">Frequency <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-textLight-heading" onClick={() => handleSort('delayMinutes')}>
                  <div className="flex items-center justify-end gap-1">Delay <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-textLight-heading" onClick={() => handleSort('dataQuality')}>
                  <div className="flex items-center justify-end gap-1">Quality <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EFE4DC]/60 dark:divide-[#102437]">
              {sortedHospitals.slice(0, 25).map((h: Hospital) => (
                <tr key={h.id} className="hover:bg-nude-bgMuted/30 dark:hover:bg-night-cardSoft/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold">
                    <CopyButton text={h.id} />
                  </td>
                  <td className="py-3 px-3 font-semibold text-textLight-heading dark:text-textNight-heading">
                    <Link to={`/hospitals/${h.id}`} className="hover:text-lightAccent-peach dark:hover:text-nightAccent-peach transition-colors">
                      {h.name}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-textLight-heading dark:text-textNight-heading">
                    {formatVolume(h.dataVolumeMB)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {h.dataFrequency} min
                  </td>
                  <td className={`py-3 px-3 text-right font-mono font-bold ${
                    h.delayMinutes > 30 ? 'text-[#8E3B49] dark:text-[#D99AA5]' : 'text-[#47664B] dark:text-[#91B7A5]'
                  }`}>
                    {h.delayMinutes} min
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {h.dataQuality}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge status={h.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};
