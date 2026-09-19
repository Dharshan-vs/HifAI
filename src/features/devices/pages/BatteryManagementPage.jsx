import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Battery,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  RefreshCw,
  Layers,
  Home,
  Settings,
  Trash2,
  AlertTriangle,
  Sun,
  Clock,
  MapPin,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import Breadcrumb from '../../../components/common/Breadcrumb';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import {
  fetchUserTransactions,
  fetchEnergySummary,
  fetchProducerEnergyQuota,
  deleteEnergyOffer,
  saveUserBatteryCapacity,
} from '../../../services/marketplaceService';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/helpers';

export default function BatteryManagementPage() {
  const { user, userProfile } = useAuth();
  const isConsumer = !userProfile?.role || userProfile?.role === 'consumer';

  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    p2p_energy_purchased_kwh: 0,
    energy_consumed_kwh: 0,
    battery_stored_kwh: 0,
    p2p_energy_sold_kwh: 0,
  });

  const [energyQuota, setEnergyQuota] = useState({
    totalCapacityKwh: 150.0,
    totalSoldKwh: 0,
    currentBatteryBalanceKwh: 150.0,
    activeListedKwh: 0,
    remainingPostableKwh: 150.0,
    activeOffersCount: 0,
    activeOffers: [],
  });

  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [customBatteryCapacity, setCustomBatteryCapacity] = useState('150.0');

  const totalCapacity = 100.0; // 100 kWh total battery capacity for consumers

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUid = user?.uid || 'guest';
      const [txs, sumData, quota] = await Promise.all([
        fetchUserTransactions(currentUid),
        fetchEnergySummary(currentUid),
        fetchProducerEnergyQuota(currentUid, userProfile?.fullName),
      ]);
      setTransactions(txs || []);
      if (sumData) setSummary(sumData);
      if (quota) {
        setEnergyQuota(quota);
        setCustomBatteryCapacity(String(quota.totalCapacityKwh || 150.0));
      }
    } catch (err) {
      console.warn('Error loading battery management telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, userProfile?.fullName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateBatteryCapacity = (e) => {
    e.preventDefault();
    const val = parseFloat(customBatteryCapacity);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid battery storage capacity greater than 0 kWh');
      return;
    }
    saveUserBatteryCapacity(user?.uid, val);
    toast.success(`Battery capacity updated to ${val.toFixed(1)} kWh!`);
    setShowBatteryModal(false);
    loadData();
  };

  const handleCancelOffer = async (offerId, energyKwh) => {
    setCancellingId(offerId);
    try {
      await deleteEnergyOffer(offerId);
      toast.success(`Offer #${offerId} cancelled! ${energyKwh} kWh restored to available battery quota.`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel energy offer');
    } finally {
      setCancellingId(null);
    }
  };

  // PRODUCER METRICS (Accurate calculation synced across system):
  const producerTotalCap = energyQuota.totalCapacityKwh || 150.0;
  const producerSoldDischarged = energyQuota.totalSoldKwh || 0;
  const producerPhysicalStoredBalance = energyQuota.currentBatteryBalanceKwh || Math.max(0, producerTotalCap - producerSoldDischarged);
  const producerActiveListedKwh = energyQuota.activeListedKwh || 0;
  const producerRemainingAvailableKwh = energyQuota.remainingPostableKwh;
  const producerSoCPercent = producerTotalCap > 0 ? Math.min(100, Math.round((producerPhysicalStoredBalance / producerTotalCap) * 100)) : 0;
  const producerAvailablePercent = producerTotalCap > 0 ? Math.min(100, Math.round((producerRemainingAvailableKwh / producerTotalCap) * 100)) : 0;

  // CONSUMER METRICS:
  const powerBoughtKwh = summary.p2p_energy_purchased_kwh || 0;
  const consumerBaseStored = summary.battery_stored_kwh || 0;
  const consumerTotalBatteryKwh = consumerBaseStored + powerBoughtKwh;
  const powerConsumedKwh = summary.energy_consumed_kwh || 0;
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
                : 'Monitor total stored electricity, active marketplace listings, discharged power to neighbors, and unallocated battery reserves.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isConsumer && (
              <button
                onClick={() => setShowBatteryModal(true)}
                className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 shadow-md transition-all flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4 text-lime-300" /> Set Battery Size
              </button>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 bg-lime-400 text-navy hover:bg-lime-300 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
            </button>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Battery Capacity */}
          <StatsCard
            title="Total Battery Storage"
            value={producerTotalCap}
            unit="kWh"
            icon={Battery}
            color="primary"
            trend="up"
            trendValue={`Configured: ${producerTotalCap} kWh`}
            delay={0.1}
          />

          {/* Card 2: Sold & Discharged Power */}
          <StatsCard
            title="Sold & Discharged"
            value={producerSoldDischarged}
            unit="kWh"
            icon={ArrowUpRight}
            color="secondary"
            trend="up"
            trendValue="Delivered to Buyers"
            delay={0.2}
          />

          {/* Card 3: Active in Marketplace */}
          <StatsCard
            title="Active in Marketplace"
            value={producerActiveListedKwh}
            unit="kWh"
            icon={Zap}
            color="accent"
            trend="up"
            trendValue={`${energyQuota.activeOffersCount} Active Listings Posted`}
            delay={0.3}
          />

          {/* Card 4: Remaining Available / Unlisted Reserve */}
          <StatsCard
            title="Available / Unlisted Power"
            value={producerRemainingAvailableKwh}
            unit="kWh"
            icon={ShieldCheck}
            color="success"
            trend="up"
            trendValue={
              producerRemainingAvailableKwh <= 0
                ? '0.0 kWh (100% Listed in Market)'
                : `Ready to Post: ${producerRemainingAvailableKwh.toFixed(1)} kWh`
            }
            delay={0.4}
          />
        </div>
      )}

      {/* Visual State of Charge (SoC) & Allocation Bar */}
      <Card className="border-border shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Live Battery Storage &amp; Allocation Status</h3>
              <p className="text-xs text-text-secondary">
                {isConsumer
                  ? 'Household BESS Battery Reserve & Power Bought Level'
                  : 'Producer Battery Storage Capacity, Active Marketplace Commitments, and Free Power'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-mono font-extrabold border border-emerald-500/20">
              {isConsumer ? `${consumerSoCPercent}% SoC` : `${producerSoCPercent}% Physical SoC`}
            </span>
          </div>
        </div>

        {/* Progress Bar Visualizer */}
        <div className="space-y-2">
          <div className="w-full h-7 bg-background rounded-xl border border-border p-1 overflow-hidden flex gap-1">
            {isConsumer ? (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${consumerSoCPercent}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg"
                title={`Remaining Charge: ${consumerRemainingPowerKwh.toFixed(1)} kWh`}
              />
            ) : (
              <>
                {/* Active Marketplace Listings (Amber) */}
                {producerActiveListedKwh > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (producerActiveListedKwh / producerTotalCap) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg"
                    title={`Active in Marketplace: ${producerActiveListedKwh.toFixed(1)} kWh`}
                  />
                )}
                {/* Free Available Reserve (Emerald) */}
                {producerRemainingAvailableKwh > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (producerRemainingAvailableKwh / producerTotalCap) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg"
                    title={`Unlisted Available: ${producerRemainingAvailableKwh.toFixed(1)} kWh`}
                  />
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center text-xs font-semibold text-text-secondary pt-1 gap-2">
            {isConsumer ? (
              <>
                <span>Remaining Reserve: <strong className="text-navy">{consumerRemainingPowerKwh.toFixed(1)} kWh</strong></span>
                <span>Power Bought: {powerBoughtKwh} kWh</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Listed in Market: <strong className="text-amber-600">{producerActiveListedKwh.toFixed(1)} kWh</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Available to Post: <strong className="text-emerald-600">{producerRemainingAvailableKwh.toFixed(1)} kWh</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span>Sold &amp; Discharged: <strong className="text-rose-600">{producerSoldDischarged.toFixed(1)} kWh</strong></span>
                  </span>
                </div>
                <span>Physical Balance: <strong className="text-navy">{producerPhysicalStoredBalance.toFixed(1)} / {producerTotalCap} kWh</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Informative Status Callout when Producer has 100% listed */}
        {!isConsumer && producerActiveListedKwh > 0 && producerRemainingAvailableKwh <= 0 && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                ⚠️ All your stored battery energy ({producerPhysicalStoredBalance.toFixed(1)} kWh) is currently listed in the Marketplace!
              </p>
              <p className="text-[11px] text-text-secondary">
                Because all {producerActiveListedKwh.toFixed(1)} kWh has been posted as active offers, your available unlisted power is <strong>0.0 kWh</strong>. If you wish to post different energy offers or reclaim your battery capacity, you can withdraw an active listing below.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* PRODUCER ONLY: Active Marketplace Energy Listings Management Section */}
      {!isConsumer && (
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Active Marketplace Energy Offers ({energyQuota.activeOffersCount})</span>
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Active solar energy offers posted by you. Withdrawing an offer restores its kWh to your available battery balance.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-700 rounded-lg border border-amber-500/20">
              Total Listed: {producerActiveListedKwh.toFixed(1)} kWh
            </span>
          </CardHeader>
          <CardContent>
            {energyQuota.activeOffers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
                <Sun className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-navy">No active marketplace listings right now.</p>
                <p className="text-[11px] text-text-secondary">
                  Your full battery balance of {producerPhysicalStoredBalance.toFixed(1)} kWh is unallocated and ready to post on the Marketplace.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {energyQuota.activeOffers.map((offer) => {
                  const offerKwh = parseFloat(offer.remaining_kwh ?? offer.energy_kwh) || 0;
                  const price = parseFloat(offer.price_per_kwh) || 7.2;
                  const totalVal = (offerKwh * price).toFixed(2);
                  const isCancelling = cancellingId === offer.id;

                  return (
                    <div
                      key={offer.id}
                      className="p-4 bg-background rounded-xl border border-border hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-extrabold rounded-md uppercase border border-emerald-500/20">
                              {offer.id}
                            </span>
                            <span className="text-xs font-bold text-navy">{offer.energy_source || 'Solar'} Energy Offer</span>
                          </div>
                          <p className="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{offer.seller_location || 'Local Substation Area'}</span>
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-700 text-[10px] font-extrabold uppercase rounded-full">
                          Live Active
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-surface rounded-lg text-center text-xs">
                        <div>
                          <span className="text-[10px] text-text-secondary block">Listed Power</span>
                          <span className="font-mono font-extrabold text-emerald-600">{offerKwh.toFixed(1)} kWh</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-secondary block">Tariff Rate</span>
                          <span className="font-mono font-bold text-navy">₹{price.toFixed(2)}/kWh</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-secondary block">Total Value</span>
                          <span className="font-mono font-extrabold text-navy">₹{totalVal}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-border/60">
                        <span className="text-[10px] text-text-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{offer.created_at ? formatDate(offer.created_at, { month: 'short', day: 'numeric' }) : 'Today'}</span>
                        </span>
                        <button
                          onClick={() => handleCancelOffer(offer.id, offerKwh)}
                          disabled={isCancelling}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border border-rose-500/20 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isCancelling ? 'Withdrawing...' : 'Withdraw & Reclaim Power'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Configure Battery Storage Capacity Modal */}
      <Modal
        isOpen={showBatteryModal}
        onClose={() => setShowBatteryModal(false)}
        title="Configure Producer Battery Storage Capacity"
      >
        <form onSubmit={handleUpdateBatteryCapacity} className="space-y-4 pt-2 text-xs">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <Battery className="w-4 h-4 text-emerald-600" />
              <span>Customized Producer Battery Size</span>
            </div>
            <p className="text-text-secondary text-[11px]">
              Every household or solar farm producer has different battery storage (e.g. 80 kWh, 150 kWh, 250 kWh). Set your actual battery storage capacity below.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Total Battery Storage Capacity (kWh)
            </label>
            <Input
              type="number"
              step="1"
              min="5"
              max="5000"
              placeholder="e.g. 150.0"
              value={customBatteryCapacity}
              onChange={(e) => setCustomBatteryCapacity(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-background border border-border rounded-xl space-y-1 text-[11px]">
            <span className="font-bold text-navy block">💡 Active Selling &amp; Storage Logic:</span>
            <div className="text-text-secondary space-y-0.5">
              <p>• <strong>Max Available to Sell:</strong> Total Capacity ({customBatteryCapacity || '150'} kWh) in single or split postings.</p>
              <p>• <strong>Battery Balance:</strong> Automatically decreases as energy is sold (e.g. 150 kWh - 50 kWh sold = 100 kWh balance).</p>
              <p>• <strong>Available to Post:</strong> Current Battery Balance minus any active unfulfilled marketplace listings.</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBatteryModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Save Battery Capacity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
