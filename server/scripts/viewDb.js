import { query, initDb } from '../db/index.js';

async function displayDatabaseTables() {
  await initDb();
  console.log('\n======================================================');
  console.log('⚡ YUGA / HIFAI POSTGRESQL DATABASE EXPLORER');
  console.log('======================================================\n');

  try {
    // 1. Audit Logs (Blockchain Ledger)
    console.log('📜 1. BLOCKCHAIN AUDIT LEDGER (audit_logs):');
    console.log('------------------------------------------------------');
    const auditRes = await query('SELECT id, transaction_id, actor, action, amount, status, blockchain_hash, timestamp FROM audit_logs ORDER BY id DESC LIMIT 10;');
    console.table(auditRes.rows);

    // 2. Energy Offers
    console.log('\n🔋 2. ENERGY OFFERS IN MARKETPLACE (energy_offers):');
    console.log('------------------------------------------------------');
    const offersRes = await query('SELECT o.id, u.name as seller_name, o.energy_kwh, o.remaining_kwh, o.price_per_kwh, o.energy_source, o.seller_city, o.status FROM energy_offers o LEFT JOIN users u ON o.seller_id = u.id LIMIT 10;');
    console.table(offersRes.rows);

    // 3. Users
    console.log('\n👤 3. REGISTERED USERS (users):');
    console.log('------------------------------------------------------');
    const usersRes = await query('SELECT id, name, email, role, firebase_uid FROM users LIMIT 10;');
    console.table(usersRes.rows);

    // 4. Energy Transactions
    console.log('\n💳 4. ENERGY TRANSACTIONS (energy_transactions):');
    console.log('------------------------------------------------------');
    const txRes = await query('SELECT id, energy_offer_id as offer_id, buyer_id, seller_id, energy_kwh, total_amount, status, created_at FROM energy_transactions LIMIT 10;');
    if (txRes.rows.length === 0) {
      console.log('(No completed trades in database yet. Trades will show here once purchased.)');
    } else {
      console.table(txRes.rows);
    }

    console.log('\n✅ Database query executed successfully.\n');
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    process.exit(0);
  }
}

displayDatabaseTables();
