import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ReportItem, ReportFilters, ReportDetailData } from '../../types';
import { apiService } from '../../services/api';
import { ReportCard } from '../../components/reports/ReportCard';
import { ReportFilterBar } from '../../components/reports/ReportFilterBar';
import { ReportPreviewModal } from '../../components/reports/ReportPreviewModal';
import { EmptyState } from '../../components/common/EmptyState';
import { exportReportToPDF, exportReportToExcel, exportReportToCSV } from '../../utils/exportUtils';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    date_preset: 'today',
    hospital_id: 'ALL',
    data_type: 'ALL',
    status: 'ALL',
    severity: 'ALL'
  });

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal States
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [previewData, setPreviewData] = useState<ReportDetailData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const loadReportsOverview = useCallback((activeFilters: ReportFilters) => {
    setIsLoading(true);
    setError(null);
    apiService.getReports(activeFilters)
      .then((data) => {
        setReports(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load report overview:", err);
        setError("Unable to generate reports overview. Please try again.");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadReportsOverview(filters);
  }, [filters, loadReportsOverview]);

  const handleFilterChange = (newFilters: ReportFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const reset: ReportFilters = {
      date_preset: 'today',
      hospital_id: 'ALL',
      data_type: 'ALL',
      status: 'ALL',
      severity: 'ALL'
    };
    setFilters(reset);
  };

  const handlePreviewReport = async (report: ReportItem) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
    setIsPreviewLoading(true);
    setPreviewData(null);

    const details = await apiService.getReportDetails(report.id, filters);
    setPreviewData(details);
    setIsPreviewLoading(false);
  };

  const handleDownloadReport = async (report: ReportItem, format: 'pdf' | 'excel' | 'csv') => {
    let details = previewData;
    if (!details || selectedReport?.id !== report.id) {
      details = await apiService.getReportDetails(report.id, filters);
    }
    if (!details) {
      alert("Unable to fetch report data for export.");
      return;
    }

    if (format === 'pdf') exportReportToPDF(report.title, details);
    else if (format === 'excel') exportReportToExcel(report.title, details);
    else exportReportToCSV(report.title, details);
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
            TELEMETRY AUDIT REPORTS
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Downloadable summaries, integration health analysis, latency audits and ingestion reports.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Reports Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-sans font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </p>
          <button
            onClick={() => loadReportsOverview(filters)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-extrabold bg-rose-600 text-white shadow-md hover:bg-rose-700 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPreview={handlePreviewReport}
              onDownload={handleDownloadReport}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-slate-400" />}
          title="No Report Data Available"
          message="No telemetry audit records match the selected date range and filter criteria. Adjust your filters or select 'All Hospitals'."
        />
      )}

      {/* Report Interactive Preview Modal */}
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        report={selectedReport}
        data={previewData}
        isLoading={isPreviewLoading}
      />
    </motion.div>
  );
};
