import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Wind,
  Droplets,
  Leaf,
  ShoppingBag,
  Zap,
  Clock,
  User,
  CheckCircle2,
  MapPin,
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Calendar,
  Info,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../../components/common/Card';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import {
  fetchEnergyOffers,
  purchaseEnergy,
  calculateDistanceKm,
  checkUnsoldOffersAlert,
  MAX_P2P_TRANSFER_RADIUS_KM,
} from '../../../services/marketplaceService';
import { fetchSmartMeters, addSmartMeterReading } from '../../../services/smartMeterService';
import ProofOfDeliveryModal from './ProofOfDeliveryModal';
import RazorpayCheckoutModal from '../../../components/common/RazorpayCheckoutModal';
import BlockchainExplorerModal from '../../../components/common/BlockchainExplorerModal';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';

// Helper to return dynamic icon and badge styling for any energy source
function getEnergySourceMeta(source = 'Solar') {
  const src = String(source).toLowerCase();
  if (src.includes('wind')) {
    return {
      icon: Wind,
      label: 'Wind Energy',
      badgeClass: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
      iconColor: 'text-sky-600',
    };
  }
  if (src.includes('hydro') || src.includes('water')) {
    return {
      icon: Droplets,
      label: 'Hydro Energy',
      badgeClass: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
      iconColor: 'text-cyan-600',
    };
  }
  if (src.includes('bio') || src.includes('green') || src.includes('eco')) {
    return {
      icon: Leaf,
      label: 'Biomass Energy',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      iconColor: 'text-emerald-600',
    };
  }
  // Default to Solar
  return {
    icon: Sun,
    label: `${source} Energy`,
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    iconColor: 'text-amber-500',
  };
}

