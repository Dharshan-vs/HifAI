import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Environment variables or defaults
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'yuga_hifai',
      ssl: false,
    };

export const pool = new Pool(poolConfig);

// In-memory store fallback if PostgreSQL database connection is unavailable during dev
const memoryStore = {
  users: [
    {
      id: 1,
      firebase_uid: 'prod-001',
      name: 'ABC Solar Pro',
      email: 'abc.solar@yuga.energy',
      role: 'producer',
      profile_image: '',
    },
    {
      id: 2,
      firebase_uid: 'prod-002',
      name: 'EcoRoof Community',
      email: 'ecoroof@yuga.energy',
      role: 'producer',
      profile_image: '',
    },
    {
      id: 3,
      firebase_uid: 'prod-003',
      name: 'Coastal Solar Microgrid',
      email: 'solar-coastal@yuga.energy',
      role: 'producer',
      profile_image: '',
    },
    {
      id: 4,
      firebase_uid: 'prod-004',
      name: 'Canal Solar Farm',
      email: 'solar-canal@yuga.energy',
      role: 'producer',
      profile_image: '',
    },
  ],
  energy_offers: [
    {
      id: 101,
      seller_id: 1,
      seller_name: 'ABC Solar Pro',
      energy_kwh: 25.0,
      remaining_kwh: 25.0,
      price_per_kwh: 7.20,
      energy_source: 'Solar',
      seller_location: 'Block 4, Anna Nagar, Chennai',
      seller_city: 'Chennai',
      lat: 13.0827,
      lon: 80.2707,
      distance_value: 0.4,
      distance_km: '0.4 km',
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 102,
      seller_id: 2,
      seller_name: 'EcoRoof Community',
      energy_kwh: 35.0,
      remaining_kwh: 35.0,
      price_per_kwh: 6.80,
      energy_source: 'Solar',
      seller_location: 'Substation Feeder B, Gandhi Road',
      seller_city: 'Chennai',
      lat: 13.0850,
      lon: 80.2730,
      distance_value: 0.8,
      distance_km: '0.8 km',
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 103,
      seller_id: 3,
      seller_name: 'Coastal Solar Microgrid',
      energy_kwh: 50.0,
      remaining_kwh: 50.0,
      price_per_kwh: 5.50,
      energy_source: 'Solar',
      seller_location: 'East Coast Solar Array 1',
      seller_city: 'Chennai',
      lat: 13.0880,
      lon: 80.2750,
      distance_value: 0.9,
      distance_km: '0.9 km',
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 104,
      seller_id: 4,
      seller_name: 'Canal Solar Farm',
      energy_kwh: 15.0,
      remaining_kwh: 15.0,
      price_per_kwh: 8.00,
      energy_source: 'Solar',
      seller_location: 'Buckingham Solar Station',
      seller_city: 'Chennai',
      lat: 13.0810,
      lon: 80.2680,
      distance_value: 0.7,
      distance_km: '0.7 km',
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 10800000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 105,
      seller_id: 1,
      seller_name: 'ABC Solar Rooftop',
      energy_kwh: 12.5,
      remaining_kwh: 12.5,
      price_per_kwh: 7.20,
      energy_source: 'Solar',
      seller_location: 'Rooftop Array 2, Anna Nagar',
      seller_city: 'Chennai',
      lat: 13.0835,
      lon: 80.2715,
      distance_value: 0.6,
      distance_km: '0.6 km',
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 14400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 106,
      seller_id: 2,
      seller_name: 'Outer Grid Station C',
      energy_kwh: 18.5,
      remaining_kwh: 18.5,
      price_per_kwh: 9.20,
      energy_source: 'Solar',
      seller_location: 'Outer District Substation 9',
      seller_city: 'Outer District',
      lat: 13.1100,
      lon: 80.3100,
      distance_value: 3.4,
      distance_km: '3.4 km',
      available_from: new Date().toISOString(),
      available_until: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(Date.now() - 18000000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 107,
      seller_id: 1,
      seller_name: 'Sold Out Solar Array',
      energy_kwh: 20.0,
      remaining_kwh: 0,
      price_per_kwh: 6.50,
      energy_source: 'Solar',
      seller_location: 'Depleted Substation Zone D',
      seller_city: 'Chennai',
      lat: 13.0890,
      lon: 80.2760,
      distance_value: 0.5,
      distance_km: '0.5 km',
      available_from: new Date(Date.now() - 86400000).toISOString(),
      available_until: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  energy_transactions: [],
  energy_readings: [],
  transaction_reviews: [],
  audit_logs: [
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
  ],
  userIdCounter: 10,
  offerIdCounter: 200,
  transactionIdCounter: 1,
  reviewIdCounter: 1,
  auditIdCounter: 1006,
};

let useFallback = false;

export async function initDb() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(128) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        profile_image TEXT,
        role VARCHAR(50) DEFAULT 'consumer',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS energy_offers (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        energy_kwh NUMERIC(10, 2) NOT NULL,
        remaining_kwh NUMERIC(10, 2) NOT NULL,
        price_per_kwh NUMERIC(10, 2) NOT NULL,
        energy_source VARCHAR(100) DEFAULT 'Solar',
        seller_location TEXT,
        seller_city VARCHAR(100),
        lat NUMERIC(9, 6) DEFAULT 13.0827,
        lon NUMERIC(9, 6) DEFAULT 80.2707,
        available_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        available_until TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '12 hours'),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE energy_offers ADD COLUMN IF NOT EXISTS seller_location TEXT;
      ALTER TABLE energy_offers ADD COLUMN IF NOT EXISTS seller_city VARCHAR(100);
      ALTER TABLE energy_offers ADD COLUMN IF NOT EXISTS lat NUMERIC(9, 6) DEFAULT 13.0827;
      ALTER TABLE energy_offers ADD COLUMN IF NOT EXISTS lon NUMERIC(9, 6) DEFAULT 80.2707;

      CREATE TABLE IF NOT EXISTS energy_transactions (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        energy_offer_id INTEGER REFERENCES energy_offers(id) ON DELETE CASCADE,
        energy_kwh NUMERIC(10, 2) NOT NULL,
        price_per_kwh NUMERIC(10, 2) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS energy_readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        solar_generated_kwh NUMERIC(10, 2) DEFAULT 0,
        energy_consumed_kwh NUMERIC(10, 2) DEFAULT 0,
        battery_stored_kwh NUMERIC(10, 2) DEFAULT 0,
        battery_discharged_kwh NUMERIC(10, 2) DEFAULT 0,
        reading_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transaction_reviews (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES energy_transactions(id) ON DELETE CASCADE,
        reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reviewee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_tx_reviewer UNIQUE (transaction_id, reviewer_id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(128),
        actor VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        amount NUMERIC(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'verified',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        blockchain_hash VARCHAR(128) NOT NULL,
        description TEXT,
        metadata JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_audit_tx_id ON audit_logs(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
      CREATE INDEX IF NOT EXISTS idx_audit_tx_type ON audit_logs(transaction_type);
    `);

    // Seed default users if empty
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO users (id, firebase_uid, name, email, role) VALUES
        (1, 'prod-001', 'ABC Solar Pro', 'abc.solar@yuga.energy', 'producer'),
        (2, 'prod-002', 'EcoRoof Community', 'ecoroof@yuga.energy', 'producer'),
        (3, 'prod-003', 'Coastal Solar Microgrid', 'solar-coastal@yuga.energy', 'producer'),
        (4, 'prod-004', 'Canal Solar Farm', 'solar-canal@yuga.energy', 'producer')
        ON CONFLICT (id) DO NOTHING;
      `);
      await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);
    }

    // Seed default offers if empty
    const offerCount = await client.query('SELECT COUNT(*) FROM energy_offers');
    if (parseInt(offerCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO energy_offers (seller_id, energy_kwh, remaining_kwh, price_per_kwh, energy_source, seller_location, seller_city, lat, lon, status) VALUES
        (1, 25.0, 25.0, 7.20, 'Solar', 'Block 4, Anna Nagar, Chennai', 'Chennai', 13.0827, 80.2707, 'active'),
        (2, 35.0, 35.0, 6.80, 'Solar', 'Substation Feeder B, Gandhi Road', 'Chennai', 13.0850, 80.2730, 'active'),
        (3, 50.0, 50.0, 5.50, 'Solar', 'East Coast Solar Array 1', 'Chennai', 13.0880, 80.2750, 'active'),
        (4, 15.0, 15.0, 8.00, 'Solar', 'Buckingham Solar Station', 'Chennai', 13.0810, 80.2680, 'active'),
        (1, 12.5, 12.5, 7.20, 'Solar', 'Rooftop Array 2, Anna Nagar', 'Chennai', 13.0835, 80.2715, 'active')
      `);
    }

    // Seed default blockchain audit logs if empty
    const auditCount = await client.query('SELECT COUNT(*) FROM audit_logs');
    if (parseInt(auditCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO audit_logs (transaction_id, user_id, actor, action, transaction_type, amount, status, blockchain_hash, description, metadata) VALUES
        ('TX-P2P-98101', 'prod-001', 'ABC Solar Pro (Producer)', 'ENERGY_PURCHASE', 'purchase', 36.00, 'verified', '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', 'P2P purchase of 5.0 kWh solar electricity at ₹7.20/kWh. Smart contract payment settled on blockchain.', '{"energy_kwh": 5.0, "price_per_kwh": 7.2, "block_number": 1894210}'),
        ('TX-P2P-98102', 'prod-002', 'EcoRoof Community (Producer)', 'ENERGY_PURCHASE', 'purchase', 86.40, 'verified', '0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', 'P2P purchase of 12.0 kWh solar electricity at ₹7.20/kWh. Smart contract payment settled on blockchain.', '{"energy_kwh": 12.0, "price_per_kwh": 7.2, "block_number": 1893874}'),
        ('OFFER-LOCAL-101', 'prod-001', 'ABC Solar Pro (Producer)', 'OFFER_CREATED', 'offer_creation', 180.00, 'verified', '0x12b5d4a13d8e5792f8ce6b8a2c2199b50b556b60706a14c6cf4a413d719e7829', 'Created active solar offer for 25.0 kWh at ₹7.20/kWh. Smart contract offer published on ledger.', '{"energy_kwh": 25.0, "price_per_kwh": 7.2, "block_number": 1893500}')
      `);
    }

    client.release();
    console.log('PostgreSQL database tables initialized & seeded successfully.');
  } catch (err) {
    console.log('📦 Database: Active in Development Mode (Resilient In-Memory Data Store)', err.message);
    useFallback = true;
  }
}

export async function query(text, params = []) {
  if (!useFallback) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('PostgreSQL Query Error:', err.message);
      throw err;
    }
  }

  // Fallback handler for queries when PostgreSQL service is not actively running
  return handleFallbackQuery(text, params);
}

function handleFallbackQuery(text, params) {
  const sql = text.trim();
  const normalized = sql.replace(/\s+/g, ' ');

  // INSERT / UPDATE users
  if (normalized.includes('INSERT INTO users')) {
    const firebase_uid = params[0];
    const email = params[1] || '';
    const name = params[2] || '';
    const phone = params[3] || '';
    const profile_image = params[4] || '';
    const role = params[5] || 'consumer';

    let existing = memoryStore.users.find((u) => u.firebase_uid === firebase_uid);
    if (existing) {
      existing.name = name || existing.name;
      existing.email = email || existing.email;
      existing.phone = phone || existing.phone;
      existing.profile_image = profile_image || existing.profile_image;
      existing.role = role || existing.role;
      existing.updated_at = new Date().toISOString();
      return { rows: [existing] };
    }

    const newUser = {
      id: memoryStore.userIdCounter++,
      firebase_uid,
      email,
      name: name || 'YUGA User',
      phone,
      profile_image,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);
    return { rows: [newUser] };
  }

  // SELECT FROM users WHERE firebase_uid
  if (normalized.includes('SELECT') && normalized.includes('FROM users') && normalized.includes('firebase_uid =')) {
    const firebase_uid = params[0];
    const found = memoryStore.users.find((u) => u.firebase_uid === firebase_uid);
    return { rows: found ? [found] : [] };
  }

  // SELECT FROM users WHERE id
  if (normalized.includes('SELECT') && normalized.includes('FROM users') && normalized.includes('id =')) {
    const id = parseInt(params[0], 10);
    const found = memoryStore.users.find((u) => u.id === id);
    return { rows: found ? [found] : [] };
  }

  // UPDATE users (including wallet balance updates)
  if (normalized.includes('UPDATE users')) {
    const id = parseInt(params[params.length - 1], 10);
    const user = memoryStore.users.find((u) => u.id === id);
    if (user) {
      if (normalized.includes('wallet_balance')) {
        const delta = parseFloat(params[0]);
        if (normalized.includes('COALESCE(wallet_balance, 0) +')) {
          user.wallet_balance = (user.wallet_balance || 0) + delta;
        } else if (normalized.includes('GREATEST(COALESCE(wallet_balance, 0) -')) {
          user.wallet_balance = Math.max((user.wallet_balance || 0) - delta, 0);
        }
      } else {
        if (params[0]) user.name = params[0];
        if (params[1]) user.phone = params[1];
        if (params[2]) user.profile_image = params[2];
        if (params[3]) user.role = params[3];
      }
      user.updated_at = new Date().toISOString();
      return { rows: [user] };
    }
    return { rows: [] };
  }

  // INSERT INTO energy_offers
  if (normalized.includes('INSERT INTO energy_offers')) {
    const seller_id = parseInt(params[0], 10);
    const energy_kwh = parseFloat(params[1]);
    const price_per_kwh = parseFloat(params[2]);
    const energy_source = params[3] || 'Solar';
    const seller_location = params[4] || 'Local Microgrid Feeder A';
    const seller_city = params[5] || 'Local Area';
    const lat = parseFloat(params[6]) || 13.0827;
    const lon = parseFloat(params[7]) || 80.2707;
    const available_from = params[8] || new Date().toISOString();
    const available_until = params[9] || new Date(Date.now() + 12 * 3600 * 1000).toISOString();

    const offer = {
      id: memoryStore.offerIdCounter++,
      seller_id,
      energy_kwh,
      remaining_kwh: energy_kwh,
      price_per_kwh,
      energy_source,
      seller_location,
      seller_city,
      lat,
      lon,
      available_from,
      available_until,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.energy_offers.push(offer);
    return { rows: [offer] };
  }

  // Helper to match offer by numeric or string ID (e.g. 101, '101', 'OFFER-LOCAL-101')
  const matchOfferId = (o, targetId) => {
    if (!targetId || !o) return false;
    const strO = String(o.id).toLowerCase();
    const strT = String(targetId).toLowerCase();
    const numO = strO.replace(/\D/g, '');
    const numT = strT.replace(/\D/g, '');
    return strO === strT || (numO && numT && numO === numT);
  };

  // UPDATE energy_offers
  if (normalized.includes('UPDATE energy_offers')) {
    const rawId = params[params.length - 1];
    const offer = memoryStore.energy_offers.find((o) => matchOfferId(o, rawId));
    if (offer) {
      if (normalized.includes("status = 'cancelled'")) {
        offer.status = 'cancelled';
        offer.remaining_kwh = 0;
      } else if (normalized.includes('remaining_kwh = remaining_kwh +')) {
        const addedKwh = parseFloat(params[0]);
        offer.remaining_kwh = parseFloat((offer.remaining_kwh + addedKwh).toFixed(2));
        offer.status = 'active';
      } else {
        offer.remaining_kwh = Math.max(0, parseFloat(params[0]));
        offer.status = offer.remaining_kwh <= 0 ? 'completed' : (params[1] || offer.status);
      }
      offer.updated_at = new Date().toISOString();
      return { rows: [offer] };
    }
    return { rows: [] };
  }

  // DELETE FROM energy_offers
  if (normalized.includes('DELETE FROM energy_offers')) {
    const rawId = params[0];
    const idx = memoryStore.energy_offers.findIndex((o) => matchOfferId(o, rawId));
    if (idx !== -1) {
      const removed = memoryStore.energy_offers.splice(idx, 1);
      return { rows: removed };
    }
    return { rows: [] };
  }

  // SELECT FROM energy_offers (active list joined with seller)
  if (normalized.includes('FROM energy_offers')) {
    if (normalized.includes('WHERE id = $1') || normalized.includes('WHERE o.id = $1')) {
      const rawId = params[0];
      const found = memoryStore.energy_offers.find((o) => matchOfferId(o, rawId));
      return { rows: found ? [found] : [] };
    }
    let activeOffers = memoryStore.energy_offers
      .filter((o) => o.remaining_kwh > 0 && o.status === 'active')
      .map((o) => {
        const seller = memoryStore.users.find((u) => u.id === o.seller_id) || {};
        return {
          ...o,
          seller_name: seller.name || o.seller_name || 'Community Energy Producer',
          seller_role: seller.role || o.seller_role || 'producer',
          seller_image: seller.profile_image || '',
        };
      });

    // Apply any query filters if present in params
    if (params && params.length > 0) {
      for (const p of params) {
        if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
          const term = p.slice(1, -1).toLowerCase();
          activeOffers = activeOffers.filter(
            (o) =>
              (o.seller_name && o.seller_name.toLowerCase().includes(term)) ||
              (o.energy_source && o.energy_source.toLowerCase().includes(term)) ||
              (o.seller_location && o.seller_location.toLowerCase().includes(term)) ||
              (o.seller_city && o.seller_city.toLowerCase().includes(term)) ||
              String(o.id).includes(term)
          );
        } else if (typeof p === 'string' && ['solar', 'wind', 'hydro', 'biomass'].includes(p.toLowerCase())) {
          activeOffers = activeOffers.filter((o) => (o.energy_source || '').toLowerCase() === p.toLowerCase());
        }
      }
    }

    return { rows: activeOffers };
  }

  // INSERT INTO energy_transactions
  if (normalized.includes('INSERT INTO energy_transactions')) {
    const seller_id = parseInt(params[0], 10);
    const buyer_id = parseInt(params[1], 10);
    const energy_offer_id = parseInt(params[2], 10);
    const energy_kwh = parseFloat(params[3]);
    const price_per_kwh = parseFloat(params[4]);
    const total_amount = parseFloat(params[5]);

    // deduct remaining_kwh from offer
    const offer = memoryStore.energy_offers.find((o) => o.id === energy_offer_id);
    if (offer) {
      offer.remaining_kwh = Math.max(0, offer.remaining_kwh - energy_kwh);
      if (offer.remaining_kwh <= 0) {
        offer.status = 'completed';
      }
      offer.updated_at = new Date().toISOString();
    }

    const tx = {
      id: memoryStore.transactionIdCounter++,
      seller_id,
      buyer_id,
      energy_offer_id,
      energy_kwh,
      price_per_kwh,
      total_amount,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    memoryStore.energy_transactions.push(tx);
    return { rows: [tx] };
  }

  // UPDATE energy_transactions
  if (normalized.includes('UPDATE energy_transactions')) {
    let newStatus = params[0];
    let txId = parseInt(params[1], 10);
    if (normalized.includes("status = 'cancelled'")) {
      newStatus = 'cancelled';
      txId = parseInt(params[0], 10);
    }
    const tx = memoryStore.energy_transactions.find((t) => t.id === txId);
    if (tx) {
      tx.status = newStatus;
      tx.updated_at = new Date().toISOString();
      return { rows: [tx] };
    }
    return { rows: [] };
  }

  // SELECT FROM energy_transactions
  if (normalized.includes('FROM energy_transactions')) {
    if (normalized.includes('WHERE t.id = $1') || normalized.includes('WHERE id = $1')) {
      const txId = parseInt(params[0], 10);
      const tx = memoryStore.energy_transactions.find((t) => t.id === txId);
      if (tx) {
        const seller = memoryStore.users.find((u) => u.id === tx.seller_id) || {};
        const buyer = memoryStore.users.find((u) => u.id === tx.buyer_id) || {};
        const offer = memoryStore.energy_offers.find((o) => o.id === tx.energy_offer_id) || {};
        return {
          rows: [
            {
              ...tx,
              seller_name: seller.name || 'Producer',
              buyer_name: buyer.name || 'Buyer',
              energy_source: offer.energy_source || 'Solar',
              seller_location: offer.seller_location || 'Local Microgrid',
              seller_city: offer.seller_city || 'Chennai',
            },
          ],
        };
      }
      return { rows: [] };
    }

    const reqUser = params[0];
    const userTxs = memoryStore.energy_transactions
      .filter((t) => {
        if (!reqUser) return true;
        return (
          t.buyer_id == reqUser ||
          t.seller_id == reqUser ||
          String(t.buyer_id) === String(reqUser) ||
          String(t.seller_id) === String(reqUser)
        );
      })
      .map((t) => {
        const seller = memoryStore.users.find((u) => u.id == t.seller_id || String(u.id) === String(t.seller_id)) || {};
        const buyer = memoryStore.users.find((u) => u.id == t.buyer_id || String(u.id) === String(t.buyer_id)) || {};
        const offer = memoryStore.energy_offers.find((o) => o.id == t.energy_offer_id || String(o.id) === String(t.energy_offer_id)) || {};
        return {
          ...t,
          seller_name: seller.name || 'Producer',
          buyer_name: buyer.name || 'Buyer',
          energy_source: offer.energy_source || 'Solar',
          seller_location: offer.seller_location || 'Local Microgrid',
          seller_city: offer.seller_city || 'Chennai',
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { rows: userTxs };
  }

  // SELECT COALESCE(SUM(energy_kwh), 0)
  if (normalized.includes('SUM(energy_kwh)')) {
    const isSeller = normalized.includes('seller_id =');
    const userId = params[0];
    const userTxs = (memoryStore.energy_transactions || []).filter((t) => {
      const matchUser = isSeller
        ? (t.seller_id == userId || String(t.seller_id) === String(userId))
        : (t.buyer_id == userId || String(t.buyer_id) === String(userId));
      return matchUser && t.status === 'completed';
    });
    const sum = userTxs.reduce((acc, t) => acc + (parseFloat(t.energy_kwh) || 0), 0);
    return { rows: [{ total_sold: sum, total_purchased: sum }] };
  }

  // INSERT INTO energy_readings
  if (normalized.includes('INSERT INTO energy_readings')) {
    const user_id = params[0];
    const energy_consumed_kwh = parseFloat(params[1]) || 0;
    const reading = {
      id: (memoryStore.energy_readings || []).length + 1,
      user_id,
      solar_generated_kwh: 0,
      energy_consumed_kwh,
      battery_stored_kwh: 0,
      battery_discharged_kwh: 0,
      reading_time: new Date().toISOString(),
    };
    if (!memoryStore.energy_readings) memoryStore.energy_readings = [];
    memoryStore.energy_readings.push(reading);
    return { rows: [reading] };
  }

  // SELECT FROM energy_readings
  if (normalized.includes('FROM energy_readings')) {
    const userId = params[0];
    const userReadings = (memoryStore.energy_readings || []).filter(
      (r) => r.user_id == userId || String(r.user_id) === String(userId)
    );
    return { rows: userReadings.slice(-1) };
  }

  // INSERT INTO transaction_reviews
  if (normalized.includes('INSERT INTO transaction_reviews')) {
    const txId = parseInt(params[0], 10);
    const reviewerId = params[1];
    const revieweeId = params[2];
    const rating = parseInt(params[3], 10);
    const reviewText = params[4] || '';

    // Check unique constraint
    const existing = (memoryStore.transaction_reviews || []).find(
      (r) => r.transaction_id === txId && (r.reviewer_id === reviewerId || String(r.reviewer_id) === String(reviewerId))
    );
    if (existing) {
      const err = new Error('duplicate key value violates unique constraint "unique_tx_reviewer"');
      err.code = '23505';
      throw err;
    }

    const newReview = {
      id: memoryStore.reviewIdCounter++,
      transaction_id: txId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      review: reviewText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!memoryStore.transaction_reviews) memoryStore.transaction_reviews = [];
    memoryStore.transaction_reviews.push(newReview);
    return { rows: [newReview] };
  }

  // SELECT FROM transaction_reviews
  if (normalized.includes('FROM transaction_reviews')) {
    const reviews = memoryStore.transaction_reviews || [];
    if (normalized.includes('transaction_id = $1 AND reviewer_id = $2')) {
      const txId = parseInt(params[0], 10);
      const reviewerId = params[1];
      const match = reviews.filter(
        (r) => r.transaction_id === txId && (r.reviewer_id === reviewerId || String(r.reviewer_id) === String(reviewerId))
      );
      return { rows: match };
    }

    if (normalized.includes('transaction_id = $1') || normalized.includes('r.transaction_id = $1')) {
      const txId = parseInt(params[0], 10);
      const matched = reviews
        .filter((r) => r.transaction_id === txId)
        .map((r) => {
          const reviewer = memoryStore.users.find((u) => u.id === r.reviewer_id || String(u.id) === String(r.reviewer_id)) || {};
          const reviewee = memoryStore.users.find((u) => u.id === r.reviewee_id || String(u.id) === String(r.reviewee_id)) || {};
          return {
            ...r,
            reviewer_name: reviewer.name || 'User',
            reviewee_name: reviewee.name || 'User',
          };
        })
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return { rows: matched };
    }

    return { rows: reviews };
  }

  // INSERT INTO audit_logs
  if (normalized.includes('INSERT INTO audit_logs')) {
    const transaction_id = params[0] || `TX-${Date.now()}`;
    const user_id = params[1] || null;
    const actor = params[2] || 'System Administrator';
    const action = params[3] || 'ENERGY_TRANSACTION';
    const transaction_type = params[4] || 'purchase';
    const amount = parseFloat(params[5] || 0);
    const status = params[6] || 'verified';
    const blockchain_hash = params[7] || `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;
    const description = params[8] || '';
    let metadata = {};
    try {
      metadata = typeof params[9] === 'string' ? JSON.parse(params[9] || '{}') : (params[9] || {});
    } catch {
      metadata = {};
    }

    const newLog = {
      id: memoryStore.auditIdCounter++,
      transaction_id,
      user_id,
      actor,
      action,
      transaction_type,
      amount,
      status,
      blockchain_hash,
      description,
      metadata,
      timestamp: new Date().toISOString(),
    };

    if (!memoryStore.audit_logs) memoryStore.audit_logs = [];
    memoryStore.audit_logs.unshift(newLog);
    return { rows: [newLog] };
  }

  // SELECT FROM audit_logs
  if (normalized.includes('FROM audit_logs')) {
    const logs = memoryStore.audit_logs || [];

    // Summary counts
    if (normalized.includes('COUNT(')) {
      const total = logs.length;
      const verified = logs.filter((l) => l.status === 'verified' || l.status === 'completed').length;
      const failed = logs.filter((l) => l.status === 'failed' || l.status === 'tampered').length;
      const uniqueTxs = new Set(logs.map((l) => l.transaction_id)).size;
      return {
        rows: [
          {
            total_records: total,
            total_transactions: uniqueTxs,
            verified_transactions: verified,
            failed_transactions: failed,
          },
        ],
      };
    }

    // By ID
    if (normalized.includes('WHERE id = $1') || normalized.includes('WHERE a.id = $1')) {
      const id = parseInt(params[0], 10);
      const found = logs.find((l) => l.id === id);
      return { rows: found ? [found] : [] };
    }

    // By Transaction ID
    if (normalized.includes('WHERE transaction_id = $1') || normalized.includes('WHERE a.transaction_id = $1')) {
      const txId = String(params[0]);
      const found = logs.filter((l) => String(l.transaction_id) === txId);
      return { rows: found };
    }

    // Filtered list
    let filtered = [...logs];

    if (params && params.length > 0) {
      for (const p of params) {
        if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
          const term = p.slice(1, -1).toLowerCase();
          filtered = filtered.filter(
            (l) =>
              (l.transaction_id && l.transaction_id.toLowerCase().includes(term)) ||
              (l.actor && l.actor.toLowerCase().includes(term)) ||
              (l.action && l.action.toLowerCase().includes(term)) ||
              (l.blockchain_hash && l.blockchain_hash.toLowerCase().includes(term)) ||
              (l.description && l.description.toLowerCase().includes(term)) ||
              String(l.id).includes(term)
          );
        } else if (typeof p === 'string' && ['verified', 'completed', 'pending', 'cancelled', 'failed', 'tampered'].includes(p.toLowerCase())) {
          filtered = filtered.filter((l) => (l.status || '').toLowerCase() === p.toLowerCase());
        } else if (typeof p === 'string' && ['purchase', 'sale', 'offer_creation', 'status_change', 'refund', 'settlement'].includes(p.toLowerCase())) {
          filtered = filtered.filter((l) => (l.transaction_type || '').toLowerCase() === p.toLowerCase());
        }
      }
    }

    filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return { rows: filtered };
  }

  return { rows: [] };
}
