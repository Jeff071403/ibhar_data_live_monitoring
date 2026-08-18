import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin.monitoring@ibhar.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-nude-bg dark:bg-night-bg flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background Soft Pastel Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-[#E8A982]/30 to-[#D98F9B]/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tr from-[#A99BCB]/30 to-[#91B4D4]/30 blur-3xl pointer-events-none" />

      {/* Top Theme Switcher Positioned */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-nude-card dark:bg-night-card p-8 rounded-card-xl border border-[#EFE4DC] dark:border-[#102437] shadow-nude-hover dark:shadow-night-hover relative z-10 space-y-6"
      >
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[#E8A982] to-[#D98F9B] text-white shadow-md mb-2">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading tracking-tight">
              IBHAR
            </h1>
            <Sparkles className="w-4 h-4 text-lightAccent-peach dark:text-nightAccent-peach" />
          </div>
          <p className="text-xs font-cute uppercase tracking-widest text-textLight-muted dark:text-textNight-muted font-bold">
            Live Hospital Data Monitoring System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-cute uppercase font-bold text-textLight-secondary dark:text-textNight-secondary mb-1.5">
              Operator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-textLight-muted dark:text-textNight-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547] text-xs font-sans text-textLight-heading dark:text-textNight-heading focus:outline-none focus:ring-2 focus:ring-lightAccent-peach/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-cute uppercase font-bold text-textLight-secondary dark:text-textNight-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-textLight-muted dark:text-textNight-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547] text-xs font-sans text-textLight-heading dark:text-textNight-heading focus:outline-none focus:ring-2 focus:ring-lightAccent-peach/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-textLight-secondary dark:text-textNight-secondary cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-lightAccent-peach focus:ring-0" />
              <span>Remember 30-day session</span>
            </label>

            <a href="#forgot" className="text-lightAccent-peach font-cute font-semibold hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E8A982] to-[#D98F9B] text-white font-heading font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Access Monitoring Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#EFE4DC] dark:border-[#102437] text-center">
          <p className="text-[11px] text-textLight-muted dark:text-textNight-muted font-sans">
            Encrypted 256-bit mTLS Connection • 90 Hospital Network Nodes
          </p>
        </div>
      </motion.div>
    </div>
  );
};
