import { fetchWithAuth } from './apiClient.js';
import { recordClientAuditLog } from './auditService.js';
import {
  createSmartContractEscrow,
  verifySmartMeterDeliveryAndRelease,
} from './blockchainService.js';
import { creditProducerWallet } from './walletService.js';

const LOCAL_TX_KEY = 'hifai_marketplace_transactions';
const LOCAL_OFFERS_KEY = 'hifai_marketplace_offers';

export const MAX_P2P_TRANSFER_RADIUS_KM = 1.0;

/**
 * Calculates distance in km between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0.6;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export const INITIAL_TRANSACTIONS = [];


export const INITIAL_OFFERS = [
  {
    id: 'OFFER-LOCAL-101',
    seller_id: 'PROD-001',
    seller_name: 'ABC Solar Pro',
    seller_role: 'producer',
    seller_location: 'Main Road Section 4, Dindigul',
    seller_city: 'Dindigul',
    lat: 10.3698,
    lon: 77.9821,
    distance_value: 0.3,
    distance_km: '0.3 km',
    energy_source: 'Solar',
    energy_kwh: 25.0,
    remaining_kwh: 25.0,
    price_per_kwh: 7.20,
    available_from: new Date().toISOString(),
    available_until: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'OFFER-LOCAL-102',
    seller_id: 'PROD-002',
    seller_name: 'EcoRoof Prosumer B',
    seller_role: 'prosumer',
    seller_location: 'GTN Road Feeder B, Dindigul',
    seller_city: 'Dindigul',
    lat: 10.3638,
    lon: 77.9833,
    distance_value: 0.5,
    distance_km: '0.5 km',
    energy_source: 'Solar',
    energy_kwh: 35.0,
    remaining_kwh: 35.0,
    price_per_kwh: 6.80,
    available_from: new Date().toISOString(),
    available_until: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    status: 'active',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'OFFER-LOCAL-103',
    seller_id: 'PROD-003',
    seller_name: 'Palani Road Solar Array',
    seller_role: 'producer',
    seller_location: 'Palani Road Clean Array 1, Dindigul',
    seller_city: 'Dindigul',
    lat: 10.3728,
    lon: 77.9763,
    distance_value: 0.8,
    distance_km: '0.8 km',
    energy_source: 'Solar',
    energy_kwh: 50.0,
    remaining_kwh: 50.0,
    price_per_kwh: 5.50,
    available_from: new Date().toISOString(),
    available_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    status: 'active',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'OFFER-LOCAL-104',
    seller_id: 'PROD-004',
    seller_name: 'Collectorate Solar Farm',
    seller_role: 'producer',
    seller_location: 'Collectorate Office Solar Station, Dindigul',
    seller_city: 'Dindigul',
    lat: 10.3653,
    lon: 77.9778,
    distance_value: 0.4,
    distance_km: '0.4 km',
    energy_source: 'Solar',
    energy_kwh: 15.0,
    remaining_kwh: 15.0,
    price_per_kwh: 8.00,
    available_from: new Date().toISOString(),
    available_until: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    status: 'active',
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'OFFER-LOCAL-105',
    seller_id: 'PROD-001',
    seller_name: 'Mengles Road Solar Rooftop',
    seller_role: 'producer',
    seller_location: 'Mengles Road Rooftop Array 2, Dindigul',
    seller_city: 'Dindigul',
    lat: 10.3713,
    lon: 77.9843,
    distance_value: 0.6,
    distance_km: '0.6 km',
    energy_source: 'Solar',
    energy_kwh: 12.5,
    remaining_kwh: 12.5,
    price_per_kwh: 7.20,
    available_from: new Date().toISOString(),
    available_until: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    status: 'active',
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'OFFER-LOCAL-106',
    seller_id: 'PROD-005',
    seller_name: 'Madurai Highway Outer Solar Plant',
    seller_role: 'producer',
    seller_location: 'Madurai Highway Substation 9',
    seller_city: 'Outer District',
    lat: 10.4023,
    lon: 78.0153,
    distance_value: 4.8,
    distance_km: '4.8 km (Exceeds 1.0 km Limit)',
    energy_source: 'Solar',
    energy_kwh: 18.5,
    remaining_kwh: 18.5,
    price_per_kwh: 9.20,
    available_from: new Date().toISOString(),
    available_until: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    status: 'active',
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
];

function getLocalTransactions(userId = null) {
  try {
    let all = [];
    const raw = localStorage.getItem(LOCAL_TX_KEY);
    if (raw) {
      all = JSON.parse(raw);
    }
    if (!Array.isArray(all)) all = INITIAL_TRANSACTIONS;

    if (!userId || userId === 'all') {
      return all;
    }

    // Filter strictly by the specific logged in user's ID or email
    return all.filter(
      (tx) =>
        String(tx.buyerId) === String(userId) ||
        String(tx.sellerId) === String(userId) ||
        (tx.buyerEmail && String(tx.buyerEmail).toLowerCase() === String(userId).toLowerCase()) ||
        String(tx.userId) === String(userId)
    );
  } catch {
    return [];
  }
}

function saveLocalTransactions(txList, userId = null) {
  try {
    const existingRaw = localStorage.getItem(LOCAL_TX_KEY);
    let all = [];
    if (existingRaw) {
      try {
        all = JSON.parse(existingRaw) || [];
      } catch {}
    }
    const map = new Map();
    (Array.isArray(all) ? all : []).forEach((t) => {
      if (t && t.id) map.set(String(t.id), t);
    });
    (Array.isArray(txList) ? txList : []).forEach((t) => {
      if (t && t.id) map.set(String(t.id), t);
    });
    const merged = Array.from(map.values());

    localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(merged));
    if (userId && userId !== 'guest') {
      localStorage.setItem(`${LOCAL_TX_KEY}_${userId}`, JSON.stringify(txList));
    }
  } catch (e) {
    console.error('LocalStorage save transactions error:', e);
  }
}

const COMPLETED_OFFERS_KEY = 'yuga_completed_offer_ids';

export function getCompletedOfferIds() {
  try {
    const raw = localStorage.getItem(COMPLETED_OFFERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markOfferAsCompleted(offerId) {
  try {
    const completed = getCompletedOfferIds();
    const strId = String(offerId).toLowerCase();
    const numId = strId.replace(/\D/g, '');
    const toAdd = [strId, String(offerId)];
    if (numId) toAdd.push(numId);
    if (!strId.startsWith('offer-local-') && numId) toAdd.push(`offer-local-${numId}`);
    const newSet = Array.from(new Set([...completed, ...toAdd]));
    localStorage.setItem(COMPLETED_OFFERS_KEY, JSON.stringify(newSet));
  } catch (e) {
    console.warn('markOfferAsCompleted error:', e);
  }
}

export function isOfferCompletedOrDepleted(offer) {
  if (!offer) return true;
  if (parseFloat(offer.remaining_kwh || 0) <= 0) return true;
  if (offer.status && offer.status.toLowerCase() === 'completed') return true;
  const completedIds = getCompletedOfferIds();
  const strId = String(offer.id).toLowerCase();
  const numId = strId.replace(/\D/g, '');
  return (
    completedIds.includes(strId) ||
    (numId && completedIds.includes(numId)) ||
    completedIds.includes(`offer-local-${numId}`)
  );
}

function getLocalOffers() {
  let userLat = 10.3673;
  let userLon = 77.9803;
  let userArea = 'Dindigul';

  try {
    const savedLoc =
      localStorage.getItem('yuga_consumer_location') ||
      localStorage.getItem('yuga_consumer_location_guest');
    if (savedLoc) {
      const parsed = JSON.parse(savedLoc);
      if (parsed.lat && parsed.lon) {
        userLat = parseFloat(parsed.lat);
        userLon = parseFloat(parsed.lon);
        userArea = parsed.address ? parsed.address.split(',')[0].trim() : 'Dindigul';
      }
    }
  } catch {}

  const dynamicInitialOffers = [
    {
      id: 'OFFER-LOCAL-101',
      seller_id: 'PROD-001',
      seller_name: 'ABC Solar Pro',
      seller_role: 'producer',
      seller_location: `${userArea} Section 4, Solar Feeder A`,
      seller_city: userArea,
      lat: parseFloat((userLat + 0.0025).toFixed(4)),
      lon: parseFloat((userLon + 0.0018).toFixed(4)),
      distance_value: 0.3,
      distance_km: '0.3 km',
      energy_source: 'Solar',
      energy_kwh: 25.0,
      remaining_kwh: 25.0,
      price_per_kwh: 7.20,
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'OFFER-LOCAL-102',
      seller_id: 'PROD-002',
      seller_name: 'EcoRoof Prosumer B',
      seller_role: 'prosumer',
      seller_location: `${userArea} Feeder B, Rooftop Solar`,
      seller_city: userArea,
      lat: parseFloat((userLat - 0.0035).toFixed(4)),
      lon: parseFloat((userLon + 0.0030).toFixed(4)),
      distance_value: 0.5,
      distance_km: '0.5 km',
      energy_source: 'Solar',
      energy_kwh: 35.0,
      remaining_kwh: 35.0,
      price_per_kwh: 6.80,
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'OFFER-LOCAL-103',
      seller_id: 'PROD-003',
      seller_name: 'Coastal Clean Solar Grid',
      seller_role: 'producer',
      seller_location: `${userArea} Clean Array 1`,
      seller_city: userArea,
      lat: parseFloat((userLat + 0.0055).toFixed(4)),
      lon: parseFloat((userLon - 0.0040).toFixed(4)),
      distance_value: 0.8,
      distance_km: '0.8 km',
      energy_source: 'Solar',
      energy_kwh: 50.0,
      remaining_kwh: 50.0,
      price_per_kwh: 5.50,
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'OFFER-LOCAL-104',
      seller_id: 'PROD-004',
      seller_name: 'Canal Solar Farm',
      seller_role: 'producer',
      seller_location: `${userArea} Solar Station`,
      seller_city: userArea,
      lat: parseFloat((userLat - 0.0020).toFixed(4)),
      lon: parseFloat((userLon - 0.0025).toFixed(4)),
      distance_value: 0.4,
      distance_km: '0.4 km',
      energy_source: 'Solar',
      energy_kwh: 15.0,
      remaining_kwh: 15.0,
      price_per_kwh: 8.00,
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 'OFFER-LOCAL-105',
      seller_id: 'PROD-001',
      seller_name: 'ABC Solar Rooftop Feeder',
      seller_role: 'producer',
      seller_location: `${userArea} Rooftop Array 2`,
      seller_city: userArea,
      lat: parseFloat((userLat + 0.0040).toFixed(4)),
      lon: parseFloat((userLon + 0.0040).toFixed(4)),
      distance_value: 0.6,
      distance_km: '0.6 km',
      energy_source: 'Solar',
      energy_kwh: 12.5,
      remaining_kwh: 12.5,
      price_per_kwh: 7.20,
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'OFFER-LOCAL-106',
      seller_id: 'PROD-005',
      seller_name: 'Outer Regional Solar Plant',
      seller_role: 'producer',
      seller_location: 'Outer District Substation 9',
      seller_city: 'Outer District',
      lat: parseFloat((userLat + 0.0350).toFixed(4)),
      lon: parseFloat((userLon + 0.0350).toFixed(4)),
      distance_value: 4.8,
      distance_km: '4.8 km (Exceeds 1.0 km Limit)',
      energy_source: 'Solar',
      energy_kwh: 18.5,
      remaining_kwh: 18.5,
      price_per_kwh: 9.20,
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 18000000).toISOString(),
    },
  ];

  try {
    const raw = localStorage.getItem(LOCAL_OFFERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((o) => !isOfferCompletedOrDepleted(o));
      }
    }
  } catch {}

  const activeInitial = dynamicInitialOffers.filter((o) => !isOfferCompletedOrDepleted(o));
  saveLocalOffers(activeInitial);
  return activeInitial;
}

function saveLocalOffers(offers) {
  try {
    const activeOnly = (offers || []).filter((o) => !isOfferCompletedOrDepleted(o));
    localStorage.setItem(LOCAL_OFFERS_KEY, JSON.stringify(activeOnly));
  } catch (e) {
    console.error('LocalStorage save offers error:', e);
  }
}

export function normalizeTransaction(tx) {
  const buyer = tx.buyer || tx.buyer_name || 'Household Consumer';
  const seller = tx.seller || tx.seller_name || 'Community Solar Producer';
  const energy = parseFloat(tx.energyAmount || tx.energy_kwh || tx.energy_amount || tx.units_kwh || 0);
  const price = parseFloat(tx.price || tx.total_amount || 0);
  const pricePerKwh = parseFloat(tx.pricePerKwh || tx.price_per_kwh || 0);

  return {
    id: String(tx.id || `TX-${Math.floor(Math.random() * 100000)}`),
    type: tx.type || 'purchase',
    buyer,
    buyer_name: buyer,
    seller,
    seller_name: seller,
    location: tx.location || tx.seller_location || 'Local Microgrid',
    distance_value: parseFloat(tx.distance_value || 0.5),
    energyAmount: energy,
    energy_kwh: energy,
    units_kwh: energy,
    price,
    total_amount: price,
    pricePerKwh,
    price_per_kwh: pricePerKwh,
    wheelingCharge: parseFloat(tx.wheelingCharge ?? tx.wheeling_charge ?? 0),
    lineLossPercent: parseFloat(tx.lineLossPercent ?? tx.line_loss_percent ?? 0),
    date: tx.date || tx.created_at || new Date().toISOString(),
    status: tx.status || 'completed',
    currency: tx.currency || '₹',
  };
}

export async function fetchEnergyOffers(paramsOrSearch = '') {
  try {
    let queryStr = '';
    if (typeof paramsOrSearch === 'string') {
      if (paramsOrSearch.trim()) {
        queryStr = `?search=${encodeURIComponent(paramsOrSearch.trim())}`;
      }
    } else if (paramsOrSearch && typeof paramsOrSearch === 'object') {
      const qParams = new URLSearchParams();
      if (paramsOrSearch.search) qParams.append('search', paramsOrSearch.search);
      if (paramsOrSearch.energySource && paramsOrSearch.energySource !== 'all') {
        qParams.append('energy_source', paramsOrSearch.energySource);
      }
      if (paramsOrSearch.minPrice) qParams.append('min_price', paramsOrSearch.minPrice);
      if (paramsOrSearch.maxPrice) qParams.append('max_price', paramsOrSearch.maxPrice);
      if (paramsOrSearch.minKwh) qParams.append('min_kwh', paramsOrSearch.minKwh);
      if (paramsOrSearch.status && paramsOrSearch.status !== 'all') {
        qParams.append('status', paramsOrSearch.status);
      }
      const str = qParams.toString();
      if (str) queryStr = `?${str}`;
    }

    const localOffers = getLocalOffers().filter((o) => !isOfferCompletedOrDepleted(o));
    let apiOffers = [];
    try {
      const endpoint = `/energy/offers${queryStr}`;
      const res = await fetchWithAuth(endpoint);
      apiOffers = (res.offers || []).filter((o) => !isOfferCompletedOrDepleted(o));
    } catch {}

    const normalizeKey = (id) => String(id).toLowerCase().replace(/\D/g, '') || String(id).toLowerCase();
    const allOffersMap = new Map();

    localOffers.forEach((l) => {
      allOffersMap.set(normalizeKey(l.id), l);
    });

    apiOffers.forEach((a) => {
      const key = normalizeKey(a.id);
      if (!allOffersMap.has(key) && !isOfferCompletedOrDepleted(a)) {
        allOffersMap.set(key, a);
      }
    });

    const merged = Array.from(allOffersMap.values());
    return merged.filter((o) => !isOfferCompletedOrDepleted(o));
  } catch (error) {
    console.warn('Error fetching energy offers, returning local cache:', error);
    const local = getLocalOffers();
    return local.filter((o) => !isOfferCompletedOrDepleted(o));
  }
}

/**
 * Retrieves the user-specific battery storage capacity.
 * Defaults to 150.0 kWh (or custom capacity configured by user / solar systems).
 */
