import React from 'react';
import { Card } from '../common/Card';
import { LiveVolumeChart } from '../charts/LiveVolumeChart';
import { RefreshCw } from 'lucide-react';
import { useMonitoring } from '../../hooks/useMonitoring';

export const LiveMonitoringCard: React.FC = () => {
  const { hospitals, lastUpdated, autoRefresh, manualRefresh, isSimulatingUpdate } = useMonitoring();

  return (
    <Card variant="default" className="relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-heading font-black text-base lg:text-lg text-slate-900 dark:text-white">
              LIVE DATA MONITORING
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse-dot" />
              <span className="text-[10px] uppercase font-black text-emerald-800 dark:text-emerald-300">
                Receiving Data
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
            Real-time aggregate payload volume across {hospitals.length} hospital HL7/FHIR connectors
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold">
          <span>
            Last updated: <span className="font-mono text-slate-900 dark:text-white font-extrabold">{lastUpdated}</span>
          </span>
          <button
            onClick={manualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all cursor-pointer text-slate-800 dark:text-slate-200 font-extrabold"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSimulatingUpdate ? 'animate-spin text-blue-600' : ''}`} />
            <span>Auto: <strong className="text-emerald-600 font-black">{autoRefresh ? 'ON' : 'OFF'}</strong></span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <LiveVolumeChart />
    </Card>
  );
};
