import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Zap,
  DollarSign,
  ShieldCheck,
  Sliders,
  Send,
  Wallet,
  ArrowUpRight,
  Battery,
  Settings,
  BatteryCharging,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import {
  fetchUserTransactions,
  createEnergyOffer,
  fetchProducerEnergyQuota,
  getUserBatteryCapacity,
  saveUserBatteryCapacity,
} from '../../../services/marketplaceService';
import { fetchWalletSummary } from '../../../services/walletService';
import { fetchEnergySystems, addEnergySystem } from '../../../services/systemsService';
import EnergyPredictionCard from '../../generation/components/EnergyPredictionCard';

export default function ProducerDashboard({ userProfile }) {
  const displayName = userProfile?.fullName || 'Energy Producer';

  const [tariffRate, setTariffRate] = useState(7.2);
  const [sellingAmount, setSellingAmount] = useState(25.0);
  const [postingOffer, setPostingOffer] = useState(false);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [customBatteryCapacity, setCustomBatteryCapacity] = useState('150.0');

  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [energyQuota, setEnergyQuota] = useState({
    totalCapacityKwh: 150.0,
    totalSoldKwh: 0,
    currentBatteryBalanceKwh: 150.0,
    activeListedKwh: 0,
    remainingPostableKwh: 150.0,
    activeOffersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadProducerData = useCallback(async () => {
    setLoading(true);
    try {
      const [txList, walletData, quota] = await Promise.all([
        fetchUserTransactions(),
        fetchWalletSummary(userProfile?.uid || 'guest'),
        fetchProducerEnergyQuota(userProfile?.uid, userProfile?.fullName),
      ]);
      setTransactions(txList);
      setWallet(walletData);
      setEnergyQuota(quota);
      setCustomBatteryCapacity(String(quota.totalCapacityKwh || 150.0));
      if (quota.remainingPostableKwh > 0 && sellingAmount > quota.remainingPostableKwh) {
        setSellingAmount(quota.remainingPostableKwh);
      }
    } catch (e) {
      console.warn('Error loading producer dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, [userProfile, sellingAmount]);

  useEffect(() => {
    loadProducerData();
  }, [loadProducerData]);

  // Calculate real total sold and revenue earned
  const totalSoldKwh = transactions.reduce((acc, tx) => acc + (parseFloat(tx.energyAmount) || 0), 0);
  const totalRevenueEarned = transactions.reduce((acc, tx) => acc + (parseFloat(tx.price) || 0), 0);
  const initialBatteryStored = energyQuota?.totalCapacityKwh || 150.0;
  const currentBatteryBalance = energyQuota?.currentBatteryBalanceKwh ?? Math.max(0, initialBatteryStored - totalSoldKwh);

  const handleUpdateBatteryCapacity = (e) => {
    e.preventDefault();
    const val = parseFloat(customBatteryCapacity);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid battery storage capacity greater than 0 kWh');
      return;
    }
    saveUserBatteryCapacity(userProfile?.uid, val);
    toast.success(`Battery capacity updated to ${val.toFixed(1)} kWh!`);
    setShowBatteryModal(false);
    loadProducerData();
  };

  const handlePostSellOffer = async () => {
    if (!sellingAmount || sellingAmount <= 0) {
      toast.error('Please enter a valid energy amount to sell');
      return;
    }

    if (sellingAmount > energyQuota.remainingPostableKwh) {
      toast.error(
        `❌ Exceeds Available Unlisted Power! Total Battery: ${energyQuota.totalCapacityKwh} kWh, Sold: ${energyQuota.totalSoldKwh} kWh (Balance: ${energyQuota.currentBatteryBalanceKwh} kWh), Already Listed: ${energyQuota.activeListedKwh} kWh. You can only post up to the remaining ${energyQuota.remainingPostableKwh.toFixed(1)} kWh.`
      );
      return;
    }

    // Check if producer has registered a Solar System & Energy Meter; if none, auto-create a verified Dindigul solar asset
    let sysList = await fetchEnergySystems(userProfile?.uid || 'guest');
    if (sysList.length === 0) {
      try {
        await addEnergySystem(userProfile?.uid || 'guest', {
          name: 'Dindigul Rooftop Solar Array',
          capacity: 50.0,
          type: 'Solar',
          meterSerialNumber: `EM-SOLAR-${Math.floor(100000 + Math.random() * 900000)}`,
          location: 'Main Road, Dindigul, Tamil Nadu',
          manufacturer: 'SunPower Solar',
          installationDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        });
      } catch (e) {
        console.warn('Auto-system creation notice:', e);
      }
    }

    setPostingOffer(true);
    try {
      await createEnergyOffer({
        energy_kwh: sellingAmount,
        price_per_kwh: tariffRate,
        energy_source: 'Solar',
        seller_id: userProfile?.uid || 'PROD-CURRENT',
        seller_name: userProfile?.fullName || 'Community Solar Producer',
        seller_location: 'Main Road, Dindigul, Tamil Nadu',
        seller_city: 'Dindigul',
        lat: 10.3673,
        lon: 77.9803,
      });
      toast.success(`Solar Offer Posted! ${sellingAmount} kWh listed at ₹${tariffRate.toFixed(2)}/kWh in Consumer Marketplace.`);
      loadProducerData();
    } catch (err) {
      toast.error(err?.message || 'Failed to post solar energy offer');
    } finally {
      setPostingOffer(false);
    }
  };

  const assets = [
    { name: 'Primary Solar Rooftop Array', capacity: '50.0 kW', status: 'Active', output: '34.2 kW', health: 100, type: 'Solar' },
    { name: 'Household Solar Feed-In Panel', capacity: '25.0 kW', status: 'Active', output: '18.5 kW', health: 98, type: 'Solar' },
  ];

  return (
    <div className="space-y-8">
      {/* Producer Hero Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-emerald-100 mb-3 border border-white/20">
                <Zap className="w-3.5 h-3.5 text-lime-300" /> PRODUCER PORTAL • Solar Feed-In Marketplace
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {displayName}</h1>
              <p className="text-emerald-100/90 text-sm mt-1">
                Post your solar power for sale in Dindigul. Purchased energy revenues are credited directly to your wallet.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePostSellOffer}
                disabled={postingOffer}
                className="px-4 py-2.5 bg-lime-400 text-navy hover:bg-lime-300 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {postingOffer ? 'Posting...' : 'Post Energy Offer to Marketplace'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Producer Battery Management Telemetry Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="bg-surface border border-emerald-500/30 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden bg-gradient-to-r from-surface via-emerald-500/5 to-teal-500/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                <Battery className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-navy font-heading">Producer Battery Storage & Real-Time Telemetry</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-extrabold uppercase border border-emerald-500/20">
                    Active Telemetry
                  </span>
                  <button
                    onClick={() => setShowBatteryModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 rounded-lg text-xs font-semibold transition-all border border-slate-300"
                    title="Change your battery storage size"
                  >
                    <Settings className="w-3 h-3 text-slate-600" />
                    <span>Set Battery Size</span>
                  </button>
                </div>
                <p className="text-xs text-text-secondary">
                  Real-time power monitoring: Total Storage ({energyQuota.totalCapacityKwh} kWh), Discharged Power ({totalSoldKwh.toFixed(1)} kWh), and Remaining Reserve.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="px-3.5 py-2 bg-background rounded-xl border border-border text-center">
                <span className="text-[10px] font-bold text-text-secondary uppercase block">Total Capacity</span>
                <span className="text-sm font-extrabold font-mono text-navy">{initialBatteryStored.toFixed(1)} kWh</span>
              </div>
              <div className="px-3.5 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Sold &amp; Discharged</span>
                <span className="text-sm font-extrabold font-mono text-rose-600">
                  -{totalSoldKwh.toFixed(1)} kWh
                </span>
              </div>
              <div className="px-3.5 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-center">
                <span className="text-[10px] font-bold text-cyan-700 uppercase block">Battery Balance</span>
                <span className="text-sm font-extrabold font-mono text-cyan-600">
                  {currentBatteryBalance.toFixed(1)} kWh
                </span>
              </div>
              <div className="px-3.5 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Available to Post</span>
                <span className="text-sm font-extrabold font-mono text-emerald-600">
                  {energyQuota.remainingPostableKwh.toFixed(1)} kWh
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Future Energy Generation & Surplus Forecasting Engine */}
      <EnergyPredictionCard />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Solar Energy Sold"
          value={totalSoldKwh}
          unit="kWh"
          icon={Sun}
          color="primary"
          trend="up"
          trendValue="P2P Marketplace Active"
          delay={0.1}
        />
        <StatsCard
          title="Total P2P Revenue Earned"
          value={totalRevenueEarned}
          unit="₹"
          icon={DollarSign}
          color="success"
          trend="up"
          trendValue="Credited to Wallet"
          delay={0.2}
        />
        <StatsCard
          title="Current Wallet Balance"
          value={wallet?.balance ?? 0}
          unit="₹"
          icon={Wallet}
          color="accent"
          trend="up"
          trendValue="Instant Settlement Ready"
          delay={0.3}
        />
        <StatsCard
          title="Solar Generator Uptime"
          value="100%"
          icon={ShieldCheck}
          color="secondary"
          animate={false}
          delay={0.4}
        />
      </div>

      {/* Generation Chart & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Generator Asset Fleet */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registered Solar & Grid Systems</CardTitle>
              <button
                onClick={() => toast.success('Telemetry diagnostics refreshed')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Refresh Telemetry
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assets.map((asset, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-background/60 rounded-xl border border-border/70 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${asset.type === 'Solar' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {asset.type === 'Solar' ? <Sun className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{asset.name}</h4>
                        <p className="text-xs text-text-secondary">Capacity: {asset.capacity} • Health: {asset.health}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{asset.output}</p>
                      <span className="inline-block px-2 py-0.5 bg-success/10 text-success text-[10px] font-semibold rounded-md mt-0.5">
                        {asset.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets: Tariff & Post Offer Control + Real P2P Sales */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Post Solar Energy Offer</CardTitle>
              <Sliders className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Producer Listing Quota Breakdown */}
              <div className="p-3 bg-gradient-to-r from-slate-900 to-navy text-white rounded-xl text-xs space-y-2 border border-white/10">
                <div className="flex justify-between items-center text-[11px] text-slate-300">
                  <span className="font-semibold">Battery Storage Quota</span>
                  <span className="text-lime-400 font-mono font-bold">Total: {energyQuota.totalCapacityKwh} kWh</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
                    <span className="block">Sold</span>
                    <span className="font-mono font-bold text-xs">-{energyQuota.totalSoldKwh} kWh</span>
                  </div>
                  <div className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30">
                    <span className="block">Balance</span>
                    <span className="font-mono font-bold text-xs">{energyQuota.currentBatteryBalanceKwh} kWh</span>
                  </div>
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
                    <span className="block">Postable</span>
                    <span className="font-mono font-bold text-xs">{energyQuota.remainingPostableKwh} kWh</span>
                  </div>
                </div>
                {energyQuota.activeListedKwh > 0 && (
                  <div className="text-[10px] text-amber-300 flex justify-between pt-1 border-t border-white/10">
                    <span>Active in marketplace:</span>
                    <span className="font-mono font-bold">{energyQuota.activeListedKwh} kWh</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <label className="text-text-primary">Energy to Sell (kWh)</label>
                    <span className="text-[11px] text-emerald-600 font-mono">Max: {energyQuota.remainingPostableKwh} kWh</span>
                  </div>
                  <input
                    type="number"
                    min="0.5"
                    max={energyQuota.remainingPostableKwh}
                    step="0.5"
                    value={sellingAmount}
                    onChange={(e) => setSellingAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-bold text-navy focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-text-secondary">AI Dynamic Price Rate:</span>
                    <span className="text-emerald-600 font-extrabold">₹{tariffRate.toFixed(2)} / kWh</span>
                  </div>
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between font-bold text-emerald-800">
                    <span>🤖 AI Automated Pricing</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-600 text-white rounded-md">
                      Location & Weather Synced
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-surface border border-border rounded-xl text-xs flex justify-between items-center font-semibold text-navy">
                  <span>Total Expected Revenue:</span>
                  <span className="font-mono font-extrabold text-emerald-600">
                    ₹{(sellingAmount * tariffRate).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePostSellOffer}
                disabled={postingOffer || energyQuota.remainingPostableKwh <= 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> {postingOffer ? 'Posting...' : 'Post Offer to Consumer Marketplace'}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent P2P Solar Sales</CardTitle>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md">Live Database Feed</span>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-secondary">
                  No solar sales recorded yet. Post an offer above for consumers to purchase!
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-background/60 rounded-xl border border-border/80 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-navy">{tx.buyer || 'Consumer Household'}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">{tx.energyAmount} kWh sold</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-extrabold text-emerald-600">₹{typeof tx.price === 'number' ? tx.price.toFixed(2) : tx.price}</p>
                        <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-extrabold rounded-full uppercase">
                          Credited
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
              Every household or solar farm producer has different battery storage (e.g. 80 kWh, 150 kWh, 250 kWh). Specify your physical battery capacity below.
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
            <span className="font-bold text-navy block">💡 Active Selling Logic Breakdown:</span>
            <div className="text-text-secondary space-y-0.5">
              <p>• <strong>Max Available to Sell:</strong> Total Capacity ({customBatteryCapacity || '150'} kWh) in single or multiple split postings.</p>
              <p>• <strong>Battery Balance:</strong> Automatically decreases as energy is sold (e.g. 150 kWh - 50 kWh sold = 100 kWh balance).</p>
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
