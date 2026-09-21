import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/cards/StatCard';
import { LiveMonitoringCard } from '../../components/cards/LiveMonitoringCard';
import { RecentAlertsCard } from '../../components/cards/RecentAlertsCard';
import { MetricMiniCard } from '../../components/cards/MetricMiniCard';
import { useMonitoring } from '../../hooks/useMonitoring';
import { Building2, CheckCircle2, Clock, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    hospitals,
    dashboardMetrics,
    isBackendConnected,
    apiError,
    manualRefresh,
    isLoading
  } = useMonitoring();
  const navigate = useNavigate();

  const totalCount = dashboardMetrics?.total_hospitals ?? hospitals.length;
  const healthyCount = dashboardMetrics?.healthy ?? hospitals.filter(h => h.status === 'healthy').length;
  const delayedCount = dashboardMetrics?.delayed ?? hospitals.filter(h => h.status === 'delayed').length;
  const criticalCount = dashboardMetrics?.critical ?? hospitals.filter(h => h.status === 'critical' || h.status === 'warning' || h.status === 'offline').length;

  const totalEncounters = dashboardMetrics?.total_encounters ?? 0;
  const totalDischarges = dashboardMetrics?.total_discharges ?? 0;
  const activeAlerts = dashboardMetrics?.active_alerts ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Backend Disconnected Error Banner */}
      {!isBackendConnected && (
        <div className="p-4 rounded-card-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-bold text-sm">Unable to load live data</p>
              <p className="text-xs opacity-90">{apiError || 'Please check backend API connection.'}</p>
            </div>
          </div>
          <button
            onClick={manualRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hospitals"
          value={totalCount}
          icon={<Building2 className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="Supabase DB"
          isPositive={true}
          variant="blue"
          onClick={() => navigate('/hospitals')}
        />
        <StatCard
          label="Healthy"
          value={healthyCount}
          icon={<CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="Active Feed"
          isPositive={true}
          variant="sage"
          onClick={() => navigate('/hospitals?filter=healthy')}
        />
        <StatCard
          label="Delayed"
          value={delayedCount}
          icon={<Clock className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="Needs Sync"
          isPositive={delayedCount === 0}
          variant="yellow"
          onClick={() => navigate('/hospitals?filter=delayed')}
        />
        <StatCard
          label="Critical / Issues"
          value={criticalCount}
          icon={<AlertCircle className="w-5 h-5 text-white stroke-[2.5]" />}
          trend="Incidents"
          isPositive={criticalCount === 0}
          variant="peach"
          onClick={() => navigate('/hospitals?filter=critical')}
        />
      </div>

      {/* Main Asymmetrical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle/Left: Live Monitoring Hero Card */}
        <div className="lg:col-span-2">
          <LiveMonitoringCard />
        </div>

        {/* Right: Recent Alerts Panel */}
        <div className="lg:col-span-1">
          <RecentAlertsCard />
        </div>
      </div>

      {/* 4 Database-Driven Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricMiniCard
          title="Total Encounters"
          value={`${totalEncounters}`}
          subtext="Supabase encounters table"
          trend="Live DB"
          isPositive={true}
          variant="peach"
          sparklineData={[0, Math.min(totalEncounters, 10), totalEncounters]}
          gradientColors={['#F43F5E', '#FDA4AF']}
        />

        <MetricMiniCard
          title="Total Discharges"
          value={`${totalDischarges}`}
          subtext="Supabase discharges table"
          trend="Live DB"
          isPositive={true}
          variant="sage"
          sparklineData={[0, Math.min(totalDischarges, 10), totalDischarges]}
          gradientColors={['#10B981', '#34D399']}
        />

        <MetricMiniCard
          title="Active Alerts"
          value={`${activeAlerts}`}
          subtext="Supabase alerts table"
          trend={activeAlerts === 0 ? 'Clear' : 'Action Required'}
          isPositive={activeAlerts === 0}
          variant="lavender"
          sparklineData={[0, activeAlerts]}
          gradientColors={['#8B5CF6', '#C084FC']}
        />

        <MetricMiniCard
          title="Hospitals With Issues"
          value={`${criticalCount + delayedCount}`}
          subtext="Delayed or degraded"
          trend={criticalCount + delayedCount === 0 ? 'Optimal' : 'Needs audit'}
          isPositive={criticalCount + delayedCount === 0}
          variant="yellow"
          sparklineData={[0, criticalCount + delayedCount]}
          gradientColors={['#F59E0B', '#FBBF24']}
        />
      </div>
    </motion.div>
  );
};
