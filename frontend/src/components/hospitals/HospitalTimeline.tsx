import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface TimelineItem {
  time: string;
  status: 'received' | 'delayed' | 'missed';
  volume: string;
}

interface HospitalTimelineProps {
  delayMinutes: number;
}

export const HospitalTimeline: React.FC<HospitalTimelineProps> = ({ delayMinutes }) => {
  const timeline: TimelineItem[] = [
    { time: '10:00 AM', status: 'received', volume: '140 MB' },
    { time: '10:30 AM', status: 'received', volume: '138 MB' },
    { time: '11:00 AM', status: 'received', volume: '142 MB' },
    { time: '11:30 AM', status: delayMinutes > 60 ? 'missed' : 'received', volume: delayMinutes > 60 ? '0 MB' : '135 MB' },
    { time: '12:00 PM', status: delayMinutes > 30 ? (delayMinutes > 120 ? 'missed' : 'delayed') : 'received', volume: delayMinutes > 30 ? 'Pending' : '140 MB' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm text-textLight-heading dark:text-textNight-heading">
          DATA FLOW TIMELINE (30-MIN WINDOWS)
        </h4>
        <span className="text-xs text-textLight-muted dark:text-textNight-muted font-mono">
          Sync Interval: 30 min
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {timeline.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-card-sm border text-center transition-all ${
              item.status === 'received'
                ? 'bg-nude-sageTint/60 dark:bg-[#152B35]/70 border-[#91A995]/30 dark:border-[#91B7A5]/30'
                : item.status === 'delayed'
                ? 'bg-nude-peachTint/60 dark:bg-[#1A2836]/70 border-[#E8A982]/30 dark:border-[#DDA27E]/30'
                : 'bg-[#F8E7DF]/80 dark:bg-[#1F253A]/80 border-[#D98F9B]/40 dark:border-[#D99AA5]/40'
            }`}
          >
            <div className="flex justify-center mb-1.5">
              {item.status === 'received' ? (
                <div className="w-6 h-6 rounded-full bg-[#91A995] dark:bg-[#91B7A5] text-white flex items-center justify-center shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
              ) : item.status === 'delayed' ? (
                <div className="w-6 h-6 rounded-full bg-[#E8A982] dark:bg-[#DDA27E] text-white flex items-center justify-center shadow-sm">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#D98F9B] dark:bg-[#D99AA5] text-white flex items-center justify-center shadow-sm">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="font-mono text-xs font-bold text-textLight-heading dark:text-textNight-heading">
              {item.time}
            </div>

            <div className="text-[10px] text-textLight-secondary dark:text-textNight-secondary mt-0.5 font-sans">
              {item.volume}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
