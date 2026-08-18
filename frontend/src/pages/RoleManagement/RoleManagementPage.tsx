import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';

export const RoleManagementPage: React.FC = () => {
  const roles = [
    { title: 'Super Administrator', permissions: 'Full system access, node configuration, API key generation, user management', count: 2 },
    { title: 'Telemetry Operator', permissions: 'View live streams, resolve alerts, manually refresh connectors, export audit reports', count: 8 },
    { title: 'Hospital Regional Coordinator', permissions: 'Read-only telemetry for assigned regional hospital nodes, download reports', count: 15 },
    { title: 'Executive Auditor', permissions: 'Read-only access to historical analytics, AWS cost reports & compliance logs', count: 4 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
          ROLE & PERMISSION CONTROL
        </h2>
        <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
          Role-Based Access Control (RBAC) security rules for hospital data monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r, i) => (
          <Card key={i} variant="sec" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
                {r.title}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-nude-card dark:bg-night-card text-[11px] font-mono font-bold text-lightAccent-peach dark:text-nightAccent-peach">
                {r.count} Users Assigned
              </span>
            </div>
            <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans leading-relaxed">
              {r.permissions}
            </p>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