export function getUserBatteryCapacity(userId = 'guest') {
  try {
    const key = `yuga_user_battery_capacity_${userId || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return 150.0;
}

/**
 * Saves a user-specific battery storage capacity (e.g. 150 kWh, 80 kWh, 200 kWh).
 */
export function saveUserBatteryCapacity(userId = 'guest', capacityKwh = 150.0) {
  try {
    const val = parseFloat(capacityKwh) || 150.0;
    localStorage.setItem(`yuga_user_battery_capacity_${userId || 'guest'}`, String(val));
    return val;
  } catch (e) {
    console.warn('saveUserBatteryCapacity error:', e);
    return 150.0;
  }
}

/**
 * Accurately calculates a producer's total battery storage capacity,
 * physical battery balance (Total - Sold), and available unlisted posting quota.
 * e.g., Total Battery: 150 kWh, Sold: 50 kWh => Current Battery Balance: 100 kWh.
 * If 30 kWh is actively listed in marketplace => Available to Post: 70 kWh.
 */
export async function fetchProducerEnergyQuota(userId = 'guest', userName = '') {
  const [txs, sum, offers] = await Promise.all([
    fetchUserTransactions(userId),
    fetchEnergySummary(userId),
    fetchEnergyOffers(),
  ]);

  // Total energy already successfully sold and discharged by this producer
  const totalSoldKwh = (txs || [])
    .filter(
      (tx) =>
        (tx.status === 'completed' || !tx.status) &&
        (String(tx.sellerId) === String(userId) || (userId === 'guest' && tx.sellerId === 'guest'))
    )
    .reduce((acc, tx) => acc + (parseFloat(tx.energyAmount) || 0), 0);

  // User-specific total battery storage capacity (configured capacity, defaults to 150.0 kWh)
  const totalCapacityKwh = getUserBatteryCapacity(userId);

  // Physical Battery Balance remaining in the battery (Total Capacity - Sold Power)
  const currentBatteryBalanceKwh = Math.max(0, parseFloat((totalCapacityKwh - totalSoldKwh).toFixed(2)));

  // Active listings currently posted by this producer in the marketplace (waiting for buyer)
  const isOwnerOffer = (o) => {
    if (isOfferCompletedOrDepleted(o)) return false;
    if (o.status && o.status.toLowerCase() !== 'active') return false;
    // Seed offers (OFFER-LOCAL-101 to 106, seller_id PROD-001..005) belong to simulated local producers, NEVER to the current logged-in user
    if (
      String(o.id).startsWith('OFFER-LOCAL-') ||
      ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005'].includes(String(o.seller_id))
    ) {
      return false;
    }
    if (userId && userId !== 'guest') {
      return String(o.seller_id) === String(userId) || String(o.seller_uid) === String(userId);
    }
    // For guest/demo producer: only match offers explicitly created by guest
    return o.seller_id === 'guest' || o.seller_id === 'PROD-CURRENT' || o.seller_uid === 'PROD-CURRENT';
  };

  const activeProducerOffers = (offers || []).filter(isOwnerOffer);

  const activeListedKwh = activeProducerOffers.reduce(
    (acc, o) => acc + (parseFloat(o.remaining_kwh ?? o.energy_kwh) || 0),
    0
  );

  // Remaining postable energy (Battery Balance - Energy already locked in Active Listings)
  const remainingPostableKwh = Math.max(0, parseFloat((currentBatteryBalanceKwh - activeListedKwh).toFixed(2)));

  return {
    totalCapacityKwh: parseFloat(totalCapacityKwh.toFixed(2)),
    totalSoldKwh: parseFloat(totalSoldKwh.toFixed(2)),
    currentBatteryBalanceKwh,
    activeListedKwh: parseFloat(activeListedKwh.toFixed(2)),
    remainingPostableKwh,
    activeOffersCount: activeProducerOffers.length,
    activeOffers: activeProducerOffers,
  };
}

/**
 * Cancels or withdraws an active energy offer and restores the energy to the producer's unlisted battery quota.
 */
export async function deleteEnergyOffer(offerId) {
  try {
    const res = await fetchWithAuth(`/energy/offers/${offerId}`, {
      method: 'DELETE',
    });

    const currentLocal = getLocalOffers();
    const strId = String(offerId).toLowerCase();
    const numId = strId.replace(/\D/g, '');
    const updatedLocal = currentLocal.filter((o) => {
      const oStr = String(o.id).toLowerCase();
      const oNum = oStr.replace(/\D/g, '');
      return oStr !== strId && (!numId || oNum !== numId);
    });
    saveLocalOffers(updatedLocal);
    markOfferAsCompleted(offerId);

    recordClientAuditLog({
      transaction_id: `CANCEL-${offerId}`,
      actor: 'Producer',
      action: 'OFFER_CANCELLED',
      transaction_type: 'offer_cancellation',
      amount: 0,
      status: 'cancelled',
      description: `Active energy offer #${offerId} withdrawn. Energy restored to unlisted battery storage reserve.`,
      metadata: { offer_id: offerId },
    });

    return res || { success: true };
  } catch (error) {
    console.warn('Backend delete offer error, updating local cache:', error);
    const currentLocal = getLocalOffers();
    const strId = String(offerId).toLowerCase();
    const numId = strId.replace(/\D/g, '');
    const updatedLocal = currentLocal.filter((o) => {
      const oStr = String(o.id).toLowerCase();
      const oNum = oStr.replace(/\D/g, '');
      return oStr !== strId && (!numId || oNum !== numId);
    });
    saveLocalOffers(updatedLocal);
    markOfferAsCompleted(offerId);

    recordClientAuditLog({
      transaction_id: `CANCEL-${offerId}`,
      actor: 'Producer',
      action: 'OFFER_CANCELLED',
      transaction_type: 'offer_cancellation',
      amount: 0,
      status: 'cancelled',
      description: `Active energy offer #${offerId} withdrawn. Energy restored to unlisted battery storage reserve.`,
      metadata: { offer_id: offerId },
    });

    return { success: true, message: `Offer #${offerId} withdrawn successfully` };
  }
}

