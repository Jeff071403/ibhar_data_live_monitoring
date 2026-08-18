import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/cards/StatCard';
import { LiveMonitoringCard } from '../../components/cards/LiveMonitoringCard';
import { RecentAlertsCard } from '../../components/cards/RecentAlertsCard';
import { MetricMiniCard } from '../../components/cards/MetricMiniCard';
import { useMonitoring } from '../../hooks/useMonitoring';
import { Building2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { hospitals } = useMonitoring();
  const navigate = useNavigate();

  const totalCount = hospitals.length;
  const healthyCount = hospitals.filter(h => h.status === 'healthy').length;
  const delayedCount = hospitals.filter(h => h.status === 'delayed').length;
  const criticalCount = hospitals.filter(h => h.status === 'critical' || h.status === 'warning' || h.status === 'offline').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 4 Main Stat Cards with Thick High-Contrast Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hospitals"
          value={totalCount}
          icon={<Building2 className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="+2.1%"
          isPositive={true}
          variant="blue"
          onClick={() => navigate('/hospitals')}
        />
        <StatCard
          label="Healthy"
          value={healthyCount}
          icon={<CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="+4.2%"
          isPositive={true}
          variant="sage"
          onClick={() => navigate('/hospitals?filter=healthy')}
        />
        <StatCard
          label="Delayed"
          value={delayedCount}
          icon={<Clock className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="-1.5%"
          isPositive={true}
          variant="yellow"
          onClick={() => navigate('/hospitals?filter=delayed')}
        />
        <StatCard
          label="Critical / Issues"
          value={criticalCount}
          icon={<AlertCircle className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="+2 issues"
          isPositive={false}
          variant="peach"
          onClick={() => navigate('/hospitals?filter=critical')}
        />
      </div>

      {/* Main Asymmetrical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle/Left: Live Monitoring Hero Card (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2">
          <LiveMonitoringCard />
        </div>

        {/* Right: Recent Alerts Panel */}
        <div className="lg:col-span-1">
          <RecentAlertsCard />
        </div>
      </div>

      {/* 4 Mini Metric Cards */}
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
          subtext="Exp: 30 min • Avg: 29 min"
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
    </motion.div>
  );
};
