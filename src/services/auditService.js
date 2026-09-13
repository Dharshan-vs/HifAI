import { fetchWithAuth } from './apiClient.js';

const LOCAL_AUDIT_KEY = 'hifai_audit_logs';

export const INITIAL_AUDIT_LOGS = [
  {
    id: 1001,
    transaction_id: 'TX-P2P-98101',
    user_id: 'prod-001',
    actor: 'ABC Solar Pro (Producer)',
    action: 'ENERGY_PURCHASE',
    transaction_type: 'purchase',
    amount: 36.0,
    status: 'verified',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    blockchain_hash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    description: 'P2P purchase of 5.0 kWh solar electricity at ₹7.20/kWh. Smart contract payment settled on blockchain.',
    metadata: {
      energy_kwh: 5.0,
      price_per_kwh: 7.2,
      block_number: 1894210,
      gas_used: 21040,
      buyer: 'Household Consumer',
      seller: 'ABC Solar Pro',
      seller_location: 'Block 4, Anna Nagar, Chennai',
    },
  },
  {
    id: 1002,
    transaction_id: 'TX-P2P-98102',
    user_id: 'prod-002',
    actor: 'EcoRoof Community (Producer)',
    action: 'ENERGY_PURCHASE',
    transaction_type: 'purchase',
    amount: 86.4,
    status: 'verified',
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
    blockchain_hash: '0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    description: 'P2P purchase of 12.0 kWh solar electricity at ₹7.20/kWh. Smart contract payment settled on blockchain.',
    metadata: {
      energy_kwh: 12.0,
      price_per_kwh: 7.2,
      block_number: 1893874,
      gas_used: 21450,
      buyer: 'Household Consumer',
      seller: 'EcoRoof Community',
      seller_location: 'Substation Feeder B, Gandhi Road',
    },
  },
  {
    id: 1003,
    transaction_id: 'OFFER-LOCAL-101',
    user_id: 'prod-001',
    actor: 'ABC Solar Pro (Producer)',
    action: 'OFFER_CREATED',
    transaction_type: 'offer_creation',
    amount: 180.0,
    status: 'verified',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
    blockchain_hash: '0x12b5d4a13d8e5792f8ce6b8a2c2199b50b556b60706a14c6cf4a413d719e7829',
    description: 'Created active solar offer for 25.0 kWh at ₹7.20/kWh. Smart contract offer published on ledger.',
    metadata: {
      energy_kwh: 25.0,
      price_per_kwh: 7.2,
      block_number: 1893500,
      energy_source: 'Solar',
      seller_location: 'Block 4, Anna Nagar, Chennai',
    },
  },
  {
    id: 1004,
    transaction_id: 'TX-P2P-98089',
    user_id: 'prod-003',
    actor: 'Coastal Solar Microgrid (Producer)',
    action: 'TRANSACTION_SETTLED',
    transaction_type: 'sale',
    amount: 165.0,
    status: 'verified',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    blockchain_hash: '0x8a920b784dfc29486c4a631f290d164d306cb65e903b609c2a11b6951230c144',
    description: 'Physical microgrid transmission of 30.0 kWh verified by smart meters. Escrow funds transferred.',
    metadata: {
      energy_kwh: 30.0,
      price_per_kwh: 5.5,
      block_number: 1892110,
      buyer: 'Coastal Green Resident',
      seller: 'Coastal Solar Microgrid',
    },
  },
  {
    id: 1005,
    transaction_id: 'TX-CAN-97912',
    user_id: 'prod-004',
    actor: 'Canal Solar Farm (Producer)',
    action: 'TRANSACTION_CANCELLED',
    transaction_type: 'refund',
    amount: 40.0,
    status: 'cancelled',
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    blockchain_hash: '0xd5a6390a8a7f45b891823d0473a258810b106497f9d86b7720970a2a12bf9f09',
    description: 'Order cancelled by mutual agreement before power dispatch. Wallet funds refunded ₹40.00.',
    metadata: {
      energy_kwh: 5.0,
      refund_amount: 40.0,
      block_number: 1890450,
      reason: 'Transmission feeder maintenance',
    },
  },
  {
    id: 1006,
    transaction_id: 'TX-SEC-97840',
    user_id: 'prod-005',
    actor: 'Smart Contract Engine',
    action: 'SMART_METER_VERIFY',
    transaction_type: 'verification',
    amount: 0.0,
    status: 'verified',
    timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
    blockchain_hash: '0x3c99f18a209b5523a1cf5522e8412e69730cf1923057e930ba0928bb18d407ff',
    description: 'Cryptographic IoT signature verified for smart meter node SM-98210 telemetry stream.',
    metadata: {
      meter_sn: 'SE-98210-SM1',
      voltage: 231.5,
      frequency: 50.0,
      block_number: 1889800,
    },
  },
];

