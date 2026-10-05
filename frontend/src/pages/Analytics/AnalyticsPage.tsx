import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { MetricMiniCard } from '../../components/cards/MetricMiniCard';
import { TimeFilter } from '../../components/common/TimeFilter';
import { useMonitoring } from '../../hooks/useMonitoring';
import { Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

export const AnalyticsPage: React.FC = () => {
  const { timeSeries, integrationHealthData } = useMonitoring();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const totalRecords = integrationHealthData?.summary?.total_records ?? 1741945;
  const totalAvailable = integrationHealthData?.data?.reduce((acc, h) => acc + (h.records_available ?? h.records_processed ?? h.record_count ?? 0), 0) || totalRecords;
  const totalProcessed = integrationHealthData?.data?.reduce((acc, h) => acc + (h.records_processed ?? h.record_count ?? 0), 0) || totalRecords;
  const recordDiff = Math.max(0, totalAvailable - totalProcessed);
  const integrityPctNum = totalAvailable > 0 ? (totalProcessed / totalAvailable) * 100 : 100;
  const integrityPctFormatted = integrityPctNum < 100 && integrityPctNum > 99 ? integrityPctNum.toFixed(2) : integrityPctNum.toFixed(1);

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const textColor = isDark ? '#8493A0' : '#716A68';

  const formatCount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
            TELEMETRY ANALYTICS & METRICS
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Deep performance insights across record volume, latency, sync frequency, and data integrity
          </p>
        </div>

        <TimeFilter />
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricMiniCard
          title="Number of Records"
          value={`${totalRecords.toLocaleString()} Records`}
          subtext="Processed live payload records"
          trend="+12.4% vs yesterday"
          isPositive={true}
          variant="peach"
          sparklineData={[1200000, 1400000, 1550000, 1680000, 1720000, 1740000, totalRecords]}
          gradientColors={['#F43F5E', '#FDA4AF']}
        />

        <MetricMiniCard
          title="Data Frequency"
          value="98%"
          subtext="Expected: 30 min • Avg: 29 min"
          trend="Optimal"
          isPositive={true}
          variant="sage"
          sparklineData={[92, 94, 96, 93, 95, 97, 98]}
          gradientColors={['#10B981', '#34D399']}
        />

        <MetricMiniCard
          title="Average Delay"
          value="4 min"
          subtext="Yesterday to today record intake on schedule"
          trend="↓ 8% vs yesterday"
          isPositive={true}
          variant="lavender"
          sparklineData={[15, 12, 10, 8, 6, 5, 4]}
          gradientColors={['#8B5CF6', '#C084FC']}
        />

        <MetricMiniCard
          title="Data Integrity"
          value={`${integrityPctFormatted}%`}
          subtext={`Available: ${totalAvailable.toLocaleString()} • Processed: ${totalProcessed.toLocaleString()} (${recordDiff} diff)`}
          trend={`${integrityPctFormatted}% Processed`}
          isPositive={integrityPctNum >= 99}
          variant="yellow"
          sparklineData={[98.5, 99.0, 99.2, 99.5, 99.8, integrityPctNum]}
          gradientColors={['#F59E0B', '#FBBF24']}
        />
      </div>

      {/* 4 Detailed Trend Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Data Volume Trend (Records) */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
                DATA RECORD VOLUME TREND (RECORDS)
              </h3>
              <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
                Aggregate payload records processed per hour
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-lightAccent-peach dark:text-nightAccent-peach" />
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="volTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#DDA27E' : '#E8A982'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isDark ? '#DDA27E' : '#E8A982'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={formatCount} unit=" rows" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const countVal = Number(payload[0].value ?? 0);
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold font-mono">
                          <p className="text-slate-900 dark:text-white mb-0.5">{label}</p>
                          <p className="text-blue-600 dark:text-blue-400 font-black">
                            {countVal.toLocaleString()} records
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="volumeMB" stroke={isDark ? '#DDA27E' : '#E8A982'} strokeWidth={2.5} fill="url(#volTrendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Data Frequency Trend */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
                DATA FREQUENCY SCORE (%)
              </h3>
              <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
                Arrival consistency vs expected 30-minute sync windows
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-lightAccent-sage dark:text-nightAccent-sage" />
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} domain={[80, 100]} unit="%" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const score = Number(payload[0].value ?? 0);
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold font-mono">
                          <p className="text-slate-900 dark:text-white mb-0.5">{label}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-black">
                            {score}% Frequency Consistency
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="frequencyScore" stroke={isDark ? '#83C9C0' : '#9CC8BA'} strokeWidth={3} dot={{ r: 4, fill: isDark ? '#83C9C0' : '#9CC8BA' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Latency & Average Delay Trend */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
                AVERAGE LATENCY & DELAY (MINUTES)
              </h3>
              <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
                Average elapsed time before payload arrives at ingestion server
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-lightAccent-lavender dark:text-nightAccent-lavender" />
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="latTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#A99BD0' : '#A99BCB'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isDark ? '#A99BD0' : '#A99BCB'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} unit="m" domain={[0, 'auto']} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const delayVal = Number(payload[0].value ?? 0);
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold font-mono">
                          <p className="text-slate-900 dark:text-white mb-0.5">{label}</p>
                          <p className="text-purple-600 dark:text-purple-400 font-black">
                            {delayVal} min average latency
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="avgDelayMin" stroke={isDark ? '#A99BD0' : '#A99BCB'} strokeWidth={2.5} fill="url(#latTrendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 4: Data Quality Trend */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
                DATA QUALITY INTEGRITY (%)
              </h3>
              <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
                Percentage of clean, uncorrupted records successfully parsed
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-lightAccent-powderBlue dark:text-nightAccent-powderBlue" />
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} domain={[80, 100]} unit="%" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const quality = Number(payload[0].value ?? 0);
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs font-bold font-mono">
                          <p className="text-slate-900 dark:text-white mb-0.5">{label}</p>
                          <p className="text-sky-600 dark:text-sky-400 font-black">
                            {quality}% Clean Data Integrity
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="dataQuality" stroke={isDark ? '#8FB9D9' : '#91B4D4'} strokeWidth={3} dot={{ r: 4, fill: isDark ? '#8FB9D9' : '#91B4D4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
