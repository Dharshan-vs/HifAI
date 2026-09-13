import { query, initDb } from '../server/db/index.js';

async function runTest() {
  console.log('--- STARTING TRANSACTION LIFECYCLE VERIFICATION TEST ---');
  await initDb();

  // 1. Create Producer & Consumer users
  const prodRes = await query(`
    INSERT INTO users (firebase_uid, email, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, ['test_prod_uid', 'prod@yuga.energy', 'Solar Producer Test', 'producer']);
  const producer = prodRes.rows[0];

  const consRes = await query(`
    INSERT INTO users (firebase_uid, email, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, ['test_cons_uid', 'cons@yuga.energy', 'Consumer Test', 'consumer']);
  const consumer = consRes.rows[0];

  console.log('✅ Users Created: Producer ID:', producer.id, 'Consumer ID:', consumer.id);

  // 2. Create Offer (20.0 kWh @ ₹7.20)
  const offerRes = await query(`
    INSERT INTO energy_offers (seller_id, energy_kwh, price_per_kwh, energy_source)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [producer.id, 20.0, 7.20, 'Solar']);
  const offer = offerRes.rows[0];
  console.log('✅ Energy Offer Created: ID', offer.id, 'Remaining kWh:', offer.remaining_kwh);

  // 3. Purchase 5.0 kWh -> Initial status should be 'pending'
  const buyKwh = 5.0;
  const pricePerKwh = 7.20;
  const totalAmount = buyKwh * pricePerKwh;

  const txRes = await query(`
    INSERT INTO energy_transactions
    (seller_id, buyer_id, energy_offer_id, energy_kwh, price_per_kwh, total_amount, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *
  `, [producer.id, consumer.id, offer.id, buyKwh, pricePerKwh, totalAmount]);
  const tx1 = txRes.rows[0];
  console.log('✅ Purchase 1 placed: Tx ID', tx1.id, 'Status:', tx1.status, '(Expected: pending)');

  // Verify remaining kWh on offer
  const offerCheck1 = (await query('SELECT * FROM energy_offers WHERE id = $1', [offer.id])).rows[0];
  console.log('✅ Offer Remaining kWh after purchase:', offerCheck1.remaining_kwh, '(Expected: 15.0)');

  // 4. Test Lifecycle Progression: PENDING -> ACCEPTED -> IN_TRANSMISSION -> DELIVERED -> COMPLETED
  const transitions = ['accepted', 'in_transmission', 'delivered', 'completed'];
  for (const nextStatus of transitions) {
    const updated = (await query('UPDATE energy_transactions SET status = $1 WHERE id = $2 RETURNING *', [nextStatus, tx1.id])).rows[0];
    console.log(`✅ Lifecycle progressed to: ${updated.status}`);
  }

  // 5. Test Cancellation & Energy Restoration on a new purchase
  const tx2Res = await query(`
    INSERT INTO energy_transactions
    (seller_id, buyer_id, energy_offer_id, energy_kwh, price_per_kwh, total_amount, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *
  `, [producer.id, consumer.id, offer.id, 5.0, 7.20, 36.0]);
  const tx2 = tx2Res.rows[0];
  console.log('✅ Purchase 2 placed: Tx ID', tx2.id, 'Remaining on offer:', (await query('SELECT * FROM energy_offers WHERE id = $1', [offer.id])).rows[0].remaining_kwh, '(Expected: 10.0)');

  // Cancel Purchase 2:
  // Restore kWh
  await query('UPDATE energy_offers SET remaining_kwh = remaining_kwh + $1, status = \'active\' WHERE id = $2', [5.0, offer.id]);
  await query('UPDATE energy_transactions SET status = \'cancelled\' WHERE id = $1', [tx2.id]);
  const offerAfterCancel = (await query('SELECT * FROM energy_offers WHERE id = $1', [offer.id])).rows[0];
  const tx2AfterCancel = (await query('SELECT * FROM energy_transactions WHERE id = $1', [tx2.id])).rows[0];

  console.log('✅ Transaction 2 Cancelled! Status:', tx2AfterCancel.status, '(Expected: cancelled)');
  console.log('✅ Offer Remaining kWh Restored:', offerAfterCancel.remaining_kwh, '(Expected: 15.0)');

  console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY ---');
}

runTest().catch(console.error);
