import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMonitoring } from '../../hooks/useMonitoring';
import { AlertCard } from '../../components/alerts/AlertCard';
import { EmptyState } from '../../components/common/EmptyState';
import { BellRing, CheckCheck } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, markAlertAsRead } = useMonitoring();
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'resolved'>('all');

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'all') return true;
    return a.type === activeTab;
  });

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const resolvedCount = alerts.filter(a => a.type === 'resolved').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
            TELEMETRY ALERTS & INCIDENTS
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Real-time automated incident detection for delayed feeds, connector failures & quality drops
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-nude-card dark:bg-night-card border border-[#EFE4DC] dark:border-[#102437] text-xs font-mono">
          <BellRing className="w-4 h-4 text-lightAccent-coral dark:text-nightAccent-coral" />
          <span>Active Incidents: <strong>{criticalCount + warningCount}</strong></span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-card-lg bg-nude-card dark:bg-night-card border border-[#EFE4DC] dark:border-[#102437] shadow-nude-soft dark:shadow-night-soft">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Alerts', count: alerts.length },
            { id: 'critical', label: 'Critical', count: criticalCount },
            { id: 'warning', label: 'Warning', count: warningCount },
            { id: 'resolved', label: 'Resolved', count: resolvedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-cute font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-nude-peachTint dark:bg-night-cardElevated text-textLight-heading dark:text-textNight-heading border border-[#E8A982]/40 dark:border-[#DDA27E]/40 shadow-sm'
                  : 'text-textLight-secondary dark:text-textNight-secondary hover:bg-nude-cardSec dark:hover:bg-night-cardSoft'
              }`}
            >
              {tab.label} <span className="opacity-60 ml-0.5">({tab.count})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => alerts.forEach(a => markAlertAsRead(a.id))}
          className="hidden sm:flex items-center gap-1 text-xs font-cute text-textLight-secondary dark:text-textNight-secondary hover:text-lightAccent-peach dark:hover:text-nightAccent-peach transition-colors px-3 py-1.5"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onMarkRead={markAlertAsRead} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Alerts Found"
          message={`No telemetry alerts currently categorized under "${activeTab}". Everything is operating normally.`}
        />
      )}
    </motion.div>
  );
};
