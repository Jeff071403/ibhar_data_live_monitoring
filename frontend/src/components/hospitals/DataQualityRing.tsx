import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface DataQualityRingProps {
  score: number; // percentage 0 - 100
  size?: number;
  strokeWidth?: number;
}

export const DataQualityRing: React.FC<DataQualityRingProps> = ({
  score,
  size = 110,
  strokeWidth = 10
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 90
    ? (isDark ? '#91B7A5' : '#91A995')
    : score >= 75
    ? (isDark ? '#E5C46E' : '#E6C875')
    : (isDark ? '#D99AA5' : '#D98F9B');

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#1C3547' : '#EFE4DC'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-heading font-extrabold text-xl text-textLight-heading dark:text-textNight-heading">
          {score}%
        </span>
        <span className="text-[9px] font-cute uppercase tracking-wider text-textLight-muted dark:text-textNight-muted font-bold">
          Quality
        </span>
      </div>
    </div>
  );
};
