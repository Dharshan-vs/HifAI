import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function seedData() {
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '1234';
  const database = process.env.PGDATABASE || 'yuga_hifai';

  console.log(`Connecting to PostgreSQL database '${database}'...`);

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    ssl: false,
  });

  try {
    const client = await pool.connect();
    console.log(`Connected to '${database}' database successfully.`);

    // 1. Insert 3 Dummy Users
    console.log('Inserting 3 dummy users into PostgreSQL users table...');
    const user1Res = await client.query(`
      INSERT INTO users (firebase_uid, name, email, phone, role, profile_image)
      VALUES ('uid_producer_001', 'GreenRooftop Solar Array', 'producer1@yuga-solar.com', '+919876543210', 'producer', 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=80')
      ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name
      RETURNING *;
    `);

    const user2Res = await client.query(`
      INSERT INTO users (firebase_uid, name, email, phone, role, profile_image)
      VALUES ('uid_consumer_002', 'Aarav Sharma (Household Microgrid)', 'aarav.consumer@gmail.com', '+919876543211', 'consumer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
      ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name
      RETURNING *;
    `);

    const user3Res = await client.query(`
      INSERT INTO users (firebase_uid, name, email, phone, role, profile_image)
      VALUES ('uid_prosumer_003', 'Priya Patel (Community BESS Solar)', 'priya.prosumer@solar-coop.org', '+919876543212', 'prosumer', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
      ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name
      RETURNING *;
    `);

    const producerId = user1Res.rows[0].id;
    const consumerId = user2Res.rows[0].id;
    const prosumerId = user3Res.rows[0].id;

    // 2. Insert 3 Dummy Energy Offers
    console.log('Inserting 3 dummy solar energy offers into energy_offers table...');
    const offer1Res = await client.query(`
      INSERT INTO energy_offers (seller_id, energy_kwh, remaining_kwh, price_per_kwh, energy_source, status)
      VALUES (${producerId}, 15.0, 10.0, 6.50, 'Solar', 'active')
      RETURNING *;
    `);

    const offer2Res = await client.query(`
      INSERT INTO energy_offers (seller_id, energy_kwh, remaining_kwh, price_per_kwh, energy_source, status)
      VALUES (${prosumerId}, 8.5, 8.5, 7.00, 'Solar', 'active')
      RETURNING *;
    `);

    const offer3Res = await client.query(`
      INSERT INTO energy_offers (seller_id, energy_kwh, remaining_kwh, price_per_kwh, energy_source, status)
      VALUES (${producerId}, 25.0, 20.0, 6.00, 'Solar', 'active')
      RETURNING *;
    `);

    const offer1Id = offer1Res.rows[0].id;
    const offer2Id = offer2Res.rows[0].id;
    const offer3Id = offer3Res.rows[0].id;

    // 3. Insert 3 Dummy Energy Transactions
    console.log('Inserting 3 dummy P2P energy transactions into energy_transactions table...');
    await client.query(`
      INSERT INTO energy_transactions (seller_id, buyer_id, energy_offer_id, energy_kwh, price_per_kwh, total_amount, status)
      VALUES
        (${producerId}, ${consumerId}, ${offer1Id}, 5.0, 6.50, 32.50, 'completed'),
        (${producerId}, ${consumerId}, ${offer3Id}, 5.0, 6.00, 30.00, 'completed'),
        (${prosumerId}, ${consumerId}, ${offer2Id}, 3.0, 7.00, 21.00, 'completed');
    `);

    console.log('✅ DUMMY DATA SEEDED SUCCESSFULLY INTO POSTGRESQL DATABASE!');
    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error seeding dummy data:', err);
  }
}

seedData();
