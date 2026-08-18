import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReportItem } from '../../data/mockReports';
import { FileText, Clock, HardDrive, Activity, DollarSign, Download, Check } from 'lucide-react';

interface ReportCardProps {
  report: ReportItem;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
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

  const handleDownload = (format: string) => {
    setDownloadingFormat(format);
    setTimeout(() => {
      setDownloadingFormat(null);
      const element = document.createElement('a');
      const file = new Blob([`IBHAR Telemetry Report: ${report.title}\nGenerated: ${new Date().toISOString()}\nFormat: ${format}\nRecord Count: ${report.recordCount}`], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${report.title.replace(/\s+/g, '_')}_${format.toLowerCase()}.${format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase()}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
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
      case 'Activity': // Sync Frequency
        return {
          color: '#10b981', // emerald-500
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        };
      case 'DollarSign': // AWS Cost
        return {
          color: '#f59e0b', // amber-500
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        };
      case 'FileText': // Data Summary
      default:
        return {
          color: '#3b82f6', // blue-500
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        };
    }
  };

  const theme = getThemeDetails(report.iconName);

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
        {/* Document Sticking Out (The white sheet of paper) */}
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
          marginTop: '0px', // pushes it down to reveal the document
          height: '240px',
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
              {report.recordCount} hospital records
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/10 border border-white/20 shrink-0">
            {getWhiteIcon()}
          </div>
        </div>

        {/* Description */}
        <p className="relative z-10 text-[11px] leading-relaxed text-white/90 font-sans flex-1 mt-3 mb-4 overflow-hidden">
          {report.description}
        </p>

        {/* Export Format Buttons */}
        <div className="relative z-10 pt-3 border-t border-white/15">
          <span className="text-[9px] font-cute uppercase font-bold text-white/70 block mb-2">
            Export Format
          </span>

          <div className="grid grid-cols-3 gap-2">
            {['PDF', 'Excel', 'CSV'].map((format) => {
              const isLoading = downloadingFormat === format;
              return (
                <button
                  key={format}
                  onClick={() => handleDownload(format)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-cute font-extrabold bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer transition-all disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? (
                    <Check className="w-3 h-3 text-white animate-bounce" />
                  ) : (
                    <Download className="w-3 h-3 opacity-70" />
                  )}
                  <span>{format}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
