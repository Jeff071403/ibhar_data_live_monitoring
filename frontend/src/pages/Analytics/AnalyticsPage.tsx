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
  const { timeSeries, hospitals } = useMonitoring();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const criticalCount = hospitals.filter(h => h.status === 'critical' || h.status === 'warning' || h.status === 'offline').length;
  const delayedCount = hospitals.filter(h => h.status === 'delayed').length;

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const textColor = isDark ? '#8493A0' : '#716A68';

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
            Deep performance insights across network payload volume, latency, sync frequency and packet quality
          </p>
        </div>

        <TimeFilter />
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricMiniCard
          title="Data Volume"
          value="120 MB"
          subtext="vs yesterday"
          trend="+8.2%"
          isPositive={true}
          variant="peach"
          sparklineData={[88, 92, 104, 115, 128, 140, 120]}
          gradientColors={['#F43F5E', '#FDA4AF']}
        />

        <MetricMiniCard
          title="Data Frequency"
          value="95%"
          subtext="Expected: 30 min • Avg: 29 min"
          trend="Optimal"
          isPositive={true}
          variant="sage"
          sparklineData={[92, 94, 96, 93, 95, 97, 95]}
          gradientColors={['#10B981', '#34D399']}
        />

        <MetricMiniCard
          title="Average Delay"
          value="25 min"
          subtext="from yesterday"
          trend="↓ 8%"
          isPositive={true}
          variant="lavender"
          sparklineData={[35, 32, 28, 30, 27, 24, 25]}
          gradientColors={['#8B5CF6', '#C084FC']}
        />

        <MetricMiniCard
          title="Hospitals With Issues"
          value={`${criticalCount + delayedCount}`}
          subtext="Delayed or degraded"
          trend="Needs audit"
          isPositive={false}
          variant="yellow"
          sparklineData={[12, 14, 15, 20, 18, 16, 18]}
          gradientColors={['#F59E0B', '#FBBF24']}
        />
      </div>

      {/* 4 Detailed Trend Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Data Volume Trend */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
                DATA VOLUME TREND (MB)
              </h3>
              <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
                Aggregate network bandwidth consumption per hour
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-lightAccent-peach dark:text-nightAccent-peach" />
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#DDA27E' : '#E8A982'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isDark ? '#DDA27E' : '#E8A982'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} unit=" MB" />
                <Tooltip />
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
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} domain={[80, 100]} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="frequencyScore" stroke={isDark ? '#83C9C0' : '#9CC8BA'} strokeWidth={3} dot={{ r: 4 }} />
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
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#A99BD0' : '#A99BCB'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isDark ? '#A99BD0' : '#A99BCB'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} unit="m" />
                <Tooltip />
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
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} domain={[85, 100]} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="dataQuality" stroke={isDark ? '#8FB9D9' : '#91B4D4'} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