export async function createEnergyOffer(offerData) {
  // Check producer energy quota: Deduct both already sold energy AND active marketplace listings
  const quota = await fetchProducerEnergyQuota(offerData.seller_id, offerData.seller_name);
  const requestedKwh = parseFloat(offerData.energy_kwh || 0);

  if (isNaN(requestedKwh) || requestedKwh <= 0) {
    throw new Error('Please enter a valid energy amount greater than 0 kWh');
  }

  if (requestedKwh > quota.remainingPostableKwh) {
    throw new Error(
      `❌ Exceeds Available Unlisted Energy! Total Battery: ${quota.totalCapacityKwh} kWh, Sold: ${quota.totalSoldKwh} kWh (Current Battery Balance: ${quota.currentBatteryBalanceKwh} kWh), Already Listed in Market: ${quota.activeListedKwh} kWh. You can only post up to the remaining ${quota.remainingPostableKwh} kWh.`
    );
  }

  const activeCity = (typeof window !== 'undefined' && localStorage.getItem('hifai_user_city')) || offerData.seller_city || 'Dindigul';
  const sellerLocation = offerData.seller_location || `${activeCity} (Local Substation Zone)`;
  const priceVal = parseFloat(offerData.price_per_kwh || 7.20);

  const formattedOffer = {
    id: `OFFER-P2P-${Math.floor(100000 + Math.random() * 900000)}`,
    seller_id: offerData.seller_id || 'PROD-CURRENT',
    seller_uid: offerData.seller_id || 'PROD-CURRENT',
    seller_name: offerData.seller_name || 'Community Solar Producer',
    seller_location: sellerLocation,
    seller_city: activeCity,
    lat: offerData.lat || 10.3673,
    lon: offerData.lon || 77.9803,
    distance_value: offerData.distance_value || 0.4,
    distance_km: '0.4 km (Within 1.0 km Radius)',
    energy_source: offerData.energy_source || 'Solar',
    energy_kwh: requestedKwh,
    remaining_kwh: requestedKwh,
    price_per_kwh: priceVal,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetchWithAuth('/energy/offers', {
      method: 'POST',
      body: JSON.stringify({
        ...offerData,
        energy_kwh: requestedKwh,
        price_per_kwh: priceVal,
        seller_location: sellerLocation,
        seller_city: activeCity,
        lat: offerData.lat || 10.3673,
        lon: offerData.lon || 77.9803,
      }),
    });
    const currentLocal = getLocalOffers();
    const newOffer = res.offer || formattedOffer;
    saveLocalOffers([newOffer, ...currentLocal.filter((o) => o.id !== newOffer.id)]);

    recordClientAuditLog({
      transaction_id: `OFFER-${newOffer.id}`,
      actor: newOffer.seller_name || 'Community Solar Producer',
      action: 'OFFER_CREATED',
      transaction_type: 'offer_creation',
      amount: parseFloat((newOffer.energy_kwh * newOffer.price_per_kwh).toFixed(2)),
      status: 'verified',
      description: `Published offer for ${newOffer.energy_kwh} kWh at ₹${newOffer.price_per_kwh}/kWh in ${newOffer.seller_city || 'Dindigul'}.`,
      metadata: newOffer,
    });

    return res;
  } catch (error) {
    console.warn('Backend energy offer create endpoint offline, saving locally:', error);
    const currentLocal = getLocalOffers();
    saveLocalOffers([formattedOffer, ...currentLocal]);

    recordClientAuditLog({
      transaction_id: `OFFER-${formattedOffer.id}`,
      actor: formattedOffer.seller_name || 'Community Solar Producer',
      action: 'OFFER_CREATED',
      transaction_type: 'offer_creation',
      amount: parseFloat((formattedOffer.energy_kwh * formattedOffer.price_per_kwh).toFixed(2)),
      status: 'verified',
      description: `Published offer for ${formattedOffer.energy_kwh} kWh at ₹${formattedOffer.price_per_kwh}/kWh in ${formattedOffer.seller_city || 'Local Area'}.`,
      metadata: formattedOffer,
    });

    return { success: true, offer: formattedOffer };
  }
}

