import React from 'react';
import { motion } from 'framer-motion';
import { MOCK_REPORTS } from '../../data/mockReports';
import { ReportCard } from '../../components/reports/ReportCard';
import { TimeFilter } from '../../components/common/TimeFilter';

export const ReportsPage: React.FC = () => {
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
            TELEMETRY AUDIT REPORTS
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Downloadable executive summaries, latency audits, cloud bandwidth costs & ingestion logs
          </p>
        </div>

        <TimeFilter />
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_REPORTS.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </motion.div>
  );
};
