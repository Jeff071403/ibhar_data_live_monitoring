import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReportDetailData, ReportItem } from '../../types';
import { exportReportToPDF, exportReportToExcel, exportReportToCSV } from '../../utils/exportUtils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { X, FileText, Download, Filter, Database } from 'lucide-react';


interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportItem | null;
  data: ReportDetailData | null;
  isLoading: boolean;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  report,
  data,
  isLoading
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!data) return;
    setDownloadingFormat(format);
    setTimeout(() => {
      if (format === 'pdf') exportReportToPDF(report.title, data);
      else if (format === 'excel') exportReportToExcel(report.title, data);
      else exportReportToCSV(report.title, data);
      setDownloadingFormat(null);
    }, 400);
  };

  const rawRows = data?.rows || data?.breakdown || [];
  const summaryEntries = Object.entries(data?.summary || {});
  const chartPoints = data?.trend_points || data?.chart_points || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Banner Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-white">
                  {report.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans flex items-center gap-2 mt-0.5">
                  <span>Generated: {data?.generated_at ? new Date(data.generated_at).toLocaleString() : 'Just now'}</span>
                  <span>•</span>
                  <span>Real Supabase/PostgreSQL Data</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {isLoading ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-sans font-medium text-slate-600 dark:text-slate-300">
                  Generating {report.title} from PostgreSQL database...
                </p>
              </div>
            ) : !data ? (
              <div className="p-12 text-center text-slate-500">
                Unable to load report dataset. Please try again.
              </div>
            ) : (
              <>
                {/* Applied Filters Tags */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-blue-500" /> Active Parameters:
                  </span>
                  {Object.entries(data.filters_applied || {}).map(([k, v]) => {
                    if (!v || v === 'ALL') return null;
                    return (
                      <span
                        key={k}
                        className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium"
                      >
                        {k.replace('_', ' ')}: {v}
                      </span>
                    );
                  })}
                </div>

                {/* Summary KPI Cards Grid */}
                {summaryEntries.length > 0 && (
                  <div>
                    <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-500" /> Summary Metrics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {summaryEntries.map(([key, val]) => (
                        <div
                          key={key}
                          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-lg font-heading font-extrabold text-slate-900 dark:text-white mt-1">
                            {typeof val === 'number' ? val.toLocaleString() : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Chart Section */}
                {chartPoints.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
                    <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      Historical Trend Chart
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartPoints}>
                          <defs>
                            <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="time_label" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '11px'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={chartPoints[0]?.response_time_ms !== undefined ? 'response_time_ms' : chartPoints[0]?.delay_minutes !== undefined ? 'delay_minutes' : 'data_size_mb'}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#reportGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Detailed Data Table */}
                <div>
                  <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
                    <span>Detailed Report Records ({rawRows.length})</span>
                  </h4>

                  {rawRows.length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-sans text-slate-500 dark:text-slate-400">
                        {data.message || "No report data available for the selected period."}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-heading font-extrabold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              {Object.keys(rawRows[0]).slice(0, 7).map(col => (
                                <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                                  {col.replace(/_/g, ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-sans">
                            {rawRows.slice(0, 100).map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                {Object.keys(row).slice(0, 7).map(col => (
                                  <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                    {col === 'status' || col === 'current_status' ? (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        String(row[col]).toUpperCase() === 'SUCCESS' || String(row[col]).toUpperCase() === 'HEALTHY' || String(row[col]).toUpperCase() === 'ON_TIME'
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                      }`}>
                                        {String(row[col])}
                                      </span>
                                    ) : (
                                      String(row[col] ?? 'N/A')
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              All data compiled from active Supabase PostgreSQL telemetry tables.
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleExport('pdf')}
                disabled={isLoading || !data || downloadingFormat === 'pdf'}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={isLoading || !data || downloadingFormat === 'excel'}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={isLoading || !data || downloadingFormat === 'csv'}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-extrabold bg-slate-700 hover:bg-slate-800 text-white shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