/**
 * Checks for energy offers that have been active for > 24 hours without full purchase.
 * Generates actionable alerts and pricing suggestions for producers.
 */
export function checkUnsoldOffersAlert(userId = 'guest') {
  const offers = getLocalOffers();
  const now = Date.now();
  const ONE_DAY_MS = 24 * 3600 * 1000;

  const unsoldOffers = offers.filter((o) => {
    if (!o.created_at) return false;
    const isOwner = !userId || userId === 'guest' || o.seller_id === userId || o.seller_name?.includes('Producer');
    const ageMs = now - new Date(o.created_at).getTime();
    return isOwner && ageMs >= ONE_DAY_MS && (o.status === 'active' || !o.status) && parseFloat(o.remaining_kwh || 0) > 0;
  });

  return unsoldOffers.map((offer) => {
    const ageHours = Math.floor((now - new Date(offer.created_at).getTime()) / (3600 * 1000));
    return {
      id: offer.id,
      offer,
      ageHours,
      title: `⚠️ Unsold Energy Alert: Offer #${offer.id}`,
      message: `Your listing for ${offer.remaining_kwh} kWh at ₹${offer.price_per_kwh}/kWh in ${offer.seller_city || 'Dindigul'} has had no buyers for ${ageHours} hours!`,
      suggestion: '💡 Tip: Lower your tariff by ₹0.50/kWh or schedule for peak evening demand hours (6 PM - 9 PM) to attract nearby consumers.',
      suggestedPrice: Math.max(4.5, parseFloat((offer.price_per_kwh - 0.5).toFixed(2))),
    };
  });
}

