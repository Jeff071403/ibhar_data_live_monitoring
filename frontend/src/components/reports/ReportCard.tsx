import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReportItem } from '../../types';
import { FileText, Clock, HardDrive, Activity, DollarSign, Download, Eye, Check } from 'lucide-react';

interface ReportCardProps {
  report: ReportItem;
  onPreview: (report: ReportItem) => void;
  onDownload: (report: ReportItem, format: 'pdf' | 'excel' | 'csv') => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onPreview, onDownload }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const getWhiteIcon = () => {
    const cls = "w-5 h-5 text-white";
    switch (report.iconName) {
      case 'FileText': return <FileText className={cls} />;
      case 'Clock': return <Clock className={cls} />;
      case 'HardDrive': return <HardDrive className={cls} />;
      case 'Activity': return <Activity className={cls} />;
      case 'DollarSign': return <DollarSign className={cls} />;
      default: return <FileText className={cls} />;
    }
  };

  const handleFormatDownload = (format: 'pdf' | 'excel' | 'csv') => {
    setDownloadingFormat(format);
    onDownload(report, format);
    setTimeout(() => {
      setDownloadingFormat(null);
    }, 1000);
  };

  const getThemeDetails = (iconName: string) => {
    switch (iconName) {
      case 'Clock': // Delay & Latency
        return {
          color: '#f43f5e', // rose-500
          gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        };
      case 'HardDrive': // Data Volume
        return {
          color: '#ea580c', // orange-600
          gradient: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
        };
      case 'Activity': // Sync Frequency & Errors
        return {
          color: '#10b981', // emerald-500
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        };
      case 'DollarSign': // AWS Cost
        return {
          color: '#64748b', // slate-500
          gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        };
      case 'FileText': // Data Summary
      default:
        return {
          color: '#3b82f6', // blue-500
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        };
    }
  };

  const theme = getThemeDetails(report.iconName || 'FileText');

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative flex flex-col h-fit select-none group w-full"
    >
      {/* Folder Tab (Back Flap) */}
      <div className="flex items-end">
        <div
          className="h-8 w-24 rounded-tl-2xl"
          style={{ backgroundColor: theme.color }}
        />
        <div
          className="h-5 flex-1 rounded-tr-2xl"
          style={{ backgroundColor: theme.color }}
        />
      </div>

      {/* Folder Back Body */}
      <div
        className="w-full h-[52px] relative z-0"
        style={{ backgroundColor: theme.color }}
      >
        {/* Document Sticking Out */}
        <div
          className="absolute left-3.5 right-3.5 bg-white rounded-xl shadow-sm px-3 py-1.5 z-10 flex items-center justify-between border border-slate-200"
          style={{ height: '56px', top: '8px' }}
        >
          <div className="flex flex-col select-none overflow-hidden mr-2">
            <span className="font-sans font-bold text-slate-800 text-[10px] leading-tight truncate">
              {report.title.replace(/ /g, '_')}.csv
            </span>
            <span className="text-[9px] text-slate-400 font-sans mt-0.5 font-normal truncate">
              Generated: {report.lastGenerated}
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
            {report.fileSize}
          </span>
        </div>
      </div>

      {/* Folder Front Pocket */}
      <div
        className="relative z-20 w-full rounded-b-3xl rounded-t-none p-4 shadow-xl text-white flex flex-col justify-between animate-fade-in-up"
        style={{
          background: theme.gradient,
          marginTop: '0px',
          height: '250px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-white/5 rounded-b-3xl rounded-t-xl pointer-events-none" />

        {/* Front Pocket Top Content */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="overflow-hidden mr-2">
            <h4 className="font-heading font-extrabold text-sm tracking-tight text-white truncate">
              {report.title}
            </h4>
            <p className="text-[9px] text-white/80 font-sans mt-0.5">
              {report.recordCount !== undefined ? `${report.recordCount} matching database records` : 'Real DB data'}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/10 border border-white/20 shrink-0">
            {getWhiteIcon()}
          </div>
        </div>

        {/* Description */}
        <p className="relative z-10 text-[11px] leading-relaxed text-white/90 font-sans flex-1 mt-2 mb-3 overflow-hidden">
          {report.description}
        </p>

        {/* Action Buttons */}
        <div className="relative z-10 pt-2.5 border-t border-white/15 space-y-2">
          {/* Primary Action: Generate / Preview */}
          <button
            onClick={() => onPreview(report)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[11px] font-heading font-extrabold bg-white text-slate-900 hover:bg-slate-100 shadow-md cursor-pointer transition-all active:scale-[0.98]"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Generate & Preview Report</span>
          </button>

          {/* Export Quick Download Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {(['pdf', 'excel', 'csv'] as const).map((fmt) => {
              const isLoading = downloadingFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => handleFormatDownload(fmt)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1 py-1 rounded-lg text-[9px] font-heading font-extrabold bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Check className="w-3 h-3 text-white animate-bounce" />
                  ) : (
                    <Download className="w-3 h-3 opacity-70" />
                  )}
                  <span>{fmt.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
