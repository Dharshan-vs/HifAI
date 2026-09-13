import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function setup() {
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '1234';

  console.log(`Connecting to PostgreSQL at ${host}:${port} as user '${user}'...`);

  // Connect to default maintenance DB 'postgres'
  const rootPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl: false,
  });

  try {
    const client = await rootPool.connect();
    console.log('Connected to PostgreSQL root database!');

    // Check if database yuga_hifai exists
    const checkDb = await client.query("SELECT 1 FROM pg_database WHERE datname = 'yuga_hifai'");
    if (checkDb.rows.length === 0) {
      console.log("Database 'yuga_hifai' does not exist. Creating database 'yuga_hifai'...");
      await client.query('CREATE DATABASE yuga_hifai');
      console.log("Database 'yuga_hifai' created successfully!");
    } else {
      console.log("Database 'yuga_hifai' already exists.");
    }
    client.release();
    await rootPool.end();

    // Now connect to yuga_hifai database and create tables
    const appPool = new Pool({
      host,
      port,
      user,
      password,
      database: 'yuga_hifai',
      ssl: false,
    });

    const appClient = await appPool.connect();
    console.log("Connected to 'yuga_hifai' database!");

    await appClient.query(`
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
        available_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        available_until TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '12 hours'),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

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
    `);

    console.log('✅ ALL POSTGRESQL TABLES CREATED SUCCESSFULLY!');
    appClient.release();
    await appPool.end();
  } catch (err) {
    console.error('❌ Setup error:', err.message);
  }
}

setup();