export async function purchaseEnergy(
  offerId,
  energyKwh,
  offerObj = null,
  calculatedDistanceKm = null,
  buyerProfile = null,
  paymentDetails = {}
) {
  // STRICT 1.0 KM RADIUS VALIDATION CHECK
  const dist = calculatedDistanceKm !== null
    ? calculatedDistanceKm
    : parseFloat(offerObj?.distance_value ?? (offerObj?.distance_km ? parseFloat(offerObj.distance_km) : 0.5));

  if (dist > MAX_P2P_TRANSFER_RADIUS_KM) {
    throw new Error(
      `🚫 Peer-to-Peer Energy Transfer Restricted! The producer is located ${dist.toFixed(
        1
      )} km away. Peer-to-peer electricity transfer is ONLY permitted within a 1.0 km microgrid radius for line-loss and voltage stability!`
    );
  }

  let serverRes = null;
  try {
    serverRes = await fetchWithAuth('/energy/purchase', {
      method: 'POST',
      body: JSON.stringify({
        offer_id: offerId,
        energy_kwh: energyKwh,
        distance_km: dist,
        consumer_lat: offerObj?.consumer_lat,
        consumer_lon: offerObj?.consumer_lon,
      }),
    });
  } catch (error) {
    console.warn('Backend energy purchase endpoint offline or error, saving locally:', error);
  }

  const sellerLoc = offerObj?.seller_location || 'Local Substation Area';
  const buyerName = buyerProfile?.displayName || buyerProfile?.fullName || buyerProfile?.name || 'Household Consumer';
  const sellerName = offerObj?.seller_name || 'Community Solar Producer';
  const basePricePerKwh = offerObj?.price_per_kwh || 7.2;
  const basePrice = parseFloat((energyKwh * basePricePerKwh).toFixed(2));
  const lineLossPercent = parseFloat((dist * 0.5).toFixed(2)); // 0.5% line loss per km
  const wheelingCharge = parseFloat((dist * 0.10 * energyKwh).toFixed(2)); // ₹0.10/kWh/km microgrid surcharge
  const totalPrice = parseFloat((basePrice + wheelingCharge).toFixed(2));
  const tradeId = serverRes?.transaction?.id || `TX-P2P-${Math.floor(100000 + Math.random() * 900000)}`;

  // 1. Lock payment in Blockchain Smart Contract Escrow
  const escrow = await createSmartContractEscrow({
    tradeId,
    buyerId: buyerProfile?.uid || 'consumer-001',
    buyerName,
    sellerId: offerObj?.seller_id || 'PROD-001',
    sellerName,
    energyKwh,
    pricePerKwh: basePricePerKwh,
    totalAmount: totalPrice,
    wheelingCharge,
    lineLossPercent,
    distanceKm: dist,
    paymentMethod: paymentDetails?.paymentMethod || 'Razorpay Gateway (UPI / Card)',
    razorpayPaymentId: paymentDetails?.razorpay_payment_id || `pay_rzp_${Date.now()}`,
  });

  // 2. Simulate Smart Meter IoT Telemetry Verification & Fund Release to Producer
  const deliverySettlement = await verifySmartMeterDeliveryAndRelease({
    tradeId,
    meterSn: offerObj?.meter_sn || 'SM-DINDIGUL-01',
    voltageV: 230.2,
    frequencyHz: 50.01,
    actualDeliveredKwh: energyKwh,
  });

  // 3. Automatically Credit Funds to the Producer's Wallet
  await creditProducerWallet(offerObj?.seller_id || 'guest', totalPrice, {
    tradeId,
    energyKwh,
    buyerName,
    sellerName,
    contractAddress: escrow.contractAddress,
    recTokenId: deliverySettlement.recTokenId,
  });

  // 4. Create local transaction record with confirmed on-chain details
  const buyerId = buyerProfile?.uid || buyerProfile?.firebase_uid || buyerProfile?.id || 'guest';
  const buyerEmail = buyerProfile?.email || '';
  const sellerId = offerObj?.seller_id || 'PROD-001';

  const newTx = normalizeTransaction({
    id: tradeId,
    type: 'purchase',
    buyerId,
    buyerEmail,
    buyer: buyerName,
    sellerId,
    seller: sellerName,
    location: sellerLoc,
    distance_value: dist,
    energyAmount: energyKwh,
    price: totalPrice,
    pricePerKwh: basePricePerKwh,
    wheelingCharge,
    lineLossPercent,
    date: new Date().toISOString(),
    status: 'completed',
    contractAddress: escrow.contractAddress,
    txHash: escrow.txHash,
    meterProofHash: deliverySettlement.meterProofHash,
    recTokenId: deliverySettlement.recTokenId,
    razorpayPaymentId: escrow.razorpayPaymentId,
  });

  const currentLocal = getLocalTransactions();
  saveLocalTransactions([newTx, ...currentLocal], buyerId);

  // 5. Update remaining kWh on local offer and remove/complete if 0
  const currentOffers = getLocalOffers();
  let remainingLeft = 0;
  const numId = String(offerId).replace(/\D/g, '');

  const updatedOffers = currentOffers
    .map((o) => {
      const match =
        String(o.id) === String(offerId) ||
        (numId && String(o.id).replace(/\D/g, '') === numId) ||
        String(o.id).toLowerCase().includes(String(offerId).toLowerCase());

      if (match) {
        const rem = Math.max(0, parseFloat((parseFloat(o.remaining_kwh || 0) - energyKwh).toFixed(2)));
        remainingLeft = rem;
        const newStatus = rem <= 0 ? 'completed' : (o.status || 'active');
        return { ...o, remaining_kwh: rem, status: newStatus };
      }
      return o;
    })
    .filter((o) => parseFloat(o.remaining_kwh || 0) > 0 && o.status !== 'completed');

  if (remainingLeft <= 0) {
    markOfferAsCompleted(offerId);
    if (offerObj?.id) markOfferAsCompleted(offerObj.id);
  }
  saveLocalOffers(updatedOffers);

  // 6. Record verified Blockchain Audit Trail Record
  recordClientAuditLog({
    transaction_id: newTx.id,
    actor: `${buyerName} (Buyer)`,
    action: 'ENERGY_PURCHASE',
    transaction_type: 'purchase',
    amount: newTx.price,
    status: 'verified',
    description: `Blockchain Verified: Purchased ${energyKwh} kWh solar energy from ${sellerName} via Smart Contract ${escrow.contractAddress}. Escrow settled ₹${totalPrice.toFixed(2)} to Producer wallet. REC: #${deliverySettlement.recTokenId}.`,
    blockchain_hash: escrow.txHash,
    metadata: {
      ...newTx,
      contractAddress: escrow.contractAddress,
      recTokenId: deliverySettlement.recTokenId,
      meterProofHash: deliverySettlement.meterProofHash,
    },
  });

  return serverRes || {
    success: true,
    message: `⚡ Clean Electricity Delivered! ${energyKwh} kWh transferred from ${sellerLoc}. Payment settled via Smart Contract Escrow.`,
    transaction: newTx,
    escrow,
    recTokenId: deliverySettlement.recTokenId,
    ...newTx,
  };
}

