import React from 'react';
import { motion } from 'framer-motion';

export type CardVariant = 'default' | 'sec' | 'peach' | 'lavender' | 'sage' | 'blue' | 'yellow' | 'top-peach' | 'top-lavender' | 'top-sage' | 'top-blue' | 'top-yellow' | 'outline-peach' | 'outline-lavender' | 'outline-sage' | 'outline-blue' | 'outline-yellow';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  hoverEffect = false,
  onClick,
  style
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'peach':
        return 'bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 text-white shadow-xl shadow-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/45 border border-white/20';
      case 'lavender':
        return 'bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700 text-white shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/45 border border-white/20';
      case 'sage':
        return 'bg-gradient-to-br from-emerald-400 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/45 border border-white/20';
      case 'blue':
        return 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/45 border border-white/20';
      case 'yellow':
        return 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/45 border border-white/20';
      case 'outline-peach':
        return 'bg-white dark:bg-slate-900 border-2 border-rose-500 text-slate-800 dark:text-slate-100 shadow-xl shadow-rose-500/5 hover:shadow-2xl hover:shadow-rose-500/10';
      case 'outline-lavender':
        return 'bg-white dark:bg-slate-900 border-2 border-purple-500 text-slate-800 dark:text-slate-100 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10';
      case 'outline-sage':
        return 'bg-white dark:bg-slate-900 border-2 border-emerald-500 text-slate-800 dark:text-slate-100 shadow-xl shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/10';
      case 'outline-blue':
        return 'bg-white dark:bg-slate-900 border-2 border-blue-500 text-slate-800 dark:text-slate-100 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10';
      case 'outline-yellow':
        return 'bg-white dark:bg-slate-900 border-2 border-amber-500 text-slate-800 dark:text-slate-100 shadow-xl shadow-amber-500/5 hover:shadow-2xl hover:shadow-amber-500/10';
      case 'top-peach':
        return 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-t-4 border-t-rose-500 shadow-xl shadow-slate-200/80 dark:shadow-black/60 hover:shadow-2xl';
      case 'top-lavender':
        return 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-t-4 border-t-purple-500 shadow-xl shadow-slate-200/80 dark:shadow-black/60 hover:shadow-2xl';
      case 'top-sage':
        return 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 shadow-xl shadow-slate-200/80 dark:shadow-black/60 hover:shadow-2xl';
      case 'top-blue':
        return 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-t-4 border-t-blue-500 shadow-xl shadow-slate-200/80 dark:shadow-black/60 hover:shadow-2xl';
      case 'top-yellow':
        return 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-t-4 border-t-amber-500 shadow-xl shadow-slate-200/80 dark:shadow-black/60 hover:shadow-2xl';
      case 'sec':
        return 'bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/80 dark:shadow-black/50 hover:shadow-2xl';
      case 'default':
      default:
        return 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/80 dark:shadow-black/60 hover:shadow-2xl';
    }
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, scale: 1.01, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      style={style}
      className={`rounded-3xl p-5 transition-all duration-300 transform ${getVariantStyles()} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};
