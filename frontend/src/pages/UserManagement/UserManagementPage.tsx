import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { UserPlus } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const users = [
    { name: 'Dr. Rajesh V. Raman', email: 'rajesh@ibhar.com', role: 'Super Admin', status: 'Active', region: 'All India' },
    { name: 'Kavitha Sundaram', email: 'kavitha.s@ibhar.com', role: 'Telemetry Operator', status: 'Active', region: 'South Region' },
    { name: 'Anish Kumar', email: 'anish.k@ibhar.com', role: 'Hospital Coordinator', status: 'Active', region: 'North Region' },
    { name: 'Priya Nair', email: 'priya.n@ibhar.com', role: 'Auditor', status: 'Inactive', region: 'West Region' },
  ];

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
            USER MANAGEMENT & OPERATORS
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Manage system operators, regional coordinators and hospital telemetry personnel
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lightAccent-peach dark:bg-nightAccent-peach text-white text-xs font-cute font-bold shadow-md hover:opacity-90 transition-opacity">
          <UserPlus className="w-4 h-4" /> Add Operator
        </button>
      </div>

      <Card variant="default">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[#EFE4DC] dark:border-[#102437] text-[11px] font-cute uppercase text-textLight-muted dark:text-textNight-muted">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE4DC]/60 dark:divide-[#102437]">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-nude-bgMuted/30 dark:hover:bg-night-cardSoft/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-textLight-heading dark:text-textNight-heading">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-textLight-secondary dark:text-textNight-secondary">{u.email}</td>
                  <td className="py-3 px-3 font-cute font-bold text-lightAccent-softBlue dark:text-nightAccent-powderBlue">{u.role}</td>
                  <td className="py-3 px-3">{u.region}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-cute uppercase font-bold ${
                      u.status === 'Active' ? 'bg-[#91A995]/20 text-[#47664B] dark:text-[#91B7A5]' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {u.status}
                    </span>
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