export async function updateTransactionStatus(txId, status) {
  try {
    const res = await fetchWithAuth(`/energy/transactions/${txId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    // Update local cache
    const currentLocal = getLocalTransactions();
    const updatedLocal = currentLocal.map((t) => (String(t.id) === String(txId) ? { ...t, status } : t));
    saveLocalTransactions(updatedLocal);

    recordClientAuditLog({
      transaction_id: String(txId),
      actor: 'YUGA Platform',
      action: `STATUS_${status.toUpperCase()}`,
      transaction_type: 'status_change',
      amount: 0,
      status: status === 'completed' ? 'verified' : (status === 'cancelled' ? 'cancelled' : 'pending'),
      description: `Transaction #${txId} status updated to '${status.toUpperCase()}'.`,
      metadata: { transaction_id: txId, new_status: status },
    });

    return res;
  } catch (error) {
    console.warn('Backend update transaction status endpoint error, updating local cache:', error);
    const currentLocal = getLocalTransactions();
    const updatedLocal = currentLocal.map((t) => (String(t.id) === String(txId) ? { ...t, status } : t));
    saveLocalTransactions(updatedLocal);

    recordClientAuditLog({
      transaction_id: String(txId),
      actor: 'YUGA Platform',
      action: `STATUS_${status.toUpperCase()}`,
      transaction_type: 'status_change',
      amount: 0,
      status: status === 'completed' ? 'verified' : (status === 'cancelled' ? 'cancelled' : 'pending'),
      description: `Transaction #${txId} status updated to '${status.toUpperCase()}'.`,
      metadata: { transaction_id: txId, new_status: status },
    });

    return { success: true, message: `Transaction #${txId} updated to ${status}` };
  }
}

