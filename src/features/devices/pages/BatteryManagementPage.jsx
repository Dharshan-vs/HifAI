import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, ArrowUpRight, ArrowDownLeft, ShieldCheck, RefreshCw, Layers, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { fetchUserTransactions, fetchEnergySummary } from '../../../services/marketplaceService';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/helpers';

export default function BatteryManagementPage() {
  const { user, userProfile } = useAuth();
  const isConsumer = !userProfile?.role || userProfile?.role === 'consumer';

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    p2p_energy_purchased_kwh: 0,
    energy_consumed_kwh: 0,
    battery_stored_kwh: 0,
  });

  const totalCapacity = 100.0; // 100 kWh total battery capacity

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txs, sumData] = await Promise.all([
        fetchUserTransactions(),
        fetchEnergySummary(),
      ]);
      setTransactions(txs || []);
      if (sumData) setSummary(sumData);
    } catch (err) {
      console.warn('Error loading battery management telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // PRODUCER METRICS:
  const dischargedToNeighborB = transactions.reduce(
    (acc, tx) => acc + (parseFloat(tx.energyAmount) || 0),
    0
  );
  const producerInitialStored =
    summary.battery_stored_kwh && summary.battery_stored_kwh > dischargedToNeighborB
      ? summary.battery_stored_kwh
      : (dischargedToNeighborB > 0 ? dischargedToNeighborB + 150.0 : 150.0);
  const producerRemainingPower = Math.max(0, producerInitialStored - dischargedToNeighborB);
  const producerTotalCap = Math.max(totalCapacity, producerInitialStored);
  const producerSoCPercent = producerTotalCap > 0 ? Math.min(100, Math.round((producerRemainingPower / producerTotalCap) * 100)) : 0;

  // CONSUMER METRICS:
  // 1. Power Bought from Producer:
  const powerBoughtKwh = summary.p2p_energy_purchased_kwh || 0;
  // 2. Total Battery Electricity (Base stored + Power Bought):
  const consumerBaseStored = summary.battery_stored_kwh || 0;
  const consumerTotalBatteryKwh = consumerBaseStored + powerBoughtKwh;
  // 3. Power Consumed (Home appliances draw):
  const powerConsumedKwh = summary.energy_consumed_kwh || 0;
  // 4. Remaining Power:
  const consumerRemainingPowerKwh = Math.max(0, consumerTotalBatteryKwh - powerConsumedKwh);
  const consumerSoCPercent = totalCapacity > 0 ? Math.min(100, Math.round((consumerRemainingPowerKwh / totalCapacity) * 100)) : 0;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Energy Devices', path: '/devices' }, { label: 'Battery Management' }]} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-[var(--radius-card)] p-6 sm:p-7 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 mb-2 border border-white/20">
              <Battery className="w-3.5 h-3.5 text-lime-300" />
              {isConsumer ? 'CONSUMER BATTERY & POWER BOUGHT TELEMETRY' : 'PRODUCER BATTERY & P2P DISCHARGE TELEMETRY'}
            </div>
            <h1 className="text-2xl font-extrabold font-heading tracking-tight">Household Battery Storage Management</h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-xl">
              {isConsumer
                ? 'Track power bought from solar producers, battery capacity, power consumed by home appliances, and remaining stored reserves.'
                : 'Monitor stored electricity, track power discharged to Neighbor Household B, and manage remaining battery reserves.'}
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 bg-lime-400 text-navy hover:bg-lime-300 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 4 Core Battery Cards for Consumer vs Producer */}
      {isConsumer ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Power Bought */}
          <StatsCard
            title="Power Bought (P2P Solar)"
            value={powerBoughtKwh}
            unit="kWh"
            icon={ArrowDownLeft}
            color="success"
            trend="up"
            trendValue="Transferred to Household Battery"
            delay={0.1}
          />

          {/* Card 2: Total Battery Electricity */}
          <StatsCard
            title="Total Battery Electricity"
            value={consumerTotalBatteryKwh}
            unit="kWh"
            icon={Battery}
            color="primary"
            trend="up"
            trendValue={`Base + ${powerBoughtKwh} kWh Bought`}
            delay={0.2}
          />

          {/* Card 3: Power Consumed */}
          <StatsCard
            title="Power Consumed"
            value={powerConsumedKwh}
            unit="kWh"
            icon={Zap}
            color="secondary"
            trend="up"
            trendValue="Home Appliances Draw"
            delay={0.3}
          />

          {/* Card 4: Remaining Power */}
          <StatsCard
            title="Remaining Stored Power"
            value={consumerRemainingPowerKwh}
            unit="kWh"
            icon={ShieldCheck}
            color="accent"
            trend="up"
            trendValue={`State of Charge: ${consumerSoCPercent}%`}
            delay={0.4}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Stored Electricity */}
          <StatsCard
            title="Total Stored Electricity"
            value={producerInitialStored}
            unit="kWh"
            icon={Battery}
            color="primary"
            trend="up"
            trendValue={`Initial Reserve: ${producerInitialStored} kWh`}
            delay={0.1}
          />

          {/* Card 2: Discharged Power */}
          <StatsCard
            title="Discharged Power"
            value={dischargedToNeighborB}
            unit="kWh"
            icon={ArrowUpRight}
            color="accent"
            trend="up"
            trendValue="P2P Solar Feed-In Discharged"
            delay={0.2}
          />

          {/* Card 3: Remaining Stored Power */}
          <StatsCard
            title="Remaining Stored Power"
            value={producerRemainingPower}
            unit="kWh"
            icon={Zap}
            color="success"
            trend="up"
            trendValue={`State of Charge: ${producerSoCPercent}%`}
            delay={0.3}
          />
        </div>
      )}

      {/* Visual State of Charge (SoC) Bar */}
      <Card className="border-border shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Live Battery State of Charge (SoC)</h3>
              <p className="text-xs text-text-secondary">
                {isConsumer ? 'Household BESS Battery Reserve & Power Bought Level' : 'Producer BESS Battery Level & Discharge to House B'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-mono font-extrabold border border-emerald-500/20">
            {isConsumer ? `${consumerSoCPercent}% SoC` : `${producerSoCPercent}% SoC`}
          </span>
        </div>

        {/* Progress Bar Visualizer */}
        <div className="space-y-2">
          <div className="w-full h-6 bg-background rounded-xl border border-border p-1 overflow-hidden flex gap-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${isConsumer ? consumerSoCPercent : producerSoCPercent}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg"
              title={`Remaining Charge: ${isConsumer ? consumerRemainingPowerKwh : producerRemainingPower} kWh`}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-text-secondary pt-1">
            <span>Remaining Reserve: <strong className="text-navy">{isConsumer ? consumerRemainingPowerKwh.toFixed(1) : producerRemainingPower.toFixed(1)} kWh</strong></span>
            <span>{isConsumer ? `Power Bought: ${powerBoughtKwh} kWh` : `Discharged to House B: ${dischargedToNeighborB} kWh`}</span>
          </div>
        </div>
      </Card>

      {/* Discharge / Power Received History Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {isConsumer ? 'P2P Electricity Received Log' : 'P2P Energy Discharged Log (Neighbor Household B)'}
            </CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              {isConsumer
                ? 'Physical clean solar power received from producers and deposited into household battery'
                : 'Physical clean energy discharged over local microgrid line to Neighbor Household B'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
            Microgrid Feeder A
          </span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-background/80 text-text-secondary uppercase text-[10px] font-bold border-b border-border tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">{isConsumer ? 'Source Solar Producer' : 'Destination Household'}</th>
                  <th className="py-3 px-4">{isConsumer ? 'Power Bought & Received' : 'Power Discharged'}</th>
                  <th className="py-3 px-4">{isConsumer ? 'Amount Paid' : 'Revenue Earned'}</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Physical Transfer Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary text-xs">
                      No P2P energy transfer transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-background/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy">{tx.id}</td>
                      <td className="py-3.5 px-4 text-text-primary font-medium">
                        {isConsumer ? (tx.seller || 'SunPower Solar Array') : 'Neighbor Household B (Smart Meter: SE-98210-SM1)'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        ⚡ {tx.energyAmount} kWh {isConsumer ? 'Received' : 'Discharged to House B'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                        ₹{typeof tx.price === 'number' ? tx.price.toFixed(2) : tx.price}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-[11px]">
                        {tx.date ? formatDate(tx.date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-extrabold uppercase border border-emerald-500/20">
                          {isConsumer ? 'Deposited to Battery' : 'Discharged to House B'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
