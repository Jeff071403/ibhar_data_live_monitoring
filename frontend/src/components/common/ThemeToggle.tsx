import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Night Mode"
      className="relative flex items-center justify-between w-14 h-8 px-1 rounded-full bg-nude-bgMuted dark:bg-night-cardElevated border border-[#EFE4DC] dark:border-[#1C3547] cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-lightAccent-peach/50 dark:focus:ring-nightAccent-peach/50"
    >
      <Sun className={`w-4 h-4 z-10 transition-colors ${isDark ? 'text-textNight-muted' : 'text-[#D98282]'}`} />
      <Moon className={`w-4 h-4 z-10 transition-colors ${isDark ? 'text-[#8FB9D9]' : 'text-textLight-muted'}`} />

      <motion.div
        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-[#102437] shadow-md border border-gray-100 dark:border-[#1F3A52]"
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
};
