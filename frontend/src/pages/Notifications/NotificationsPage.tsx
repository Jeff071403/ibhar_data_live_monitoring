import React from 'react';
import { motion } from 'framer-motion';
import { useMonitoring } from '../../hooks/useMonitoring';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';
import { Bell, Clock, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { alerts, markAlertAsRead } = useMonitoring();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
            SYSTEM NOTIFICATIONS STREAM
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Real-time feed of network events, connector pings, and escalation triggers
          </p>
        </div>

        <button
          onClick={() => alerts.forEach(a => markAlertAsRead(a.id))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nude-peachTint/60 dark:bg-night-cardElevated text-xs font-cute font-bold text-textLight-heading dark:text-textNight-heading"
        >
          <CheckCircle2 className="w-4 h-4 text-[#91A995]" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((item) => (
          <Card key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547] text-lightAccent-peach shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <CopyButton text={item.hospitalId} />
                  <Badge status={item.type === 'critical' ? 'critical' : item.type === 'warning' ? 'warning' : 'healthy'} size="sm" />
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-lightAccent-rose animate-ping" />
                  )}
                </div>
                <h4 className="font-heading font-bold text-sm text-textLight-heading dark:text-textNight-heading">
                  {item.title}
                </h4>
                <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
                  {item.hospitalName} — {item.message}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-textLight-muted dark:text-textNight-muted flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" /> {item.timestamp}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
