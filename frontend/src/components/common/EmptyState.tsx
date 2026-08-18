import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Everything looks good ✨",
  message = "No issues or alerts matching your current criteria.",
  icon,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-card-lg bg-nude-cardSec/40 dark:bg-night-cardSoft/40 border border-dashed border-[#EFE4DC] dark:border-[#1C3547]">
      <div className="w-12 h-12 rounded-full bg-nude-peachTint/60 dark:bg-night-cardElevated flex items-center justify-center text-lightAccent-peach dark:text-nightAccent-peach mb-3 shadow-sm">
        {icon || <Sparkles className="w-6 h-6 animate-pulse" />}
      </div>
      <h3 className="font-heading font-semibold text-base text-textLight-heading dark:text-textNight-heading mb-1">
        {title}
      </h3>
      <p className="text-xs text-textLight-secondary dark:text-textNight-secondary max-w-sm mb-4 font-sans">
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
