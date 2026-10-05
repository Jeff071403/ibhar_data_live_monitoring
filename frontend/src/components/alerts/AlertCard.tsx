import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import type { Alert } from '../../types';
import { ArrowRight, Clock } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onMarkRead?: (id: string) => void;
}

function extractConciseError(msg?: string): string {
  if (!msg) return 'Execution Timeout Expired';
  const clean = msg.trim();
  
  if (/execution timeout expired/i.test(clean)) {
    return 'Execution Timeout Expired';
  }

  const colonIdx = clean.indexOf(':');
  if (colonIdx !== -1 && colonIdx < 70) {
    const after = clean.substring(colonIdx + 1).trim();
    const dotIdx = after.indexOf('.');
    if (dotIdx > 3 && dotIdx < 60) {
      return after.substring(0, dotIdx).trim();
    }
    return after.split('\n')[0].substring(0, 50).trim();
  }

  const firstLine = clean.split('\n')[0].trim();
  const dotIdx = firstLine.indexOf('.');
  if (dotIdx > 3 && dotIdx < 60) {
    return firstLine.substring(0, dotIdx).trim();
  }
  return firstLine.length > 50 ? `${firstLine.substring(0, 50)}...` : firstLine;
}

function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) return '2 mins ago';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  } catch {
    return timestamp;
  }
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onMarkRead }) => {
  const structureName = alert.category && alert.category !== 'sync_error' ? alert.category : 'IN_PATIENT_INFO';
  const shortError = extractConciseError(alert.message);
  const timeText = formatRelativeTime(alert.timestamp);

  return (
    <Card className="p-4 sm:p-5 transition-all duration-200 bg-white/70 dark:bg-night-card border border-[#EFE4DC] dark:border-[#102437] shadow-nude-soft dark:shadow-night-soft hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {/* Header line: 🔴 Hospital Name — DataStructure */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-heading font-extrabold text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
              <span className="text-base leading-none">🔴</span>
              <span>{alert.hospitalName || alert.hospitalId}</span>
              <span className="text-textLight-muted dark:text-textNight-muted font-normal">—</span>
              <span className="font-mono text-xs text-textLight-secondary dark:text-textNight-secondary font-bold px-2 py-0.5 rounded-md bg-nude-cardSec dark:bg-night-cardSoft border border-black/5 dark:border-white/5">
                {structureName}
              </span>
            </span>
          </div>

          {/* Sync failed line */}
          <p className="text-xs font-mono text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5">
            <span>Sync failed:</span>
            <span className="text-textLight-heading dark:text-textNight-heading font-medium">{shortError}</span>
          </p>

          {/* Timestamp line */}
          <p className="text-[11px] font-sans text-textLight-muted dark:text-textNight-muted flex items-center gap-1">
            <Clock className="w-3 h-3 text-textLight-muted dark:text-textNight-muted" />
            <span>{timeText}</span>
          </p>
        </div>

        {/* Action Button: View Details → */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {!alert.isRead && onMarkRead && (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="text-xs font-cute text-textLight-secondary dark:text-textNight-secondary hover:underline cursor-pointer"
            >
              Mark Read
            </button>
          )}

          <Link
            to={`/hospitals/${alert.hospitalId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
