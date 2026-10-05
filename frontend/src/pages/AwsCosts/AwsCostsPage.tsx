import React, { useState, useEffect } from 'react';
import {
  Coins,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { apiService } from '../../services/api';

export const AwsCostsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setErrorMsg(null);
      const [sum, hr, day, srv, res] = await Promise.all([
        apiService.getAwsCostSummary(),
        apiService.getAwsHourlyCosts(24),
        apiService.getAwsDailyCosts(30),
        apiService.getAwsCostByService(7),
        apiService.getAwsRunningServices()
      ]);

      if (sum && sum.success !== false) setSummary(sum);
      if (hr && hr.results) setHourlyData(hr.results);
      if (day && day.results) setDailyData(day.results);
      if (srv && srv.services) setServiceData(srv.services);
      if (res && res.resources) setResources(res.resources);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to load AWS Cost telemetry:', err);
      setErrorMsg('Could not reach AWS Cost API. Showing cached snapshot.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Peak hourly computation
  const peakHourly = hourlyData.reduce((max: number, cur: any) => {
    const val = Number(cur.Total?.UnblendedCost?.Amount || 0);
    return val > max ? val : max;
  }, 0);

  // Hourly chart points for Line Graph
  const hourlyChartPoints = hourlyData.map((item: any) => {
    const amt = Number(item.Total?.UnblendedCost?.Amount || 0);
    const dt = new Date(item.TimePeriod?.Start || '');
    const hourStr = dt.getHours().toString().padStart(2, '0') + ':00';
    return {
      time: hourStr,
      cost: Number(amt.toFixed(4)),
      fullTime: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  // Daily total sum & Rank-based 4-Tier color mapping
  const total30Days = dailyData.reduce((sum: number, cur: any) => sum + Number(cur.Total?.UnblendedCost?.Amount || 0), 0);

  // Sorted unique amounts descending to compute exact rank
  const sortedAmounts = [...dailyData]
    .map((item: any) => Number(item.Total?.UnblendedCost?.Amount || 0))
    .sort((a, b) => b - a);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dailyChartPoints = dailyData.map((item: any) => {
    const amt = Number(item.Total?.UnblendedCost?.Amount || 0);
    const dt = new Date(item.TimePeriod?.Start || '');
    const dateLabel = `${monthNames[dt.getMonth()]} ${dt.getDate()}`;
    const rankIndex = sortedAmounts.indexOf(amt);

    let gradientId = 'dailyGreen';
    let rankBadge = 'Standard (Remaining)';
    let badgeColor = '#10B981';

    if (rankIndex < 3) {
      gradientId = 'dailyRose'; // Top 3 Highest -> Neon Rose
      rankBadge = `Top 3 Peak (#${rankIndex + 1})`;
      badgeColor = '#F43F5E';
    } else if (rankIndex < 6) {
      gradientId = 'dailyAmber'; // Next 3 -> Golden Orange
      rankBadge = `Top 4-6 High (#${rankIndex + 1})`;
      badgeColor = '#F59E0B';
    } else if (rankIndex < 9) {
      gradientId = 'dailyPurple'; // Next 3 -> Purple / Violet
      rankBadge = `Top 7-9 Moderate (#${rankIndex + 1})`;
      badgeColor = '#8B5CF6';
    }

    return {
      date: dateLabel,
      amount: amt,
      gradientId,
      rankBadge,
      badgeColor,
    };
  });

  const isMock = summary?.is_mock ?? true;
  const healthStatus = (summary?.integration_health || 'healthy').toLowerCase();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <Coins className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                AWS Cost & Telemetry
              </h1>
              {isMock ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  MOCK DATA MODE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  LIVE AWS
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Cloud Infrastructure Spend, Run Rates & Hospital DB Integration Health
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* External Wall Display Link */}
          <a
            href="http://localhost:8000/aws-costs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors"
            title="Open Dedicated Full-Screen Wall Display"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Wall Display</span>
          </a>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{lastUpdated ? `Updated ${lastUpdated}` : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error / Stale Banner */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Hourly Burn */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2">
            <span>HOURLY BURN</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ${Number(summary?.current_hourly_rate ?? 2.85).toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400">/hr</span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Est. ${(Number(summary?.current_hourly_rate ?? 2.85) * 24).toFixed(0)} / 24-hr day
          </p>
        </div>

        {/* KPI 2: Today's Spend */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2">
            <span>TODAY'S SPEND</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ${Number(summary?.today_cost ?? 68.40).toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Accrued since 00:00 UTC
          </p>
        </div>

        {/* KPI 3: Month-to-Date */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2">
            <span>MONTH-TO-DATE</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ${Number(summary?.mtd_cost ?? 412.50).toFixed(2)}
            </span>
          </div>
          <div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Number(summary?.budget_used_percent ?? 16))}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {summary?.budget_used_percent ?? 16}% of ${summary?.budget_limit ?? 2500} budget
            </p>
          </div>
        </div>

        {/* KPI 4: Month-End Forecast */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2">
            <span>FORECAST</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ${Number(summary?.forecast_cost ?? 2450.00).toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Target: &lt; ${summary?.budget_limit ?? 2500}
          </p>
        </div>

        {/* KPI 5: RDS DB Health */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1">
            <span>RDS DB HEALTH</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
              healthStatus === 'healthy' 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
            }`}>
              {healthStatus.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 my-1 py-1 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-center">
            <div>
              <span className="block text-[9px] font-bold text-slate-400">CPU</span>
              <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                {summary?.integration_health_details?.metrics?.cpu_utilization?.value ?? 24}%
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400">CONNS</span>
              <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                {summary?.integration_health_details?.metrics?.database_connections?.value ?? 52}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400">FREE</span>
              <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                {summary?.integration_health_details?.metrics?.free_storage_space_gb?.value ?? 124}G
              </span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
            PostgreSQL 15.4 Primary
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Cost Timeline (2 Cols) - Line Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Hourly Cost Timeline (Last 24 Hours)
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Real-time telemetry spend across ingestion pipelines
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Peak: <strong className="font-mono text-blue-600 dark:text-blue-400">${peakHourly.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {/* Recharts Area / Line Chart with X & Y Axes */}
          <div className="h-64 w-full pt-3 pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyChartPoints} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="hourlyCostGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15 * 10) / 10 || 5]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = Number(payload[0].value);
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-2xl text-xs font-mono border border-slate-700 pointer-events-none">
                          <div className="text-slate-400 text-[10px] font-bold border-b border-slate-800 pb-1 mb-1">
                            Time: {label}
                          </div>
                          <div className="text-blue-400 font-black text-sm">
                            Cost: ${val.toFixed(4)} / hr
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#hourlyCostGradient)"
                  dot={{ r: 3, fill: '#60a5fa', stroke: '#1d4ed8', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#93c5fd', stroke: '#1e40af', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost by AWS Service (1 Col) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-0.5">
              Cost by AWS Service (7 Days)
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
              Top infrastructure cost breakdown
            </p>

            <div className="space-y-2.5">
              {serviceData.map((srv: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {srv.service.replace('Amazon ', '').replace('AWS ', '')}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                      ${Number(srv.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-blue-500' :
                        idx === 1 ? 'bg-indigo-500' :
                        idx === 2 ? 'bg-emerald-500' :
                        idx === 3 ? 'bg-amber-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${srv.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Daily Spend Trend */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              30-Day Daily Spend Trend
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Aggregated daily Cost Explorer expenditure categorized by spend tiers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Color Legend for 4 Tiers */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold mr-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-[#F43F5E] border border-rose-200 dark:border-rose-900">
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                Top 3 Spike (#1-#3)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B] border border-amber-200 dark:border-amber-900">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                High (#4-#6)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[#8B5CF6] border border-purple-200 dark:border-purple-900">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                Moderate (#7-#9)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] border border-emerald-200 dark:border-emerald-900">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Baseline (Remaining)
              </span>
            </div>

            <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
              30-Day Total: ${total30Days.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Recharts BarChart with exact colors and X/Y axes */}
        <div className="h-64 w-full pt-3 pb-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartPoints} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                {/* 1. Neon Rose / Coral Pink (Top 1-3 Highest) */}
                <linearGradient id="dailyRose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>

                {/* 2. Amber / Golden Orange (Next 3) */}
                <linearGradient id="dailyAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                {/* 3. Purple / Violet (Next 3) */}
                <linearGradient id="dailyPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>

                {/* 4. Emerald / Mint Green (Remaining) */}
                <linearGradient id="dailyGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                interval={1}
              />

              <YAxis
                stroke="#64748b"
                tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                domain={[0, (dataMax: number) => Math.ceil((dataMax * 1.15) / 10) * 10 || 150]}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-2xl text-xs font-mono border border-slate-700 pointer-events-none space-y-1">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
                          <span className="text-slate-400 text-[10px] font-bold">{data.date}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white" style={{ backgroundColor: data.badgeColor }}>
                            {data.rankBadge}
                          </span>
                        </div>
                        <div className="text-white font-black text-sm">
                          Daily Spend: ${Number(data.amount).toFixed(2)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {dailyChartPoints.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Running AWS Resources Table */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Currently Running AWS Resources
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Live infrastructure inventory powering the Hospital Data Platform
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {resources.length} Active Resources
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Identifier / Name</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Configuration</th>
                <th className="py-2.5 px-3">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {resources.map((res: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-extrabold text-[11px] text-blue-600 dark:text-blue-400">
                      {res.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {res.name || res.id}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    {res.region}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {res.state}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {res.details || '—'}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    {res.uptime || 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AwsCostsPage;
