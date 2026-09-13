import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import {
  CONSUMPTION_DATASETS,
  fetchConsumptionMetrics,
} from '../../../services/consumptionService';

export default function ConsumptionPage() {
  const [metrics, setMetrics] = useState({
    dailyTotal: '0.0 kWh',
    weeklyTotal: '0.0 kWh',
    monthlyTotal: '0.0 kWh',
    peakUsage: '0.0 kW',
    averageUsage: '0.0 kW',
    renewableRatio: '0.0%',
    gridRatio: '0.0%',
  });

  useEffect(() => {
    fetchConsumptionMetrics().then(setMetrics);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-teal-100 mb-3 border border-white/20">
            <Activity className="w-3.5 h-3.5 text-lime-300" /> MODULE 3 • ENERGY CONSUMPTION MONITORING
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Energy Consumption Analytics</h1>
          <p className="text-teal-100/90 text-sm mt-1">
            Track solar vs grid power consumption, peak demand, and energy usage telemetry.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Daily Consumption"
          value={metrics.dailyTotal}
          icon={Activity}
          color="secondary"
          trend="down"
          trendValue="Clean Start"
          delay={0.1}
        />
        <StatsCard
          title="Peak Load Demand"
          value={metrics.peakUsage}
          icon={Zap}
          color="accent"
          trend="up"
          trendValue="Standard Monitoring"
          delay={0.2}
        />
        <StatsCard
          title="Average Hourly Power"
          value={metrics.averageUsage}
          icon={Clock}
          color="primary"
          trend="down"
          trendValue="Baseline Rate"
          delay={0.3}
        />
        <StatsCard
          title="Renewable Share"
          value={metrics.renewableRatio}
          icon={ShieldCheck}
          color="success"
          trend="up"
          trendValue="Solar vs Grid Split"
          delay={0.4}
        />
      </div>

      {/* Recharts Consumption & Source Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak vs Average Consumption Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily Load Profile (Peak vs Average kW)</CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Hourly load telemetry over 24-hour cycle</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-600 rounded-lg border border-cyan-500/20">
              Smart Meter Telemetry
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CONSUMPTION_DATASETS.daily}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} unit=" kW" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="Peak" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Avg" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Energy Source Split Pie Chart (Solar vs Grid) */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Source Split (%)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CONSUMPTION_DATASETS.sourceSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {CONSUMPTION_DATASETS.sourceSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-2 pt-2 border-t border-border">
              {CONSUMPTION_DATASETS.sourceSplit.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-text-primary">{item.name}</span>
                  </div>
                  <span className="font-bold text-navy">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
