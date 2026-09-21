import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { CopyButton } from '../common/CopyButton';
import type { Alert } from '../../types';
import { Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onMarkRead?: (id: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onMarkRead }) => {
  const getCardBg = () => {
    if (alert.type === 'critical') {
      return 'bg-transparent border-[#D98F9B]/60 dark:border-[#D99AA5]/40';
    }
    if (alert.type === 'warning') {
      return 'bg-transparent border-[#E6C875]/60 dark:border-[#E5C46E]/40';
    }
    return 'bg-transparent border-[#91A995]/50 dark:border-[#91B7A5]/30';
  };

  return (
    <Card className={`transition-all duration-200 ${getCardBg()}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CopyButton text={alert.hospitalId} />
          <Badge
            status={alert.type === 'critical' ? 'critical' : alert.type === 'warning' ? 'warning' : 'healthy'}
            customLabel={alert.type.toUpperCase()}
          />
          <span className="px-2 py-0.5 rounded-full text-[11px] font-cute uppercase bg-white/60 dark:bg-night-cardElevated text-textLight-secondary dark:text-textNight-secondary border border-gray-200 dark:border-gray-700">
            {alert.category}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-textLight-muted dark:text-textNight-muted font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Received: <strong>{alert.lastReceived}</strong></span>
          <span>(Expected: {alert.expectedTime})</span>
        </div>
      </div>

      <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading mb-1 flex items-center gap-2">
        {alert.type === 'critical' ? (
          <AlertCircle className="w-4 h-4 text-lightAccent-coral dark:text-nightAccent-coral shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-lightAccent-sage dark:text-nightAccent-sage shrink-0" />
        )}
        {alert.title}
      </h3>

      <p className="text-xs text-textLight-secondary dark:text-textNight-secondary mb-4 font-sans leading-relaxed">
        <strong>{alert.hospitalName}</strong> — {alert.message}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
        <div className="text-[11px] text-textLight-muted dark:text-textNight-muted">
          Timestamp: <span className="font-mono">{alert.timestamp}</span>
        </div>

        <div className="flex items-center gap-3">
          {!alert.isRead && onMarkRead && (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="text-xs font-cute text-textLight-secondary dark:text-textNight-secondary hover:underline"
            >
              Mark Read
            </button>
          )}

          <Link
            to={`/hospitals/${alert.hospitalId}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 dark:bg-night-cardElevated text-textLight-heading dark:text-textNight-heading hover:bg-lightAccent-peach/30 dark:hover:bg-nightAccent-peach/30 transition-all shadow-sm"
          >
            <span>View Hospital</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