export async function cancelTransaction(txId, reason = '') {
  try {
    const res = await fetchWithAuth(`/energy/transactions/${txId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    // Update local cache
    const currentLocal = getLocalTransactions();
    const targetTx = currentLocal.find((t) => String(t.id) === String(txId));
    if (targetTx) {
      targetTx.status = 'cancelled';
      saveLocalTransactions(currentLocal);

      // Restore energy in local offers
      const currentOffers = getLocalOffers();
      const updatedOffers = currentOffers.map((o) => {
        if (o.seller_name === targetTx.seller) {
          const restored = parseFloat(o.remaining_kwh) + (targetTx.energyAmount || 0);
          return { ...o, remaining_kwh: restored };
        }
        return o;
      });
      saveLocalOffers(updatedOffers);

      recordClientAuditLog({
        transaction_id: String(txId),
        actor: targetTx.buyer || 'Consumer',
        action: 'TRANSACTION_CANCELLED',
        transaction_type: 'refund',
        amount: targetTx.price || 0,
        status: 'cancelled',
        description: `Order #${txId} cancelled. Refund of ₹${(targetTx.price || 0).toFixed(2)} processed. Reason: ${reason || 'User cancelled'}.`,
        metadata: targetTx,
      });
    }

    return res;
  } catch (error) {
    console.warn('Backend cancel transaction endpoint error, updating local cache:', error);
    const currentLocal = getLocalTransactions();
    const targetTx = currentLocal.find((t) => String(t.id) === String(txId));
    if (targetTx) {
      targetTx.status = 'cancelled';
      saveLocalTransactions(currentLocal);

      const currentOffers = getLocalOffers();
      const updatedOffers = currentOffers.map((o) => {
        if (o.seller_name === targetTx.seller) {
          const restored = parseFloat(o.remaining_kwh) + (targetTx.energyAmount || 0);
          return { ...o, remaining_kwh: restored };
        }
        return o;
      });
      saveLocalOffers(updatedOffers);

      recordClientAuditLog({
        transaction_id: String(txId),
        actor: targetTx.buyer || 'Consumer',
        action: 'TRANSACTION_CANCELLED',
        transaction_type: 'refund',
        amount: targetTx.price || 0,
        status: 'cancelled',
        description: `Order #${txId} cancelled. Refund of ₹${(targetTx.price || 0).toFixed(2)} processed. Reason: ${reason || 'User cancelled'}.`,
        metadata: targetTx,
      });
    }
    return {
      success: true,
      message: `Transaction #${txId} cancelled successfully. Energy restored and refund initiated.`,
    };
  }
}