// Helper to format available validity time
function formatValidityWindow(from, until) {
  if (!until) return 'Available Today';
  try {
    const dUntil = new Date(until);
    if (isNaN(dUntil.getTime())) return 'Active Window';
    return `Valid until ${dUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Active Window';
  }
}

export default function BuyEnergy({ onPurchaseSuccess }) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const isProducer = userProfile?.role === 'producer';

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modals state
  const [selectedOfferForBuy, setSelectedOfferForBuy] = useState(null); // Direct buy modal
  const [detailOffer, setDetailOffer] = useState(null); // HD-49 View Details modal
  const [buyAmount, setBuyAmount] = useState('');
  const [detailBuyAmount, setDetailBuyAmount] = useState('');
  const [buying, setBuying] = useState(false);
  const [showSmartMeterModal, setShowSmartMeterModal] = useState(false);
  const [activeMeter, setActiveMeter] = useState(null);
  const [proofData, setProofData] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [razorpayOfferData, setRazorpayOfferData] = useState(null);
  const [razorpayAmountKwh, setRazorpayAmountKwh] = useState(0);
  const [blockchainModalOpen, setBlockchainModalOpen] = useState(false);
  const [blockchainReceiptData, setBlockchainReceiptData] = useState(null);
  const [unsoldAlerts, setUnsoldAlerts] = useState([]);

  // Consumer Location retrieved automatically from Household Smart Meter or GPS
  const [consumerLocation, setConsumerLocation] = useState(() => {
    try {
      const saved =
        localStorage.getItem(`yuga_consumer_location_${user?.uid || 'guest'}`) ||
        localStorage.getItem('yuga_consumer_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lon) return parsed;
      }
    } catch {}
    return {
      address: 'Main Road, Dindigul, Tamil Nadu',
      lat: 10.3673,
      lon: 77.9803,
      isPinned: true,
    };
  });

  // Search & Filter States (HD-50 & HD-51)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all'); // Dynamic based on loaded offers
  const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under_6' | 'under_8' | '8_to_10' | 'above_10'
  const [minKwhFilter, setMinKwhFilter] = useState('all'); // 'all' | '5' | '10' | '20' | '50'
  const [locationFilter, setLocationFilter] = useState('within_1km'); // 'within_1km' | 'all'
  const [sortBy, setSortBy] = useState('proximity'); // 'proximity' | 'price_asc' | 'price_desc' | 'kwh_desc'

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchEnergyOffers();
      // Filter only currently active listings with remaining energy
      const activeListings = (data || []).filter(
        (o) => (o.status ? o.status.toLowerCase() === 'active' : true) && parseFloat(o.remaining_kwh || 0) > 0
      );
      setOffers(activeListings);
      try {
        const alerts = checkUnsoldOffersAlert(user?.uid || 'guest');
        setUnsoldAlerts(alerts || []);
      } catch {}
    } catch (err) {
      console.error('Failed to load energy offers:', err);
      setFetchError(err.message || 'Unable to connect to the marketplace server. Please check your connection.');
      toast.error('Failed to load energy offers');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Helper to calculate real-time Haversine distance between Smart Meter location and Producer offer
  const getLiveDistanceKm = useCallback(
    (offer) => {
      if (!offer) return 0.5;

      const isSeed =
        offer.is_seed ||
        String(offer.id).startsWith('OFFER-LOCAL-') ||
        ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005'].includes(String(offer.seller_id));

      if (isSeed && offer.distance_value !== undefined) {
        return parseFloat(Number(offer.distance_value).toFixed(2));
      }

      const cLat = consumerLocation?.lat ?? 10.3673;
      const cLon = consumerLocation?.lon ?? 77.9803;
      const pLat = parseFloat(offer.lat ?? (offer.seller_lat ?? cLat + 0.003));
      const pLon = parseFloat(offer.lon ?? (offer.seller_lon ?? cLon + 0.002));
      
      const realDist = calculateDistanceKm(cLat, cLon, pLat, pLon);
      
      // If coordinates are in different cities due to mock data (e.g. > 50km apart), use the offer's microgrid proximity
      if (realDist > 50 && offer.distance_value !== undefined) {
        return parseFloat(Number(offer.distance_value).toFixed(2));
      }
      return parseFloat(realDist.toFixed(2));
    },
    [consumerLocation]
  );

  // Automatically load location from registered Smart Meter or GPS
  useEffect(() => {
    async function loadSmartMeterLocation() {
      try {
        const meters = await fetchSmartMeters(user?.uid || 'guest');
        if (meters && meters.length > 0) {
          const meter = meters[0];
          setActiveMeter(meter);
          if (meter.lat && meter.lon) {
            setConsumerLocation({
              address: meter.location || 'Local Household Smart Meter Site',
              lat: parseFloat(meter.lat),
              lon: parseFloat(meter.lon),
              isPinned: true,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Smart meter fetch error:', err);
      }

      // Check saved location in localStorage
      try {
        const saved =
          localStorage.getItem(`yuga_consumer_location_${user?.uid || 'guest'}`) ||
          localStorage.getItem('yuga_consumer_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && parsed?.lon) {
            setConsumerLocation(parsed);
            return;
          }
        }
      } catch {}
    }

    loadSmartMeterLocation();
    loadOffers();

    const handleSmartMeterUpdate = () => {
      loadSmartMeterLocation();
      loadOffers();
    };

    window.addEventListener('smart-meter-updated', handleSmartMeterUpdate);
    window.addEventListener('storage', handleSmartMeterUpdate);

    return () => {
      window.removeEventListener('smart-meter-updated', handleSmartMeterUpdate);
      window.removeEventListener('storage', handleSmartMeterUpdate);
    };
  }, [user?.uid, loadOffers]);

  // Dynamically extract all available energy sources from current active listings
  const dynamicSources = useMemo(() => {
    const set = new Set(['Solar']);
    offers.forEach((o) => {
      if (o.energy_source) {
        set.add(o.energy_source);
      }
    });
    return Array.from(set);
  }, [offers]);

  // Combined Search, Multi-Criteria Filtering, and Sorting logic
  const filteredOffers = useMemo(() => {
    return offers
      .filter((offer) => {
        const distVal = getLiveDistanceKm(offer);

        // 1. Distance / Microgrid constraint
        if (locationFilter === 'within_1km' && distVal > MAX_P2P_TRANSFER_RADIUS_KM) {
          return false;
        }

        // 2. Status & Availability check (must be active and > 0 kWh)
        if (offer.status && offer.status.toLowerCase() !== 'active') {
          return false;
        }
        if (parseFloat(offer.remaining_kwh || 0) <= 0) {
          return false;
        }

        // 3. Dynamic Energy Source filter
        if (
          selectedSource !== 'all' &&
          (offer.energy_source || 'Solar').toLowerCase() !== selectedSource.toLowerCase()
        ) {
          return false;
        }

        // 4. Price range filter
        const price = parseFloat(offer.price_per_kwh || 0);
        if (priceRange === 'under_6' && price >= 6.0) return false;
        if (priceRange === 'under_8' && price >= 8.0) return false;
        if (priceRange === '8_to_10' && (price < 8.0 || price > 10.0)) return false;
        if (priceRange === 'above_10' && price <= 10.0) return false;

        // 5. Min Available Energy filter
        const remaining = parseFloat(offer.remaining_kwh || 0);
        if (minKwhFilter !== 'all') {
          const threshold = parseFloat(minKwhFilter);
          if (remaining < threshold) return false;
        }

        // 6. HD-50 Text search query across producer name, source, location, city, and ID
        if (searchQuery.trim()) {
          const queryLower = searchQuery.trim().toLowerCase();
          const searchableText = [
            offer.seller_name,
            offer.seller_location,
            offer.seller_city,
            offer.energy_source,
            String(offer.id),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!searchableText.includes(queryLower)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const distA = getLiveDistanceKm(a);
        const distB = getLiveDistanceKm(b);
        const priceA = parseFloat(a.price_per_kwh || 0);
        const priceB = parseFloat(b.price_per_kwh || 0);
        const kwhA = parseFloat(a.remaining_kwh || 0);
        const kwhB = parseFloat(b.remaining_kwh || 0);

        if (sortBy === 'proximity') return distA - distB;
        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'kwh_desc') return kwhB - kwhA;
        return 0;
      });
  }, [offers, locationFilter, selectedSource, priceRange, minKwhFilter, searchQuery, sortBy, getLiveDistanceKm]);

  // Check if any filter is active
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSource !== 'all' ||
    priceRange !== 'all' ||
    minKwhFilter !== 'all' ||
    locationFilter !== 'within_1km' ||
    sortBy !== 'proximity';

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedSource('all');
    setPriceRange('all');
    setMinKwhFilter('all');
    setLocationFilter('within_1km');
    setSortBy('proximity');
  };

  // Open Direct Buy Modal
  const handleOpenBuyModal = async (offer) => {
    const distVal = getLiveDistanceKm(offer);

    if (distVal > MAX_P2P_TRANSFER_RADIUS_KM) {
      toast.error(
        `🚫 Energy Transfer Restricted: Producer is ${distVal.toFixed(
          2
        )} km away from your Smart Meter location (${consumerLocation.address}). Peer-to-peer electricity transfer is ONLY permitted within a 1.0 km microgrid radius!`
      );
      return;
    }

    try {
      const meters = await fetchSmartMeters(user?.uid || 'guest');
      if (!meters || meters.length === 0) {
        setShowSmartMeterModal(true);
        return;
      }
      setActiveMeter(meters[0]);
    } catch (e) {
      console.warn('Smart meter check error', e);
    }
    setSelectedOfferForBuy(offer);
    setBuyAmount(offer.remaining_kwh.toString());
  };

  // Open HD-49 View Details Modal
  const handleOpenDetailModal = (offer) => {
    setDetailOffer(offer);
    setDetailBuyAmount(offer.remaining_kwh.toString());
  };

  // Purchase execution
  const executePurchase = async (offer, amountKwh, paymentDetails = {}) => {
    if (buying) return;

    const amount = parseFloat(amountKwh);
    const maxAvailable = parseFloat(offer.remaining_kwh);
    const distVal = getLiveDistanceKm(offer);

    if (distVal > MAX_P2P_TRANSFER_RADIUS_KM) {
      toast.error(
        `🚫 Transfer Blocked: Producer is ${distVal.toFixed(
          2
        )} km away from your Smart Meter (${consumerLocation.address}). Strict 1.0 km microgrid radius limit applies.`
      );
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid energy amount in kWh greater than 0');
      return;
    }

    if (amount > maxAvailable) {
      toast.error(`Cannot buy more than available energy (${maxAvailable} kWh)`);
      return;
    }

    setBuying(true);
    try {
      const res = await purchaseEnergy(offer.id, amount, offer, distVal, userProfile, paymentDetails);
      toast.success(
        res.message ||
          `⚡ Purchased ${amount} kWh ${offer.energy_source || 'Solar'} energy from ${
            offer.seller_name || 'Local Prosumer'
          } (${distVal.toFixed(2)} km away)!`
      );

      // Record Smart Meter reading entry
      try {
        await addSmartMeterReading(user?.uid || 'guest', {
          meterId: activeMeter?.id || 'SM-001',
          meterName: activeMeter?.name || 'Household Smart Meter',
          energyConsumed: amount,
          energyExported: 0,
          voltage: 231.5,
          current: parseFloat((amount * 1.2).toFixed(1)),
          powerFactor: 0.98,
          frequency: 50.0,
          timestamp: new Date().toISOString(),
          source: `P2P Transfer from ${offer.seller_location || 'Local Feeder'} (${distVal.toFixed(
            2
          )} km)`,
        });
      } catch (smErr) {
        console.warn('Could not auto-add smart meter reading:', smErr);
      }

      setProofData({
        ...res.transaction,
        meter_sn: activeMeter?.serialNumber || 'SM-DINDIGUL-01',
        energy_kwh: amount,
        total_amount: res.transaction?.price,
      });
      setShowProofModal(true);
      // Instantly remove/decrement the bought offer in local React state (0ms latency)
      const boughtOfferId = String(offer.id);
      const boughtOfferNum = boughtOfferId.replace(/\D/g, '');
      setOffers((prevOffers) =>
        prevOffers
          .map((o) => {
            const isTarget =
              String(o.id) === boughtOfferId ||
              (boughtOfferNum && String(o.id).replace(/\D/g, '') === boughtOfferNum);
            if (isTarget) {
              const newRem = Math.max(0, parseFloat((parseFloat(o.remaining_kwh || 0) - amount).toFixed(2)));
              return { ...o, remaining_kwh: newRem, status: newRem <= 0 ? 'completed' : o.status };
            }
            return o;
          })
          .filter((o) => parseFloat(o.remaining_kwh || 0) > 0 && o.status !== 'completed')
      );

      setSelectedOfferForBuy(null);
      setDetailOffer(null);
      loadOffers();
      if (onPurchaseSuccess) onPurchaseSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to complete energy purchase');
    } finally {
      setBuying(false);
    }
  };

  const handleConfirmDirectPurchase = async (e) => {
    e.preventDefault();
    if (!selectedOfferForBuy || buying) return;
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    // Open Razorpay Checkout Modal
    setRazorpayOfferData(selectedOfferForBuy);
    setRazorpayAmountKwh(amount);
    setRazorpayModalOpen(true);
    setSelectedOfferForBuy(null);
  };

  const handleConfirmDetailPurchase = async (e) => {
    e.preventDefault();
    if (!detailOffer || buying) return;
    const amount = parseFloat(detailBuyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    // Open Razorpay Checkout Modal
    setRazorpayOfferData(detailOffer);
    setRazorpayAmountKwh(amount);
    setRazorpayModalOpen(true);
    setDetailOffer(null);
  };

  // Live estimated cost calculations
  const directEstimatedTotal =
    selectedOfferForBuy && !isNaN(parseFloat(buyAmount))
      ? (parseFloat(buyAmount) * parseFloat(selectedOfferForBuy.price_per_kwh)).toFixed(2)
      : '0.00';

  const detailEstimatedTotal =
    detailOffer && !isNaN(parseFloat(detailBuyAmount))
      ? (parseFloat(detailBuyAmount) * parseFloat(detailOffer.price_per_kwh)).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy flex items-center gap-2 font-heading">
            <ShoppingBag className="w-5 h-5 text-emerald-600" /> Available Energy Listings
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Browse verified peer-to-peer renewable energy offers available in your local microgrid (&le; 1.0 km of your Smart Meter).
          </p>
        </div>
        <Button
          onClick={loadOffers}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Listings</span>
        </Button>
      </div>

      {/* 24-Hour Unsold Offers Alert Banner */}
      {unsoldAlerts.length > 0 && (
        <div className="space-y-2">
          {unsoldAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-navy block text-xs">{alert.title}</span>
                  <p className="text-amber-900 font-medium mt-0.5">{alert.message}</p>
                  <p className="text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {alert.suggestion}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  onClick={() => {
                    toast.success(`Republished offer #${alert.id} at recommended rate ₹${alert.suggestedPrice}/kWh!`);
                    loadOffers();
                  }}
                >
                  Adjust to ₹{alert.suggestedPrice}/kWh
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Search & Filter Control Panel (HD-50 & HD-51) */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-sm space-y-4">
        {/* Search Bar (HD-50) */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search listings by producer, location, source (e.g. Solar), city, or offer ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-navy placeholder:text-text-secondary/70 focus:outline-none focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-navy rounded-full transition-colors"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* 1. Dynamic Energy Source Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Energy Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer transition-colors"
            >
              <option value="all">All Energy Sources</option>
              {dynamicSources.map((src) => (
                <option key={src} value={src}>
                  {src} Power
                </option>
              ))}
            </select>
          </div>

          {/* 2. Price Range Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Price Range
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer transition-colors"
            >
              <option value="all">All Prices</option>
              <option value="under_6">Under ₹6.00 / kWh</option>
              <option value="under_8">Under ₹8.00 / kWh</option>
              <option value="8_to_10">₹8.00 - ₹10.00 / kWh</option>
              <option value="above_10">Above ₹10.00 / kWh</option>
            </select>
          </div>

          {/* 3. Min Available Energy Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Min Available kWh
            </label>
            <select
              value={minKwhFilter}
              onChange={(e) => setMinKwhFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer transition-colors"
            >
              <option value="all">All Amounts</option>
              <option value="5">5+ kWh</option>
              <option value="10">10+ kWh</option>
              <option value="20">20+ kWh</option>
              <option value="50">50+ kWh</option>
            </select>
          </div>

          {/* 4. Distance / Microgrid Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Microgrid Distance
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer transition-colors"
            >
              <option value="within_1km">⚡ &le; 1.0 km (Eligible for Transfer)</option>
              <option value="all">📍 All Listings (Show All)</option>
            </select>
          </div>

          {/* 5. Sort By */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer transition-colors"
            >
              <option value="proximity">Proximity (Nearest First)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="kwh_desc">Available: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips & Result Count Banner */}
        <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-secondary text-[11px] font-bold">
              {hasActiveFilters ? 'Active Filters:' : 'Filters:'}
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold border border-primary/20">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery('')} className="hover:opacity-75" title="Remove search filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSource !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-700 rounded-full text-[11px] font-bold border border-amber-500/20">
                Source: {selectedSource}
                <button onClick={() => setSelectedSource('all')} className="hover:opacity-75" title="Remove source filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {priceRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 text-cyan-700 rounded-full text-[11px] font-bold border border-cyan-500/20">
                {priceRange === 'under_6' && 'Under ₹6.00'}
                {priceRange === 'under_8' && 'Under ₹8.00'}
                {priceRange === '8_to_10' && '₹8.00 - ₹10.00'}
                {priceRange === 'above_10' && 'Above ₹10.00'}
                <button onClick={() => setPriceRange('all')} className="hover:opacity-75" title="Remove price filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minKwhFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-500/20">
                Min {minKwhFilter} kWh
                <button onClick={() => setMinKwhFilter('all')} className="hover:opacity-75" title="Remove min kWh filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {locationFilter === 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full text-[11px] font-bold border border-slate-300">
                All Distances
                <button onClick={() => setLocationFilter('within_1km')} className="hover:opacity-75" title="Reset to ≤ 1.0 km">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline ml-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="text-[11px] font-semibold text-text-secondary">
            <strong className="text-navy">{filteredOffers.length}</strong>{' '}
            {filteredOffers.length === 1 ? 'listing found' : 'listings found'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LOADING / ERROR / EMPTY / CARDS GRID STATES                            */}
      {/* ========================================================================= */}

      {/* Loading State */}
      {loading && (
        <div className="h-56 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl text-xs text-text-secondary gap-2 bg-surface">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold">Loading verified energy listings...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && fetchError && (
        <Card className="p-8 text-center space-y-4 max-w-lg mx-auto border-rose-500/30 bg-rose-50/20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy font-heading">Failed to Load Energy Listings</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{fetchError}</p>
          </div>
          <Button onClick={loadOffers} variant="primary" size="sm" className="mx-auto flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !fetchError && filteredOffers.length === 0 && (
        <Card className="p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
            <Sun className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-navy font-heading">
              No Energy Listings Found
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {hasActiveFilters
                ? 'No available energy listings match your active filters or search criteria. Try adjusting your energy source, price range, or clearing filters.'
                : 'There are currently no active energy listings in this microgrid zone.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <Button onClick={handleClearAllFilters} variant="outline" size="sm">
              Reset All Filters
            </Button>
          ) : (
            <Button onClick={loadOffers} variant="primary" size="sm">
              Refresh Marketplace
            </Button>
          )}
        </Card>
      )}

      {/* Available Energy Listings Grid (HD-49) */}
      {!loading && !fetchError && filteredOffers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => {
            const sourceMeta = getEnergySourceMeta(offer.energy_source);
            const SourceIcon = sourceMeta.icon;
            const price = parseFloat(offer.price_per_kwh || 0).toFixed(2);
            const remaining = parseFloat(offer.remaining_kwh || 0).toFixed(1);
            const totalListed = parseFloat(offer.energy_kwh || offer.remaining_kwh || 0).toFixed(1);
            const distVal = getLiveDistanceKm(offer);
            const isWithin1km = distVal <= MAX_P2P_TRANSFER_RADIUS_KM;
            const validityText = formatValidityWindow(offer.available_from, offer.available_until);

            const isOwnOffer =
              offer.seller_id === user?.uid ||
              offer.seller_name === (userProfile?.fullName || user?.displayName);

            return (
              <motion.div
                key={offer.id}
                whileHover={{ y: -6, scale: 1.012 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={`glass-card rounded-2xl border transition-all duration-300 flex flex-col justify-between p-5 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.12)] ${
                  isWithin1km
                    ? 'border-white/80 hover:border-emerald-500/50'
                    : 'border-amber-500/30 bg-amber-50/30'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Energy Source Badge & Status Pill */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs rounded-full border shadow-xs ${sourceMeta.badgeClass}`}
                    >
                      <SourceIcon className={`w-3.5 h-3.5 ${sourceMeta.iconColor}`} />
                      <span>{offer.energy_source || 'Solar'} Energy</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isWithin1km
                          ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                      }`}
                    >
                      {isWithin1km ? 'ACTIVE' : 'OUT OF RANGE'}
                    </span>
                  </div>

                  {/* Producer Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      {offer.seller_image ? (
                        <img
                          src={offer.seller_image}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold text-[10px]">
                          <User className="w-3 h-3 text-text-secondary" />
                        </div>
                      )}
                      <span className="font-bold text-navy truncate max-w-[160px]">
                        {offer.seller_name || 'Community Producer'}
                      </span>
                    </div>

                    {isOwnOffer && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-extrabold rounded-md uppercase border border-primary/20">
                        Your Offer
                      </span>
                    )}
                  </div>

                  {/* Available Energy Hero Metric with Neumorphic Depth */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-white shadow-[inset_2px_2px_6px_rgba(203,213,225,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] flex items-center justify-between">
                    <div>
                      <div className="text-xl font-extrabold text-navy font-heading flex items-baseline gap-1">
                        {remaining} <span className="text-xs font-semibold text-text-secondary">kWh</span>
                      </div>
                      <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block">
                        Available Energy ({totalListed} kWh listed)
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold text-emerald-600 font-mono">
                        ₹{price}
                      </div>
                      <span className="text-[10px] text-text-secondary font-medium">
                        per kWh
                      </span>
                    </div>
                  </div>

                  {/* Location, Distance & Availability Period Details */}
                  <div className="space-y-1.5 text-xs text-text-secondary pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] truncate max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{offer.seller_location || offer.seller_city || 'Local Microgrid'}</span>
                      </span>
                      <span
                        className={`text-[11px] font-mono font-bold shrink-0 ${
                          isWithin1km ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {distVal.toFixed(1)} km away
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-secondary/80">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {validityText}
                      </span>
                      <span className={isWithin1km ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {isWithin1km ? 'Eligible for Transfer' : 'Line Loss Limit (> 1.0 km)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <Button
                    onClick={() => handleOpenDetailModal(offer)}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold"
                  >
                    View Details
                  </Button>

                  {isProducer ? (
                    <Button
                      disabled
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-bold text-text-secondary opacity-70 cursor-not-allowed"
                    >
                      Producer View
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleOpenBuyModal(offer)}
                      disabled={!isWithin1km}
                      variant={isWithin1km ? 'primary' : 'outline'}
                      size="sm"
                      className={`w-full text-xs font-bold flex items-center justify-center gap-1 ${
                        !isWithin1km ? 'text-text-secondary opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isWithin1km ? 'Buy Energy' : 'Out of Range'}</span>
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* HD-49: VIEW DETAILS MODAL / DRAWER                                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!detailOffer}
        onClose={() => setDetailOffer(null)}
        title="Energy Listing Details"
      >
        {detailOffer && (() => {
          const detailDistVal = getLiveDistanceKm(detailOffer);
          const detailIsWithin1km = detailDistVal <= MAX_P2P_TRANSFER_RADIUS_KM;

          return (
            <div className="space-y-5 pt-1">
              {/* Offer Header Strip */}
              <div className="p-3.5 bg-background rounded-xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-mono font-bold rounded-lg border border-primary/20">
                    #{detailOffer.id}
                  </span>
                  <span className="text-xs font-bold text-navy">
                    {detailOffer.energy_source || 'Solar'} Energy Offer
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    detailIsWithin1km
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                  }`}
                >
                  {detailIsWithin1km
                    ? 'Active & Transfer Eligible'
                    : 'Restricted (> 1.0 km)'}
                </span>
              </div>

              {/* Embedded Location Map Preview */}
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 h-36 bg-slate-900 shadow-inner">
                <iframe
                  title="Google Maps P2P Distance Route"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://maps.google.com/maps?q=${detailOffer.lat || 10.3698},${
                    detailOffer.lon || 77.9821
                  }&z=15&output=embed`}
                  className="w-full h-full opacity-90"
                />
                <div className="absolute top-2 left-2 bg-navy/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border border-white/20 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Producer Site: {detailOffer.seller_location || 'Local Feeder Zone'}</span>
                </div>
              </div>

              {/* GPS Microgrid Comparison Box */}
              <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-navy">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Microgrid Distance Verification:
                  </span>
                  <span className={`font-mono font-extrabold ${detailIsWithin1km ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {detailDistVal.toFixed(2)} km {detailIsWithin1km ? '(≤ 1.0 km Limit ✅)' : '(Exceeds 1.0 km Limit ❌)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-background/80 p-2 rounded-lg border border-border">
                    <span className="text-text-secondary block text-[10px] uppercase font-bold">📍 Your Household Smart Meter</span>
                    <span className="font-semibold text-navy block truncate">{consumerLocation.address}</span>
                    <span className="font-mono text-[10px] text-text-secondary">Lat: {consumerLocation.lat}, Lon: {consumerLocation.lon}</span>
                  </div>
                  <div className="bg-background/80 p-2 rounded-lg border border-border">
                    <span className="text-text-secondary block text-[10px] uppercase font-bold">📍 Producer Generation Site</span>
                    <span className="font-semibold text-navy block truncate">{detailOffer.seller_location || 'Local Solar Array'}</span>
                    <span className="font-mono text-[10px] text-text-secondary">Lat: {detailOffer.lat || 10.3698}, Lon: {detailOffer.lon || 77.9821}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-background rounded-xl border border-border space-y-1">
                  <span className="text-text-secondary text-[11px] block">Producer</span>
                  <span className="font-bold text-navy block truncate">
                    {detailOffer.seller_name || 'Community Producer'}
                  </span>
                  <span className="text-[10px] text-text-secondary capitalize">
                    Role: {detailOffer.seller_role || 'producer'}
                  </span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border space-y-1">
                  <span className="text-text-secondary text-[11px] block">Energy Source</span>
                  <span className="font-bold text-emerald-600 block">
                    {detailOffer.energy_source || 'Solar'} Power
                  </span>
                  <span className="text-[10px] text-text-secondary">Clean Verified Generation</span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border space-y-1">
                  <span className="text-text-secondary text-[11px] block">Available Energy</span>
                  <span className="text-base font-extrabold text-navy font-heading block">
                    {detailOffer.remaining_kwh} kWh
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    Total Listed: {detailOffer.energy_kwh || detailOffer.remaining_kwh} kWh
                  </span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border space-y-1">
                  <span className="text-text-secondary text-[11px] block">Tariff Rate</span>
                  <span className="text-base font-extrabold text-primary font-mono block">
                    ₹{parseFloat(detailOffer.price_per_kwh || 0).toFixed(2)} / kWh
                  </span>
                  <span className="text-[10px] text-text-secondary">Direct Peer-to-Peer Rate</span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border space-y-1 col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-[11px]">Availability Window:</span>
                    <span className="font-medium text-navy">
                      {formatValidityWindow(detailOffer.available_from, detailOffer.available_until)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Form & Total Calculator */}
              <form onSubmit={handleConfirmDetailPurchase} className="space-y-4 pt-1">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-navy">
                      Purchase Quantity (kWh):
                    </label>
                    <span className="text-[11px] text-text-secondary">
                      Max: {detailOffer.remaining_kwh} kWh
                    </span>
                  </div>

                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={detailOffer.remaining_kwh}
                    value={detailBuyAmount}
                    onChange={(e) => setDetailBuyAmount(e.target.value)}
                    placeholder={`Enter amount up to ${detailOffer.remaining_kwh} kWh`}
                    required
                  />

                  {/* Quick percentage buttons */}
                  <div className="flex gap-2 pt-1">
                    {[0.25, 0.5, 0.75, 1.0].map((fraction) => {
                      const kwhVal = (parseFloat(detailOffer.remaining_kwh) * fraction).toFixed(1);
                      return (
                        <button
                          key={fraction}
                          type="button"
                          onClick={() => setDetailBuyAmount(kwhVal)}
                          className="flex-1 py-1 px-2 text-[10px] font-bold bg-background border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer"
                        >
                          {fraction === 1.0 ? '100% (Max)' : `${fraction * 100}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Total Summary Box */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-text-secondary block text-[11px]">Total Estimated Cost:</span>
                    <span className="text-xl font-extrabold text-emerald-700 font-mono">
                      ₹{detailEstimatedTotal}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-800 rounded text-[10px] font-bold block">
                      {detailIsWithin1km ? 'Zero Line Loss Surcharge' : 'Distance Limit Exceeded'}
                    </span>
                    <span className="text-[10px] text-emerald-600 mt-0.5 block">
                      {detailIsWithin1km ? 'Direct Microgrid Transfer' : 'Transfer Blocked (> 1.0 km)'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDetailOffer(null)}>
                    Close
                  </Button>

                  {!isProducer && (
                    <Button
                      type="submit"
                      loading={buying}
                      disabled={buying || !detailIsWithin1km}
                      variant="primary"
                      className="flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      <span>
                        {detailIsWithin1km
                          ? 'Confirm Purchase'
                          : 'Restricted (> 1.0 km)'}
                      </span>
                    </Button>
                  )}
                </div>
              </form>
            </div>
          );
        })()}
      </Modal>

      {/* ========================================================================= */}
      {/* DIRECT PURCHASE MODAL                                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedOfferForBuy}
        onClose={() => setSelectedOfferForBuy(null)}
        title="Confirm Energy Transfer"
      >
        {selectedOfferForBuy && (() => {
          const directDistVal = getLiveDistanceKm(selectedOfferForBuy);
          const directIsWithin1km = directDistVal <= MAX_P2P_TRANSFER_RADIUS_KM;

          return (
            <form onSubmit={handleConfirmDirectPurchase} className="space-y-4 pt-1">
              <div className="p-3.5 bg-background border border-border rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Producer:</span>
                  <span className="font-bold text-navy">{selectedOfferForBuy.seller_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Energy Source:</span>
                  <span className="font-bold text-emerald-600">
                    {selectedOfferForBuy.energy_source || 'Solar'} Power
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Producer Location:</span>
                  <span className="font-medium text-navy">
                    {selectedOfferForBuy.seller_location || selectedOfferForBuy.seller_city || 'Local Microgrid'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Your Smart Meter Location:</span>
                  <span className="font-medium text-navy">
                    {consumerLocation.address}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Distance:</span>
                  <span className={`font-mono font-bold ${directIsWithin1km ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {directDistVal.toFixed(2)} km {directIsWithin1km ? '(Within 1.0 km Limit ✅)' : '(Exceeds 1.0 km Limit ❌)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Tariff Rate:</span>
                  <span className="font-bold text-primary font-mono">
                    ₹{parseFloat(selectedOfferForBuy.price_per_kwh || 0).toFixed(2)} / kWh
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-navy">
                    Enter kWh Amount to Transfer:
                  </label>
                  <span className="text-[11px] text-text-secondary">
                    Max: {selectedOfferForBuy.remaining_kwh} kWh
                  </span>
                </div>

                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedOfferForBuy.remaining_kwh}
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder={`Max ${selectedOfferForBuy.remaining_kwh} kWh`}
                  required
                />

                {/* Quick percentage buttons */}
                <div className="flex gap-2 pt-1">
                  {[0.25, 0.5, 0.75, 1.0].map((fraction) => {
                    const kwhVal = (parseFloat(selectedOfferForBuy.remaining_kwh) * fraction).toFixed(1);
                    return (
                      <button
                        key={fraction}
                        type="button"
                        onClick={() => setBuyAmount(kwhVal)}
                        className="flex-1 py-1 px-2 text-[10px] font-bold bg-background border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer"
                      >
                        {fraction === 1.0 ? '100% (Max)' : `${fraction * 100}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-text-secondary block text-[11px]">Estimated Total Cost:</span>
                  <span className="text-xl font-extrabold text-emerald-700 font-mono">
                    ₹{directEstimatedTotal}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${directIsWithin1km ? 'bg-emerald-500/20 text-emerald-700' : 'bg-rose-500/20 text-rose-700'}`}>
                  {directIsWithin1km ? '1.0 km Microgrid Transfer' : 'Exceeds 1.0 km Limit'}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedOfferForBuy(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={buying}
                  disabled={buying || !directIsWithin1km}
                  variant="primary"
                  className="flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4" /> Confirm Energy Transfer
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Smart Meter Required Modal */}
      <Modal
        isOpen={showSmartMeterModal}
        onClose={() => setShowSmartMeterModal(false)}
        title="Smart Meter Connection Required"
      >
        <div className="space-y-4 pt-2 text-center">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-navy font-heading">Household Smart Meter Required</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              Before purchasing P2P energy on the marketplace, your household Smart Meter must be registered so physical electricity transfer to your home can be measured and synchronized.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSmartMeterModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                setShowSmartMeterModal(false);
                navigate(ROUTES.DEVICES_SMART_METER);
              }}
            >
              Register Smart Meter Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Proof of Electricity Delivery Certificate Modal */}
      <ProofOfDeliveryModal
        isOpen={showProofModal}
        onClose={() => setShowProofModal(false)}
        proofData={proofData}
      />

      {/* Razorpay Secure Gateway & Smart Contract Escrow Modal */}
      <RazorpayCheckoutModal
        isOpen={razorpayModalOpen}
        onClose={() => {
          setRazorpayModalOpen(false);
          setRazorpayOfferData(null);
        }}
        offer={razorpayOfferData}
        energyKwh={razorpayAmountKwh}
        distanceKm={razorpayOfferData ? getLiveDistanceKm(razorpayOfferData) : 0.4}
        wheelingCharge={
          razorpayOfferData
            ? parseFloat(
                (
                  getLiveDistanceKm(razorpayOfferData) *
                  0.1 *
                  razorpayAmountKwh
                ).toFixed(2)
              )
            : 0
        }
        lineLossPercent={
          razorpayOfferData
            ? parseFloat((getLiveDistanceKm(razorpayOfferData) * 0.5).toFixed(2))
            : 0.2
        }
        onPaymentSuccess={(paymentDetails) => {
          if (razorpayOfferData) {
            executePurchase(razorpayOfferData, razorpayAmountKwh, paymentDetails);
          }
        }}
      />

      {/* Blockchain Ledger & Receipt Explorer Modal */}
      <BlockchainExplorerModal
        isOpen={blockchainModalOpen}
        onClose={() => {
          setBlockchainModalOpen(false);
          setBlockchainReceiptData(null);
        }}
        txData={blockchainReceiptData}
      />
    </div>
  );
}