export function getLocalAuditLogs() {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveLocalAuditLogs(logs) {
  try {
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save local audit logs:', e);
  }
}

export function recordClientAuditLog(logData) {
  const current = getLocalAuditLogs();
  const newLog = {
    id: current.length > 0 ? Math.max(...current.map((l) => l.id || 0)) + 1 : 1001,
    transaction_id: logData.transaction_id || `TX-${Date.now()}`,
    user_id: logData.user_id || 'user-current',
    actor: logData.actor || 'YUGA User',
    action: logData.action || 'TRANSACTION_EVENT',
    transaction_type: logData.transaction_type || 'purchase',
    amount: parseFloat(logData.amount || 0),
    status: logData.status || 'verified',
    timestamp: new Date().toISOString(),
    blockchain_hash:
      logData.blockchain_hash ||
      `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    description: logData.description || '',
    metadata: logData.metadata || {},
  };

  const updated = [newLog, ...current];
  saveLocalAuditLogs(updated);

  // Background sync attempt with server if connected as admin
  fetchWithAuth('/audit/logs', {
    method: 'POST',
    body: JSON.stringify(newLog),
  }).catch(() => {
    // offline resilient
  });

  return newLog;
}

/**
 * HD-37: Fetch audit logs with search, filters and sorting
 */
export async function fetchAuditLogs(filters = {}) {
  try {
    const qParams = new URLSearchParams();
    if (filters.search) qParams.append('search', filters.search);
    if (filters.transaction_id) qParams.append('transaction_id', filters.transaction_id);
    if (filters.transaction_type && filters.transaction_type !== 'all') {
      qParams.append('transaction_type', filters.transaction_type);
    }
    if (filters.status && filters.status !== 'all') {
      qParams.append('status', filters.status);
    }
    if (filters.start_date) qParams.append('start_date', filters.start_date);
    if (filters.end_date) qParams.append('end_date', filters.end_date);

    const queryStr = qParams.toString() ? `?${qParams.toString()}` : '';
    const res = await fetchWithAuth(`/audit/logs${queryStr}`, {
      headers: {
        'x-demo-role': 'admin',
      },
    });

    if (res.logs) {
      return res.logs;
    }
    return getLocalFilteredAuditLogs(filters);
  } catch (err) {
    console.warn('Backend audit API fallback to local store:', err);
    return getLocalFilteredAuditLogs(filters);
  }
}

/**
 * Filter local storage audit logs for offline/resilient mode
 */
function getLocalFilteredAuditLogs(filters = {}) {
  let logs = getLocalAuditLogs();

  if (filters.transaction_id && filters.transaction_id.trim()) {
    const term = filters.transaction_id.trim().toLowerCase();
    logs = logs.filter((l) => (l.transaction_id || '').toLowerCase().includes(term));
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    logs = logs.filter(
      (l) =>
        (l.transaction_id && l.transaction_id.toLowerCase().includes(term)) ||
        (l.actor && l.actor.toLowerCase().includes(term)) ||
        (l.action && l.action.toLowerCase().includes(term)) ||
        (l.blockchain_hash && l.blockchain_hash.toLowerCase().includes(term)) ||
        (l.description && l.description.toLowerCase().includes(term)) ||
        String(l.id).includes(term)
    );
  }

  if (filters.transaction_type && filters.transaction_type !== 'all') {
    const type = filters.transaction_type.toLowerCase();
    logs = logs.filter((l) => (l.transaction_type || '').toLowerCase() === type);
  }

  if (filters.status && filters.status !== 'all') {
    const st = filters.status.toLowerCase();
    logs = logs.filter((l) => (l.status || '').toLowerCase() === st);
  }

  if (filters.start_date) {
    const start = new Date(filters.start_date).getTime();
    logs = logs.filter((l) => new Date(l.timestamp).getTime() >= start);
  }

  if (filters.end_date) {
    const end = new Date(filters.end_date).getTime();
    logs = logs.filter((l) => new Date(l.timestamp).getTime() <= end);
  }

  return logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
}

/**
 * HD-37: Fetch audit summary counts
 */
export async function fetchAuditSummary() {
  try {
    const res = await fetchWithAuth('/audit/summary', {
      headers: {
        'x-demo-role': 'admin',
      },
    });
    if (res.summary) {
      return res.summary;
    }
  } catch (err) {
    console.warn('Audit summary endpoint offline, computing from local store:', err);
  }

  const logs = getLocalAuditLogs();
  const totalRecords = logs.length;
  const uniqueTxs = new Set(logs.map((l) => l.transaction_id)).size;
  const verified = logs.filter((l) => l.status === 'verified' || l.status === 'completed').length;
  const failed = logs.filter((l) => l.status === 'failed' || l.status === 'tampered').length;

  return {
    total_transactions: uniqueTxs,
    verified_transactions: verified,
    failed_tampered_transactions: failed,
    total_audit_records: totalRecords,
  };
}

/**
 * HD-37: Fetch single audit log detail
 */
export async function fetchAuditLogById(id) {
  try {
    const res = await fetchWithAuth(`/audit/logs/${id}`, {
      headers: {
        'x-demo-role': 'admin',
      },
    });
    if (res.log) return res.log;
  } catch (err) {
    console.warn('Failed to fetch single audit log from server, checking local:', err);
  }

  const logs = getLocalAuditLogs();
  return logs.find((l) => String(l.id) === String(id)) || null;
}
