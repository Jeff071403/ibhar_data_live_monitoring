import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { CopyButton } from '../common/CopyButton';
import { useMonitoring } from '../../hooks/useMonitoring';
import { AlertCircle, ArrowRight, Clock, CheckCircle } from 'lucide-react';

export const RecentAlertsCard: React.FC = () => {
  const { alerts } = useMonitoring();
  const recentAlerts = alerts.slice(0, 3);

  return (
    <Card variant="default" className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 stroke-[2.5]" />
            <h2 className="font-heading font-black text-base text-slate-900 dark:text-white">
              RECENT ALERTS
            </h2>
          </div>
          <Link
            to="/alerts"
            className="flex items-center gap-1 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>

        {/* Alert Items List */}
        {recentAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <span>No active telemetry alerts detected</span>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <Link
                key={alert.id}
                to="/alerts"
                className="block cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div
                  className={`p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                    alert.type === 'critical'
                      ? 'bg-transparent border-red-300 dark:border-red-800'
                      : alert.type === 'warning'
                      ? 'bg-transparent border-amber-300 dark:border-amber-800'
                      : 'bg-transparent border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div onClick={(e) => e.stopPropagation()}>
                        <CopyButton text={alert.hospitalId} />
                      </div>
                      <Badge status={alert.type === 'critical' ? 'critical' : alert.type === 'warning' ? 'warning' : 'healthy'} size="sm" />
                    </div>
                    <span className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 stroke-[2.5]" />
                      {alert.timestamp}
                    </span>
                  </div>

                  <h4 className="font-heading font-extrabold text-xs text-slate-900 dark:text-white mb-0.5">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 font-bold">
                    {alert.hospitalName} — {alert.message}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-slate-800 text-center">
        <Link
          to="/alerts"
          className="text-xs font-black text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Manage Notification Rules & Escalations →
        </Link>
      </div>
    </Card>
  );
};
