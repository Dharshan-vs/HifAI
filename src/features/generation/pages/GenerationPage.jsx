import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Zap,
  TrendingUp,
  Activity,
  Award,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import EnergyPredictionCard from '../components/EnergyPredictionCard';
import {
  GENERATION_DATASETS,
  COLOR_MAP,
  fetchGenerationMetrics,
} from '../../../services/generationService';

export default function GenerationPage() {
  const [timeframe, setTimeframe] = useState('today');
  const [metrics, setMetrics] = useState({
    todayTotal: '0.0 kWh',
    weeklyTotal: '0.0 kWh',
    monthlyTotal: '0.0 kWh',
    lifetimeTotal: '0.0 kWh',
    currentOutput: '0.0 kW',
    peakOutput: '0.0 kW',
    efficiency: '0.0%',
    co2Saved: '0.0 kg',
  });

  useEffect(() => {
    fetchGenerationMetrics().then(setMetrics);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-amber-100 mb-3 border border-white/20">
              <Zap className="w-3.5 h-3.5 text-lime-300" /> MODULE 2 • SOLAR & GRID GENERATION ANALYTICS
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Generation Telemetry</h1>
            <p className="text-amber-100/90 text-sm mt-1">
              Real-time solar generation monitoring and grid export telemetry.
            </p>
          </div>

          <div className="flex bg-white/15 backdrop-blur-md p-1 rounded-xl border border-white/20">
            {['today', 'weekly', 'monthly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  timeframe === tf ? 'bg-white text-navy shadow-md' : 'text-white/80 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Current Live Output"
          value={metrics.currentOutput}
          icon={Zap}
          color="primary"
          trend="up"
          trendValue="0.0 kW vs baseline"
          delay={0.1}
        />
        <StatsCard
          title="Peak Generation Rate"
          value={metrics.peakOutput}
          icon={TrendingUp}
          color="accent"
          trend="up"
          trendValue="Peak monitoring ready"
          delay={0.2}
        />
        <StatsCard
          title="System Efficiency"
          value={metrics.efficiency}
          icon={Activity}
          color="success"
          trend="up"
          trendValue="System Ready"
          delay={0.3}
        />
        <StatsCard
          title="CO₂ Avoided Today"
          value={metrics.co2Saved}
          icon={ShieldCheck}
          color="secondary"
          animate={false}
          delay={0.4}
        />
      </div>

      {/* AI Future Energy Generation & Surplus Forecasting Engine */}
      <EnergyPredictionCard />

      {/* Generation Summary Totals Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface rounded-2xl border border-border text-center shadow-xs">
        <div className="border-r border-border/60 last:border-0">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Today&apos;s Yield</p>
          <p className="text-xl font-black text-navy">{metrics.todayTotal}</p>
        </div>
        <div className="border-r border-border/60 last:border-0">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Weekly Total</p>
          <p className="text-xl font-black text-emerald-600">{metrics.weeklyTotal}</p>
        </div>
        <div className="border-r border-border/60 last:border-0">
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Monthly Yield</p>
          <p className="text-xl font-black text-cyan-600">{metrics.monthlyTotal}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-text-secondary uppercase">Lifetime Energy</p>
          <p className="text-xl font-black text-purple-600">{metrics.lifetimeTotal}</p>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="capitalize">{timeframe} Generation Breakdown (Solar vs Grid)</CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Categorized by Solar Array and Grid Feed-In</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-lg border border-amber-500/20">
              Recharts Telemetry
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                {timeframe === 'today' ? (
                  <AreaChart data={GENERATION_DATASETS.today}>
                    <defs>
                      <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_MAP.Solar} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLOR_MAP.Solar} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_MAP.Grid} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLOR_MAP.Grid} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} unit=" kW" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                    <Area type="monotone" dataKey="Solar" stroke={COLOR_MAP.Solar} fillOpacity={1} fill="url(#colorSolar)" />
                    <Area type="monotone" dataKey="Grid" stroke={COLOR_MAP.Grid} fillOpacity={1} fill="url(#colorGrid)" />
                  </AreaChart>
                ) : timeframe === 'weekly' ? (
                  <BarChart data={GENERATION_DATASETS.weekly}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} unit=" kWh" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                    <Bar dataKey="Solar" fill={COLOR_MAP.Solar} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Grid" fill={COLOR_MAP.Grid} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={GENERATION_DATASETS.monthly}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} unit=" kWh" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                    <Line type="monotone" dataKey="Solar" stroke={COLOR_MAP.Solar} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Grid" stroke={COLOR_MAP.Grid} strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Legend & Generation Mix */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Energy Source Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { type: 'Solar Array', share: '0%', color: 'bg-amber-500', hex: COLOR_MAP.Solar },
                { type: 'Grid Tie Feeder', share: '0%', color: 'bg-slate-500', hex: COLOR_MAP.Grid },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/70 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full ${item.color}`} />
                    <span className="font-semibold text-text-primary">{item.type}</span>
                  </div>
                  <span className="font-bold text-navy">{item.share}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gradient-dashboard-header text-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-lime-300 font-semibold text-sm">
                <Award className="w-4 h-4" /> System Telemetry Connected
              </div>
              <p className="text-xs text-white/80">
                Register your solar panels in Energy Systems to populate generation graphs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
