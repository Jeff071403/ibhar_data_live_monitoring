import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy Hospital ID"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs bg-nude-bgMuted/60 dark:bg-night-cardElevated text-textLight-secondary dark:text-textNight-secondary hover:text-textLight-heading dark:hover:text-textNight-heading hover:bg-nude-cardSec dark:hover:bg-night-cardSoft border border-[#EFE4DC]/60 dark:border-[#1C3547] transition-all cursor-pointer ${className}`}
    >
      <span>{text}</span>
      {copied ? (
        <Check className="w-3 h-3 text-lightAccent-[#91A995] dark:text-[#91B7A5]" />
      ) : (
        <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
      )}
    </button>
  );
};
