import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Sun, Plus, Clock, DollarSign, Zap, ShieldAlert, Cpu, CheckCircle2, X, Battery, Sparkles, CloudSun, MapPin, Settings, Gauge, Building2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { createEnergyOffer, fetchProducerEnergyQuota, saveUserBatteryCapacity, deleteEnergyOffer } from '../../../services/marketplaceService';
import { fetchEnergySystems, addEnergySystem } from '../../../services/systemsService';
import { fetchLiveWeatherData, getBestTimeToSellRecommendation } from '../../../services/predictionService';
import { fetchSmartMeters } from '../../../services/smartMeterService';
import { getUserBankDetails, saveUserBankDetails } from '../../../services/walletService';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';

export default function SellEnergy({ onOfferCreated }) {
  const { user, userProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [registeredSystems, setRegisteredSystems] = useState([]);
  const [smartMeters, setSmartMeters] = useState([]);
  const [checkingSystems, setCheckingSystems] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [customBatteryCapacity, setCustomBatteryCapacity] = useState('150.0');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountHolder: 'Solar Energy Producer',
    bankName: 'HDFC Bank',
    accountNumber: '50100492819283',
    maskedAccount: '•••• •••• 9283',
    ifsc: 'HDFC0001089',
    branch: 'Dindigul Microgrid Branch',
    upiId: 'producer.solar@okhdfcbank',
  });

  const [sysName, setSysName] = useState('');
  const [sysCapacity, setSysCapacity] = useState('5.0');
  const [meterSerial, setMeterSerial] = useState('');
  const [sysLocation, setSysLocation] = useState('Main Road, Dindigul, Tamil Nadu');
  const [registering, setRegistering] = useState(false);

  const [energyQuota, setEnergyQuota] = useState({
    totalCapacityKwh: 150.0,
    totalSoldKwh: 0,
    currentBatteryBalanceKwh: 150.0,
    activeListedKwh: 0,
    remainingPostableKwh: 150.0,
    activeOffersCount: 0,
  });
  const [remainingBatteryKwh, setRemainingBatteryKwh] = useState(150.0);
  const [bestSellRec, setBestSellRec] = useState(null);
  const [producerMapLoc, setProducerMapLoc] = useState({
    address: 'Main Road, Dindigul, Tamil Nadu',
    lat: 10.3673,
    lon: 77.9803,
  });

  const loadSystems = useCallback(async () => {
    setCheckingSystems(true);
    const [list, wData, quota, metersList] = await Promise.all([
      fetchEnergySystems(user?.uid || 'guest'),
      fetchLiveWeatherData(),
      fetchProducerEnergyQuota(user?.uid, userProfile?.fullName),
      fetchSmartMeters(user?.uid || 'guest'),
    ]);
    setRegisteredSystems(list || []);
    setSmartMeters(metersList || []);
    setEnergyQuota(quota);
    setCustomBatteryCapacity(String(quota.totalCapacityKwh || 150.0));
    setRemainingBatteryKwh(quota.remainingPostableKwh);
    setBestSellRec(getBestTimeToSellRecommendation(wData, quota.remainingPostableKwh));

    const bDetails = getUserBankDetails(user?.uid || 'guest', userProfile?.fullName || 'Solar Energy Producer');
    setBankDetails(bDetails);

    if (metersList && metersList.length > 0) {
      const activeMeter = metersList[0];
      setProducerMapLoc({
        address: activeMeter.location || 'Main Road, Dindigul, Tamil Nadu',
        lat: parseFloat(activeMeter.lat) || 10.3673,
        lon: parseFloat(activeMeter.lon) || 77.9803,
      });
    }

    setCheckingSystems(false);
  }, [user?.uid, userProfile?.fullName]);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const handleUpdateBankDetails = (e) => {
    e.preventDefault();
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifsc) {
      toast.error('Please enter valid bank name, account number, and IFSC code');
      return;
    }
    const saved = saveUserBankDetails(user?.uid || 'guest', bankDetails);
    setBankDetails(saved);
    toast.success('⚡ Direct P2P Payout Bank & UPI Details synchronized successfully!');
    setShowBankModal(false);
  };

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
    loadSystems();
  };

  const handleRegisterSolarSystem = async (e) => {
    e.preventDefault();
    if (!sysName.trim()) {
      toast.error('Please enter a name for your Solar System');
      return;
    }
    setRegistering(true);
    try {
      await addEnergySystem(user?.uid || 'guest', {
        name: sysName,
        capacity: parseFloat(sysCapacity) || 5.0,
        type: 'Solar',
        meterSerialNumber: meterSerial || `EM-SOLAR-${Math.floor(100000 + Math.random() * 900000)}`,
        location: sysLocation,
        lat: producerMapLoc.lat,
        lon: producerMapLoc.lon,
        manufacturer: 'SunPower Solar',
        installationDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      });
      toast.success('Solar Energy System & Meter registered successfully!');
      setShowRegModal(false);
      loadSystems();
    } catch (err) {
      toast.error('Failed to register solar system');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelOfferInSell = async (offerId, kwh) => {
    try {
      await deleteEnergyOffer(offerId);
      toast.success(`Offer #${offerId} withdrawn! ${kwh} kWh restored to available battery quota.`);
      loadSystems();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel offer');
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      energyKwh: '5.0',
      pricePerKwh: '6.00',
      energySource: 'Solar',
      sellerLocation: producerMapLoc.address,
      availableFromHours: '0',
      availableUntilHours: '12',
    },
  });

  const onSubmitOffer = async (data) => {
    const requestedKwh = parseFloat(data.energyKwh);
    if (requestedKwh > energyQuota.remainingPostableKwh) {
      toast.error(
        `❌ Exceeds Available Unlisted Power! You have a total capacity of ${energyQuota.totalCapacityKwh} kWh, with ${energyQuota.activeListedKwh} kWh already listed in active marketplace offers. You can only post up to the remaining ${energyQuota.remainingPostableKwh.toFixed(1)} kWh.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const fromTime = new Date(now.getTime() + parseInt(data.availableFromHours, 10) * 3600 * 1000).toISOString();
      const untilTime = new Date(now.getTime() + parseInt(data.availableUntilHours, 10) * 3600 * 1000).toISOString();

      await createEnergyOffer({
        energy_kwh: requestedKwh,
        price_per_kwh: parseFloat(data.pricePerKwh || bestSellRec?.aiPriceValue || 7.20),
        energy_source: data.energySource,
        seller_location: producerMapLoc.address || data.sellerLocation,
        seller_id: user?.uid || 'PROD-CURRENT',
        seller_name: userProfile?.fullName || 'Community Solar Producer',
        lat: producerMapLoc.lat,
        lon: producerMapLoc.lon,
        available_from: fromTime,
        available_until: untilTime,
      });

      toast.success(`⚡ P2P Solar Energy offer pinned on Google Maps! ${data.energyKwh} kWh listed.`);
      reset();
      loadSystems();
      if (onOfferCreated) onOfferCreated();
    } catch (err) {
      toast.error(err.message || 'Failed to create energy offer');
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveSystem = registeredSystems.length > 0;
  const primarySys = registeredSystems[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Prerequisite Check: If no Solar System & Energy Meter registered */}
      {checkingSystems ? (
        <div className="h-48 bg-surface rounded-2xl border border-border animate-pulse" />
      ) : !hasActiveSystem ? (
        <Card className="border-amber-500/30 bg-gradient-to-r from-surface via-amber-500/5 to-amber-500/10 p-6 shadow-md text-center space-y-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20 w-12 h-12 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-navy">Solar System & Energy Meter Required</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Before you can list solar energy for sale on the Marketplace, you must register your <strong>Solar System Asset</strong> and connect your <strong>Energy Meter</strong>.
            </p>
          </div>
          <button
            onClick={() => setShowRegModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
          >
            <Cpu className="w-4 h-4 text-lime-300" /> Register Solar System & Energy Meter
          </button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>List Solar Energy for Sale</CardTitle>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Create a peer-to-peer energy offer to sell surplus rooftop solar power to local community consumers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1 Verified System Connected ({primarySys?.meterSerialNumber || 'EM-SOLAR-101'})</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Live Producer Energy Quota Breakdown Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-navy text-white rounded-2xl p-4 mb-5 border border-white/10 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-lime-300">
                  <Battery className="w-4 h-4 text-emerald-400" />
                  <span>Producer Available Energy &amp; Listing Quota</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatteryModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-[10px] font-semibold transition-all border border-white/20"
                    title="Configure your household/farm battery storage size"
                  >
                    <Settings className="w-3 h-3 text-slate-300" />
                    <span>Set Battery Size</span>
                  </button>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                    Active Listings: {energyQuota.activeOffersCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-sans">Total Battery</span>
                  <span className="font-mono font-bold text-slate-200 text-xs">{energyQuota.totalCapacityKwh} kWh</span>
                </div>
                <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <span className="text-[10px] text-rose-300 block font-sans">Sold &amp; Discharged</span>
                  <span className="font-mono font-bold text-rose-300 text-xs">-{energyQuota.totalSoldKwh} kWh</span>
                </div>
                <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-300 block font-sans">Battery Balance</span>
                  <span className="font-mono font-bold text-cyan-300 text-xs">{energyQuota.currentBatteryBalanceKwh} kWh</span>
                </div>
                <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 block font-sans font-bold">Available to Post</span>
                  <span className="font-mono font-extrabold text-lime-400 text-xs">{energyQuota.remainingPostableKwh} kWh</span>
                </div>
              </div>

              {energyQuota.activeListedKwh > 0 && (
                <div className="text-[11px] text-slate-300 flex justify-between items-center px-1">
                  <span>Currently active in marketplace:</span>
                  <span className="font-mono font-bold text-amber-300">{energyQuota.activeListedKwh} kWh</span>
                </div>
              )}

              {energyQuota.remainingPostableKwh <= 0 && (
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 font-semibold text-center space-y-1">
                  <p>⚠️ All your stored battery energy ({energyQuota.currentBatteryBalanceKwh} kWh) is currently listed in active marketplace offers!</p>
                  <p className="text-[10px] text-slate-300 font-normal">Withdraw any active listing below to reclaim its power back into your available quota.</p>
                </div>
              )}
            </div>

            {/* Active Marketplace Listings Widget with Withdraw action */}
            {energyQuota.activeOffers && energyQuota.activeOffers.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-3.5 mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Your Active Marketplace Listings ({energyQuota.activeOffers.length})</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-md">
                    {energyQuota.activeListedKwh} kWh Reserved
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {energyQuota.activeOffers.map((o) => {
                    const kwh = parseFloat(o.remaining_kwh ?? o.energy_kwh) || 0;
                    return (
                      <div key={o.id} className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-border text-xs">
                        <div>
                          <span className="font-bold text-navy">{o.id}: </span>
                          <span className="font-mono font-extrabold text-emerald-600">{kwh.toFixed(1)} kWh</span>
                          <span className="text-text-secondary text-[11px]"> @ ₹{parseFloat(o.price_per_kwh).toFixed(2)}/kWh</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancelOfferInSell(o.id, kwh)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg text-[11px] font-bold transition-all border border-rose-500/20"
                        >
                          Withdraw &amp; Reclaim
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Best Time to Sell Recommendation Widget */}
            {bestSellRec && (
              <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-navy font-heading">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Best Time to Sell in Marketplace for Producers</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-800 rounded-full text-xs font-extrabold border border-emerald-500/30">
                    🤖 AI Price Enforced: {bestSellRec.aiPricePerKwh}/kWh
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-surface p-2.5 rounded-xl border border-border">
                    <span className="text-text-secondary font-semibold block text-[10px] uppercase">Optimal Time Slot</span>
                    <span className="font-mono font-extrabold text-amber-600">{bestSellRec.bestTimeSlot}</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-xl border border-border">
                    <span className="text-text-secondary font-semibold block text-[10px] uppercase">Local Weather</span>
                    <span className="font-mono font-extrabold text-emerald-600">{bestSellRec.weatherCondition}</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-xl border border-border col-span-2 sm:col-span-1">
                    <span className="text-text-secondary font-semibold block text-[10px] uppercase">Marketplace Demand</span>
                    <span className="font-extrabold text-navy">{bestSellRec.marketDemand}</span>
                  </div>
                </div>

                <p className="text-[11px] text-text-secondary italic">
                  💡 <strong>Reasoning:</strong> {bestSellRec.reasoning}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitOffer)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Available Energy (kWh) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary block">
                    Available Surplus Energy (kWh)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 5.0"
                    error={errors.energyKwh?.message}
                    {...register('energyKwh', {
                      required: 'Energy amount is required',
                      min: { value: 0.1, message: 'Minimum 0.1 kWh' },
                    })}
                  />
                </div>

                {/* AI Automated Price per kWh (No manual pricing required) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary block">
                    Tariff Rate (₹ / kWh) — <span className="text-emerald-600 font-extrabold">AI Automated Pricing</span>
                  </label>
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-[var(--radius-input)] flex items-center justify-between">
                    <span className="text-xs font-extrabold font-mono text-emerald-700">
                      {bestSellRec?.aiPricePerKwh || '₹7.20'} / kWh
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-600 text-white rounded-md">
                      AI Dynamic Price
                    </span>
                  </div>
                  <input
                    type="hidden"
                    value={bestSellRec?.aiPriceValue || 7.20}
                    {...register('pricePerKwh')}
                  />
                </div>
              </div>

              {/* Producer Pinned Smart Meter Microgrid Location Banner */}
              {smartMeters.length > 0 ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-700 rounded-xl">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-navy text-xs">Registered Smart Meter Location</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-800 rounded-md text-[10px] font-mono font-extrabold">
                          🔒 Pinned &amp; Locked
                        </span>
                      </div>
                      <p className="text-emerald-950 font-bold text-xs mt-0.5">
                        {smartMeters[0]?.location || producerMapLoc.address}
                      </p>
                      <p className="text-[10px] font-mono text-emerald-700">
                        GPS: {smartMeters[0]?.lat || producerMapLoc.lat}, {smartMeters[0]?.lon || producerMapLoc.lon} • Fixed 5.0 km Microgrid Transfer Radius
                      </p>
                    </div>
                  </div>
                  <Link
                    to={ROUTES.DEVICES_SMART_METER}
                    className="px-3 py-1.5 bg-surface text-emerald-700 hover:text-emerald-800 border border-emerald-500/30 rounded-xl text-xs font-bold text-center shrink-0 transition-colors shadow-xs"
                  >
                    View Meter Setup →
                  </Link>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 text-amber-600 rounded-xl">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-navy">Household Smart Meter Location Required</span>
                      <p className="text-text-secondary text-[11px]">
                        Please register your smart meter once to pin your physical location before posting P2P offers.
                      </p>
                    </div>
                  </div>
                  <Link
                    to={ROUTES.DEVICES_SMART_METER}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs text-center shrink-0 shadow-sm"
                  >
                    + Register Smart Meter
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Energy Source */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary block">
                    Connected Solar System Asset
                  </label>
                  <select
                    {...register('energySource')}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-[var(--radius-input)] text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {registeredSystems.map((s) => (
                      <option key={s.id} value={s.name}>
                        ☀️ {s.name} ({s.capacity} kW)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Time Window */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary block">
                    Offer Duration Window
                  </label>
                  <select
                    {...register('availableUntilHours')}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-[var(--radius-input)] text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="4">Available for 4 Hours</option>
                    <option value="8">Available for 8 Hours</option>
                    <option value="12">Available for 12 Hours</option>
                    <option value="24">Available for 24 Hours</option>
                  </select>
                </div>
              </div>

              {/* Producer Verified Bank & UPI Payout Account Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/25 rounded-2xl space-y-2.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/20 pb-2">
                  <div className="flex items-center gap-2 font-bold text-navy">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Direct P2P Payout Bank &amp; UPI Account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Auto-Synced for Payouts
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBankModal(true)}
                      className="px-2.5 py-1 bg-surface hover:bg-background border border-blue-400/40 text-blue-700 font-bold rounded-lg text-[11px] transition-all shadow-2xs cursor-pointer"
                    >
                      Edit Payout Bank
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-surface rounded-xl border border-border">
                    <span className="text-text-secondary text-[10px] uppercase font-bold block">Receiving Bank</span>
                    <span className="font-bold text-navy truncate block">{bankDetails.bankName || 'HDFC Bank'}</span>
                    <span className="font-mono text-text-secondary text-[10px]">{bankDetails.maskedAccount || '•••• •••• 9283'}</span>
                  </div>
                  <div className="p-2 bg-surface rounded-xl border border-border">
                    <span className="text-text-secondary text-[10px] uppercase font-bold block">IFSC Code</span>
                    <span className="font-mono font-bold text-navy truncate block">{bankDetails.ifsc || 'HDFC0001089'}</span>
                    <span className="text-[10px] text-text-secondary truncate block">{bankDetails.branch || 'Microgrid Branch'}</span>
                  </div>
                  <div className="p-2 bg-surface rounded-xl border border-border col-span-2 sm:col-span-1">
                    <span className="text-text-secondary text-[10px] uppercase font-bold block">Instant UPI Payout ID</span>
                    <span className="font-mono font-extrabold text-emerald-700 truncate block">{bankDetails.upiId || 'producer.solar@okhdfcbank'}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Auto-credited upon sale</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-background border border-border rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-navy">
                  <Zap className="w-4 h-4 text-emerald-600" /> P2P Trade Settlement Summary
                </div>
                <p className="text-text-secondary text-[11px]">
                  Your solar energy offer will be listed publicly on the HifAI Marketplace for local buyers. When a consumer buys this power via Razorpay, funds are held in Smart Contract Escrow and credited directly to your bank/UPI destination upon smart meter proof of power reception.
                </p>
              </div>

              <Button type="submit" loading={submitting} fullWidth variant="primary" size="lg">
                <Plus className="w-4 h-4 mr-1" /> Create Energy Offer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Solar System & Meter Registration Modal */}
      <Modal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        title="Register Solar System & Energy Meter"
      >
        <form onSubmit={handleRegisterSolarSystem} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Solar System Asset Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Household Rooftop Solar Array"
              value={sysName}
              onChange={(e) => setSysName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Capacity (kW)
              </label>
              <Input
                type="number"
                step="0.5"
                placeholder="5.0"
                value={sysCapacity}
                onChange={(e) => setSysCapacity(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Location
              </label>
              <Input
                type="text"
                placeholder="Rooftop Section A"
                value={sysLocation}
                onChange={(e) => setSysLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Energy Meter Serial Number (Meter Connection)
            </label>
            <Input
              type="text"
              placeholder="e.g. EM-SOLAR-98210-P2P"
              value={meterSerial}
              onChange={(e) => setMeterSerial(e.target.value)}
            />
            <p className="text-[10px] text-text-secondary mt-1">
              Connecting your smart energy meter measures real-time generation and verifies physical power feed-in.
            </p>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRegModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={registering}
              className="flex-1"
            >
              Register & Connect Meter
            </Button>
          </div>
        </form>
      </Modal>

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

      {/* Configure P2P Payout Bank & UPI Details Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="Producer Bank & UPI Payout Settings"
      >
        <form onSubmit={handleUpdateBankDetails} className="space-y-4 pt-2 text-xs">
          <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl space-y-1">
            <div className="flex items-center gap-2 font-bold text-navy">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Direct Peer-to-Peer Energy Payout Destination</span>
            </div>
            <p className="text-text-secondary text-[11px]">
              When local consumers buy your listed solar power, funds will automatically be transferred and settled directly to your registered bank account or UPI ID via Smart Contract Escrow.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Account Holder Full Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Clean Energy Producer"
              value={bankDetails.accountHolder}
              onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Bank Name
              </label>
              <Input
                type="text"
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Bank Account Number
              </label>
              <Input
                type="text"
                placeholder="e.g. 50100492819283"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                IFSC Code
              </label>
              <Input
                type="text"
                placeholder="e.g. HDFC0001089"
                value={bankDetails.ifsc}
                onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Branch / Microgrid Zone
              </label>
              <Input
                type="text"
                placeholder="e.g. Dindigul Microgrid Branch"
                value={bankDetails.branch}
                onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              UPI ID / VPA (Instant Settlement)
            </label>
            <Input
              type="text"
              placeholder="e.g. producer.solar@okhdfcbank"
              value={bankDetails.upiId}
              onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
              required
            />
            <p className="text-[10px] text-text-secondary mt-1">
              Supports Google Pay, PhonePe, Paytm, and BHIM instant bank-to-bank settlements.
            </p>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBankModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Save &amp; Sync Payout Details
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
