import { query, initDb } from '../server/db/index.js';

async function runTest() {
  console.log('--- STARTING HD-48 CREATE ENERGY LISTING TEST ---');
  await initDb();

  // 1. Create Producer user
  const userRes = await query(`
    INSERT INTO users (firebase_uid, email, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, ['hd48_prod_uid', 'hd48_prod@yuga.energy', 'Anna Nagar Rooftop Solar', 'producer']);
  const producer = userRes.rows[0];
  console.log('✅ Producer Created: ID', producer.id, 'Name:', producer.name);

  // 2. Create Listing with complete metadata
  const energyKwh = 12.5;
  const pricePerKwh = 7.20;
  const energySource = 'Rooftop Solar Array 5kW';
  const sellerLocation = 'Block 4, 2nd Avenue, Anna Nagar Microgrid Feeder A';
  const sellerCity = 'Chennai Microgrid Zone 1';
  const lat = 13.0850;
  const lon = 80.2100;

  const insertRes = await query(`
    INSERT INTO energy_offers
    (seller_id, energy_kwh, remaining_kwh, price_per_kwh, energy_source, seller_location, seller_city, lat, lon, available_from, available_until, status)
    VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '12 hours', 'active')
    RETURNING *
  `, [producer.id, energyKwh, pricePerKwh, energySource, sellerLocation, sellerCity, lat, lon]);

  const createdOffer = insertRes.rows[0];
  console.log('✅ Energy Offer Created:', {
    id: createdOffer.id,
    energy_kwh: createdOffer.energy_kwh,
    remaining_kwh: createdOffer.remaining_kwh,
    price_per_kwh: createdOffer.price_per_kwh,
    energy_source: createdOffer.energy_source,
    seller_location: createdOffer.seller_location,
    seller_city: createdOffer.seller_city,
    lat: createdOffer.lat,
    lon: createdOffer.lon,
    status: createdOffer.status,
  });

  // 3. Query Active Offers (as done by GET /api/energy/offers)
  const offersRes = await query(`
    SELECT o.*, u.name as seller_name, u.role as seller_role
    FROM energy_offers o
    JOIN users u ON o.seller_id = u.id
    WHERE o.remaining_kwh > 0 AND o.status = 'active'
    ORDER BY o.created_at DESC
  `);

  const matched = offersRes.rows.find((o) => o.id === createdOffer.id);
  if (!matched) {
    throw new Error('Created offer not found in active offers query!');
  }

  console.log('✅ Newly created listing successfully appears in Marketplace query:');
  console.log('   - ID:', matched.id);
  console.log('   - Seller Name:', matched.seller_name);
  console.log('   - Remaining kWh:', matched.remaining_kwh);
  console.log('   - Tariff: ₹' + matched.price_per_kwh + '/kWh');
  console.log('   - Location:', matched.seller_location);

  console.log('--- ALL HD-48 CREATE ENERGY LISTING TESTS PASSED ---');
}

runTest().catch(console.error);