export async function fetchUserTransactions(userId = null) {
  try {
    const endpoint = userId && userId !== 'guest' ? `/energy/transactions?userId=${encodeURIComponent(userId)}` : '/energy/transactions';
    const res = await fetchWithAuth(endpoint);
    if (res.transactions && res.transactions.length > 0) {
      const all = res.transactions.map(normalizeTransaction);
      if (userId && userId !== 'all') {
        return all.filter(
          (t) =>
            String(t.buyerId) === String(userId) ||
            String(t.sellerId) === String(userId) ||
            String(t.buyerEmail).toLowerCase() === String(userId).toLowerCase() ||
            String(t.userId) === String(userId)
        );
      }
      return all;
    }
    return getLocalTransactions(userId).map(normalizeTransaction);
  } catch (error) {
    console.warn('Error fetching user transactions, returning local cache:', error);
    return getLocalTransactions(userId).map(normalizeTransaction);
  }
}

export const fetchMarketplaceTransactions = fetchUserTransactions;

export async function fetchEnergySummary(userId = 'guest') {
  let dbSummary = {};
  try {
    const endpoint = userId && userId !== 'guest' ? `/energy/summary?userId=${encodeURIComponent(userId)}` : '/energy/summary';
    const res = await fetchWithAuth(endpoint);
    if (res?.summary) dbSummary = res.summary;
  } catch {}

  const localTxs = getLocalTransactions(userId);
  const totalPurchased = localTxs
    .filter((t) => t.status !== 'cancelled')
    .reduce((acc, t) => acc + (parseFloat(t.energyAmount) || 0), 0);
  const totalSold = localTxs
    .filter((t) => t.status === 'completed')
    .reduce((acc, t) => acc + (parseFloat(t.energyAmount) || 0), 0);

  // Aggregate telemetry from local smart meter and solar inverter stores
  let localConsumed = 0;
  let localSolarGen = 0;

  try {
    const rawReadings =
      localStorage.getItem('hifai_registered_smart_readings') ||
      localStorage.getItem(`hifai_registered_smart_readings_${userId}`);
    if (rawReadings) {
      const parsed = JSON.parse(rawReadings);
      if (Array.isArray(parsed)) {
        localConsumed = parsed.reduce((acc, r) => acc + (parseFloat(r.energyConsumed) || 0), 0);
      }
    }
  } catch {}

  try {
    const rawGen =
      localStorage.getItem('hifai_registered_solar_generation') ||
      localStorage.getItem(`hifai_registered_solar_generation_${userId}`);
    if (rawGen) {
      const parsed = JSON.parse(rawGen);
      if (Array.isArray(parsed)) {
        localSolarGen = parsed.reduce((acc, g) => acc + (parseFloat(g.generatedEnergy) || 0), 0);
      }
    }
  } catch {}

  const finalConsumed = dbSummary.energy_consumed_kwh || localConsumed || (totalPurchased > 0 ? parseFloat((totalPurchased * 0.8).toFixed(1)) : 0);
  const finalSolar = dbSummary.solar_generated_kwh || localSolarGen || 0;
  const baseBattery = dbSummary.battery_stored_kwh || 50.0;
  const finalBattery = Math.max(0, baseBattery + totalPurchased - finalConsumed);

  return {
    solar_generated_kwh: parseFloat(finalSolar.toFixed(1)),
    energy_consumed_kwh: parseFloat(finalConsumed.toFixed(1)),
    battery_stored_kwh: parseFloat(finalBattery.toFixed(1)),
    p2p_energy_sold_kwh: parseFloat((dbSummary.p2p_energy_sold_kwh || totalSold).toFixed(1)),
    p2p_energy_purchased_kwh: parseFloat((dbSummary.p2p_energy_purchased_kwh !== undefined ? dbSummary.p2p_energy_purchased_kwh : totalPurchased).toFixed(1)),
  };
}

/**
 * HD-61: Submit 1-5 star rating and optional review for completed transaction
 */
export async function submitTransactionReview(txId, { rating, review = '' }) {
  try {
    const res = await fetchWithAuth(`/energy/transactions/${txId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
    return res;
  } catch (error) {
    console.error('Error submitting transaction review:', error);
    throw error;
  }
}

/**
 * HD-61: Fetch reviews for a specific transaction
 */
export async function fetchTransactionReviews(txId) {
  try {
    const res = await fetchWithAuth(`/energy/transactions/${txId}/reviews`);
    return res.reviews || [];
  } catch (error) {
    console.warn('Error fetching transaction reviews:', error);
    return [];
  }
}

