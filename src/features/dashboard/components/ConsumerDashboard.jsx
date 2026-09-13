import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Sun,
  Zap,
  Battery,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import { fetchEnergySummary } from '../../../services/marketplaceService';

export default function ConsumerDashboard({ userProfile }) {
  const displayName = userProfile?.fullName || 'Energy Consumer';
  const [summary, setSummary] = useState({
    solar_generated_kwh: 0,
    energy_consumed_kwh: 0,
    battery_stored_kwh: 0,
    p2p_energy_sold_kwh: 0,
    p2p_energy_purchased_kwh: 0,
  });

  useEffect(() => {
    async function loadSummary() {
      const data = await fetchEnergySummary();
      if (data) setSummary(data);
    }
    loadSummary();
  }, []);

  const communitySavings = [
    { label: 'Standard Utility Grid Rate', rate: '₹10.50 / kWh', total: '₹0.00' },
    { label: 'YUGA Community Solar Rate', rate: '₹7.20 / kWh', total: '₹0.00', highlight: true },
  ];

  return (
    <div className="space-y-8">
      {/* Consumer Hero Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-emerald-100 mb-3 border border-white/20">
                <Home className="w-3.5 h-3.5 text-lime-300" /> CONSUMER PORTAL • Household Solar Monitoring
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Hello, {displayName}</h1>
              <p className="text-emerald-100/90 text-sm mt-1">
                Monitor your solar generation, home energy draw, and P2P marketplace transactions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Consumer Battery Management Telemetry Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-surface border border-emerald-500/30 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden bg-gradient-to-r from-surface via-emerald-500/5 to-teal-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                <Battery className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-navy font-heading">Consumer Battery Management & Power Bought</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-extrabold uppercase border border-emerald-500/20">
                    Active Household Telemetry
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Real-time household battery telemetry: tracks power bought from solar producers, total stored battery energy, home consumption, and remaining reserves.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              <div className="px-3 py-2 bg-background rounded-xl border border-border text-center">
                <span className="text-[9px] font-bold text-emerald-600 uppercase block">Power Bought</span>
                <span className="text-sm font-extrabold font-mono text-emerald-600">
                  {summary.p2p_energy_purchased_kwh || 0} kWh
                </span>
              </div>
              <div className="px-3 py-2 bg-background rounded-xl border border-border text-center">
                <span className="text-[9px] font-bold text-navy uppercase block">Total Battery</span>
                <span className="text-sm font-extrabold font-mono text-navy">
                  {((summary.battery_stored_kwh || 0) + (summary.p2p_energy_purchased_kwh || 0)).toFixed(1)} kWh
                </span>
              </div>
              <div className="px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                <span className="text-[9px] font-bold text-amber-700 uppercase block">Power Consumed</span>
                <span className="text-sm font-extrabold font-mono text-amber-600">
                  {summary.energy_consumed_kwh || 0} kWh
                </span>
              </div>
              <div className="px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                <span className="text-[9px] font-bold text-emerald-700 uppercase block">Remaining Power</span>
                <span className="text-sm font-extrabold font-mono text-emerald-600">
                  {Math.max(0, (summary.battery_stored_kwh || 0) + (summary.p2p_energy_purchased_kwh || 0) - (summary.energy_consumed_kwh || 0)).toFixed(1)} kWh
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats — Focused Consumer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Energy Consumed"
          value={summary.energy_consumed_kwh}
          unit="kWh"
          icon={Zap}
          color="secondary"
          delay={0.1}
        />
        <StatsCard
          title="Battery Status"
          value={summary.battery_stored_kwh}
          unit="kWh"
          icon={Battery}
          color="primary"
          delay={0.2}
        />
        <StatsCard
          title="P2P Energy Received"
          value={summary.p2p_energy_purchased_kwh}
          unit="kWh"
          icon={ArrowDownLeft}
          color="success"
          delay={0.3}
        />
      </div>

      {/* Consumption Breakdown & Tariff Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Power Usage Trend</CardTitle>
                <p className="text-xs text-text-secondary mt-0.5">Real-time solar telemetry reading per hour</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
                Solar Connected
              </span>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6 space-y-2">
                <Sun className="w-8 h-8 text-amber-500/60" />
                <p className="text-xs font-semibold text-text-primary">
                  No energy data available yet.
                </p>
                <p className="text-xs text-text-secondary max-w-sm">
                  Connect your solar device to start monitoring your daily power generation and consumption.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tariff Savings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>YUGA Community Rate vs Utility Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communitySavings.map((item, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border transition-all ${
                      item.highlight
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-text-primary shadow-sm'
                        : 'bg-background border-border text-text-secondary'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span>{item.label}</span>
                      <span className="font-bold text-navy">{item.rate}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                      <span className="text-xs">Est. Bill</span>
                      <span className={`text-sm font-extrabold ${item.highlight ? 'text-emerald-600' : 'text-text-primary'}`}>
                        {item.total}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-lime-400/15 border border-lime-400/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>YUGA Community solar tariff active for your account.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
