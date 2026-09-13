import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { query } from '../db/index.js';
import { createAuditLog } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/energy/summary
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's P2P energy sales
    const salesRes = await query(
      `SELECT COALESCE(SUM(energy_kwh), 0) as total_sold
       FROM energy_transactions
       WHERE seller_id = $1 AND status = 'completed'`,
      [userId]
    );

    // Fetch user's P2P energy purchases
    const purchasesRes = await query(
      `SELECT COALESCE(SUM(energy_kwh), 0) as total_purchased
       FROM energy_transactions
       WHERE buyer_id = $1 AND status = 'completed'`,
      [userId]
    );

    // Fetch latest IoT telemetry reading if available
    const readingsRes = await query(
      `SELECT * FROM energy_readings
       WHERE user_id = $1
       ORDER BY reading_time DESC LIMIT 1`,
      [userId]
    );

    const latestReading = readingsRes.rows[0] || {};

    res.json({
      success: true,
      summary: {
        solar_generated_kwh: parseFloat(latestReading.solar_generated_kwh || 0),
        energy_consumed_kwh: parseFloat(latestReading.energy_consumed_kwh || 0),
        battery_stored_kwh: parseFloat(latestReading.battery_stored_kwh || 0),
        battery_discharged_kwh: parseFloat(latestReading.battery_discharged_kwh || 0),
        p2p_energy_sold_kwh: parseFloat(salesRes.rows[0]?.total_sold || 0),
        p2p_energy_purchased_kwh: parseFloat(purchasesRes.rows[0]?.total_purchased || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching energy summary:', error);
    res.status(500).json({ error: 'Failed to fetch energy summary' });
  }
});

// GET /api/energy/offers - List active energy offers available for purchase (with search and filter support)
router.get('/offers', async (req, res) => {
  try {
    const { search, q, energy_source, min_price, max_price, min_kwh, status } = req.query;
    const queryTerm = search || q;

    let sql = `
      SELECT o.*, u.name as seller_name, u.role as seller_role, u.profile_image as seller_image
      FROM energy_offers o
      JOIN users u ON o.seller_id = u.id
      WHERE o.remaining_kwh > 0
    `;
    const params = [];

    // Status filter (defaults to active)
    if (status && status !== 'all') {
      params.push(status.toLowerCase());
      sql += ` AND LOWER(o.status) = $${params.length}`;
    } else if (!status || status === 'active') {
      sql += ` AND o.status = 'active'`;
    }

    if (queryTerm && queryTerm.trim()) {
      params.push(`%${queryTerm.trim().toLowerCase()}%`);
      const pIdx = params.length;
      sql += ` AND (
        LOWER(u.name) LIKE $${pIdx} OR
        LOWER(o.energy_source) LIKE $${pIdx} OR
        LOWER(COALESCE(o.seller_location, '')) LIKE $${pIdx} OR
        LOWER(COALESCE(o.seller_city, '')) LIKE $${pIdx} OR
        CAST(o.id AS TEXT) LIKE $${pIdx}
      )`;
    }

    if (energy_source && energy_source !== 'all') {
      params.push(energy_source.toLowerCase());
      sql += ` AND LOWER(o.energy_source) = $${params.length}`;
    }

    if (min_price && !isNaN(parseFloat(min_price))) {
      params.push(parseFloat(min_price));
      sql += ` AND o.price_per_kwh >= $${params.length}`;
    }

    if (max_price && !isNaN(parseFloat(max_price))) {
      params.push(parseFloat(max_price));
      sql += ` AND o.price_per_kwh <= $${params.length}`;
    }

    if (min_kwh && !isNaN(parseFloat(min_kwh))) {
      params.push(parseFloat(min_kwh));
      sql += ` AND o.remaining_kwh >= $${params.length}`;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const dbRes = await query(sql, params);
    res.json({ success: true, offers: dbRes.rows });
  } catch (error) {
    console.error('Error fetching energy offers:', error);
    res.status(500).json({ error: 'Failed to fetch energy offers' });
  }
});

// GET /api/energy/offers/:id - Fetch details for a specific offer
router.get('/offers/:id', async (req, res) => {
  try {
    const offerId = req.params.id;
    const dbRes = await query(
      `SELECT o.*, u.name as seller_name, u.role as seller_role, u.email as seller_email, u.phone as seller_phone
       FROM energy_offers o
       JOIN users u ON o.seller_id = u.id
       WHERE o.id = $1`,
      [offerId]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: 'Energy offer not found' });
    }

    res.json({ success: true, offer: dbRes.rows[0] });
  } catch (error) {
    console.error('Error fetching energy offer:', error);
    res.status(500).json({ error: 'Failed to fetch energy offer' });
  }
});

// POST /api/energy/offers - Create new energy offer (Sell Energy)
router.post('/offers', verifyToken, async (req, res) => {
  try {
    const seller_id = req.user.id;
    const {
      energy_kwh,
      price_per_kwh,
      energy_source = 'Solar',
      seller_location,
      seller_city,
      lat,
      lon,
      available_from,
      available_until,
    } = req.body;

    const kwh = parseFloat(energy_kwh);
    const price = parseFloat(price_per_kwh);

    if (isNaN(kwh) || kwh <= 0) {
      return res.status(400).json({ error: 'Available energy (kWh) must be a positive number greater than 0' });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Price per kWh must be a positive number greater than 0' });
    }

    const loc = seller_location || 'Local Microgrid Feeder A';
    const city = seller_city || 'Local Area';
    const latitude = parseFloat(lat) || 13.0827;
    const longitude = parseFloat(lon) || 80.2707;

    const dbRes = await query(
      `INSERT INTO energy_offers
       (seller_id, energy_kwh, remaining_kwh, price_per_kwh, energy_source, seller_location, seller_city, lat, lon, available_from, available_until, status)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP), COALESCE($10, CURRENT_TIMESTAMP + INTERVAL '12 hours'), 'active')
       RETURNING *`,
      [
        seller_id,
        kwh,
        price,
        energy_source,
        loc,
        city,
        latitude,
        longitude,
        available_from || null,
        available_until || null,
      ]
    );

    const createdOffer = dbRes.rows[0];

    // HD-37: Automatically create immutable audit trail record for offer creation
    await createAuditLog({
      transaction_id: `OFFER-${createdOffer?.id || Date.now()}`,
      user_id: String(seller_id),
      actor: req.user?.name ? `${req.user.name} (Producer)` : `Producer #${seller_id}`,
      action: 'OFFER_CREATED',
      transaction_type: 'offer_creation',
      amount: parseFloat((kwh * price).toFixed(2)),
      status: 'verified',
      description: `Created new solar energy offer #${createdOffer?.id || ''}: ${kwh} kWh at ₹${price}/kWh located in ${city}. Published to ledger.`,
      metadata: {
        offer_id: createdOffer?.id,
        energy_kwh: kwh,
        price_per_kwh: price,
        energy_source,
        seller_location: loc,
        seller_city: city,
      },
    });

    res.status(201).json({ success: true, offer: createdOffer });
  } catch (error) {
    console.error('Error creating energy offer:', error);
    res.status(500).json({ error: 'Failed to create energy offer' });
  }
});

// Haversine distance calculator in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
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

// POST /api/energy/purchase - Purchase energy from an offer (Buy Energy)
router.post('/purchase', verifyToken, async (req, res) => {
  try {
    const buyer_id = req.user.id;
    const { offer_id, energy_kwh, consumer_lat, consumer_lon, distance_km } = req.body;

    const buyAmount = parseFloat(energy_kwh);
    if (!offer_id || !buyAmount || buyAmount <= 0) {
      return res.status(400).json({ error: 'Valid offer ID and purchase amount (kWh) are required' });
    }

    // 1. Fetch current offer
    const offerRes = await query('SELECT * FROM energy_offers WHERE id = $1', [offer_id]);
    if (offerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Energy offer not found' });
    }

    const offer = offerRes.rows[0];
    const remainingKwh = parseFloat(offer.remaining_kwh);

    if (offer.status !== 'active' || remainingKwh <= 0) {
      return res.status(400).json({ error: 'This energy offer is no longer available' });
    }

    if (buyAmount > remainingKwh) {
      return res.status(400).json({
        error: `Requested amount (${buyAmount} kWh) exceeds available energy (${remainingKwh} kWh)`,
      });
    }

    if (offer.seller_id === buyer_id) {
      return res.status(400).json({ error: 'You cannot purchase your own energy offer' });
    }

    // Microgrid radius verification (<= 1.0 km)
    let calculatedDist = parseFloat(distance_km);
    if (consumer_lat !== undefined && consumer_lon !== undefined) {
      calculatedDist = calculateDistanceKm(
        parseFloat(consumer_lat),
        parseFloat(consumer_lon),
        parseFloat(offer.lat || 13.0827),
        parseFloat(offer.lon || 80.2707)
      );
    }
    if (!isNaN(calculatedDist) && calculatedDist > 1.0) {
      return res.status(400).json({
        error: `Energy transfer restricted: Distance (${calculatedDist.toFixed(2)} km) exceeds the strict 1.0 km microgrid limit for peer-to-peer electricity transfer.`,
      });
    }

    const pricePerKwh = parseFloat(offer.price_per_kwh);
    const totalAmount = parseFloat((buyAmount * pricePerKwh).toFixed(2));

    // 2. Deduct remaining energy from offer
    const newRemaining = remainingKwh - buyAmount;
    const newStatus = newRemaining <= 0 ? 'completed' : 'active';

    await query(
      `UPDATE energy_offers
       SET remaining_kwh = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newRemaining, newStatus, offer_id]
    );

    // 3. Record transaction in PostgreSQL with initial 'pending' status
    const txRes = await query(
      `INSERT INTO energy_transactions
       (seller_id, buyer_id, energy_offer_id, energy_kwh, price_per_kwh, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [offer.seller_id, buyer_id, offer_id, buyAmount, pricePerKwh, totalAmount]
    );

    const createdTx = txRes.rows[0];

    // 4. Credit Producer's Wallet in PostgreSQL Database (+totalAmount)
    await query(
      `UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2`,
      [totalAmount, offer.seller_id]
    );

    // 5. Deduct Consumer's Wallet in PostgreSQL Database (-totalAmount)
    await query(
      `UPDATE users SET wallet_balance = GREATEST(COALESCE(wallet_balance, 0) - $1, 0) WHERE id = $2`,
      [totalAmount, buyer_id]
    );

    // 6. Record Smart Meter reading in PostgreSQL for consumer
    try {
      await query(
        `INSERT INTO energy_readings
         (user_id, energy_consumed_kwh, energy_exported_kwh, voltage, current_draw, power_factor, frequency, reading_time)
         VALUES ($1, $2, 0, 231.5, $3, 0.98, 50.0, CURRENT_TIMESTAMP)`,
        [buyer_id, buyAmount, parseFloat((buyAmount * 1.2).toFixed(1))]
      );
    } catch (readingErr) {
      console.warn('PostgreSQL energy_readings insert warning:', readingErr);
    }

    // HD-37: Automatically create immutable blockchain audit trail record for purchase
    const txIdentifier = `TX-P2P-${createdTx?.id || Date.now()}`;
    await createAuditLog({
      transaction_id: txIdentifier,
      user_id: String(buyer_id),
      actor: req.user?.name ? `${req.user.name} (Buyer)` : `Consumer #${buyer_id}`,
      action: 'ENERGY_PURCHASE',
      transaction_type: 'purchase',
      amount: totalAmount,
      status: 'verified',
      description: `P2P purchase of ${buyAmount} kWh solar electricity from Offer #${offer_id} at ₹${pricePerKwh}/kWh. Smart contract escrow locked for ₹${totalAmount.toFixed(2)}.`,
      metadata: {
        transaction_id: createdTx?.id,
        offer_id,
        seller_id: offer.seller_id,
        buyer_id,
        energy_kwh: buyAmount,
        price_per_kwh: pricePerKwh,
        total_amount: totalAmount,
        energy_source: offer.energy_source || 'Solar',
        seller_location: offer.seller_location || 'Local Microgrid',
      },
    });

    res.json({
      success: true,
      message: `Successfully placed order for ${buyAmount} kWh of solar energy for ₹${totalAmount}. Status: PENDING PRODUCER ACCEPTANCE`,
      transaction: createdTx,
      amount_transferred: totalAmount,
    });
  } catch (error) {
    console.error('Error processing energy purchase:', error);
    res.status(500).json({ error: 'Failed to complete energy purchase transaction' });
  }
});

/**
 * Helper function for safe cancellation and energy/wallet reversal
 */
async function processTransactionCancellation(tx, req, res) {
  const currentStatus = (tx.status || 'pending').toLowerCase();

  if (currentStatus === 'completed') {
    return res.status(400).json({ error: 'Cannot cancel an already completed transaction' });
  }
  if (currentStatus === 'cancelled') {
    return res.status(400).json({ error: 'Transaction is already cancelled (duplicate refund prevented)' });
  }
  if (currentStatus === 'in_transmission' || currentStatus === 'delivered') {
    return res.status(400).json({
      error: `Cannot cancel transaction while energy is '${currentStatus}'. Please wait for delivery settlement or contact support.`,
    });
  }

  const energyAmount = parseFloat(tx.energy_kwh || 0);
  const totalAmount = parseFloat(tx.total_amount || 0);
  const offerId = tx.energy_offer_id;
  const buyerId = tx.buyer_id;
  const sellerId = tx.seller_id;

  // 1. Mark transaction as cancelled
  const updatedTxRes = await query(
    `UPDATE energy_transactions
     SET status = 'cancelled'
     WHERE id = $1
     RETURNING *`,
    [tx.id]
  );

  // 2. Restore available energy in energy_offers
  if (offerId && energyAmount > 0) {
    await query(
      `UPDATE energy_offers
       SET remaining_kwh = remaining_kwh + $1,
           status = 'active',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [energyAmount, offerId]
    );
  }

  // 3. Refund Consumer's Wallet (+totalAmount)
  if (buyerId && totalAmount > 0) {
    await query(
      `UPDATE users
       SET wallet_balance = COALESCE(wallet_balance, 0) + $1
       WHERE id = $2`,
      [totalAmount, buyerId]
    );
  }

  // 4. Reverse Producer's Wallet Credit (-totalAmount)
  if (sellerId && totalAmount > 0) {
    await query(
      `UPDATE users
       SET wallet_balance = GREATEST(COALESCE(wallet_balance, 0) - $1, 0)
       WHERE id = $2`,
      [totalAmount, sellerId]
    );
  }

  // HD-37: Automatically create immutable audit trail record for transaction cancellation
  await createAuditLog({
    transaction_id: `TX-P2P-${tx.id}`,
    user_id: String(buyerId || req.user?.id),
    actor: req.user?.name ? `${req.user.name}` : `User #${req.user?.id || 'admin'}`,
    action: 'TRANSACTION_CANCELLED',
    transaction_type: 'refund',
    amount: totalAmount,
    status: 'cancelled',
    description: `Order #${tx.id} cancelled. Restored ${energyAmount} kWh to available offer and refunded ₹${totalAmount.toFixed(2)} to consumer wallet.`,
    metadata: {
      transaction_id: tx.id,
      offer_id: offerId,
      refund_amount: totalAmount,
      restored_kwh: energyAmount,
      buyer_id: buyerId,
      seller_id: sellerId,
    },
  });

  return res.json({
    success: true,
    message: `Order #${tx.id} successfully cancelled. Restored ${energyAmount} kWh to offer and refunded ₹${totalAmount.toFixed(2)} to consumer wallet.`,
    transaction: updatedTxRes.rows[0] || { ...tx, status: 'cancelled' },
    refund_amount: totalAmount,
    restored_kwh: energyAmount,
  });
}

// PUT /api/energy/transactions/:id/status - Update transaction order status along lifecycle
router.put('/transactions/:id/status', verifyToken, async (req, res) => {
  try {
    const txId = req.params.id;
    const userId = req.user.id;
    const { status } = req.body;

    const VALID_STATUSES = ['pending', 'accepted', 'in_transmission', 'delivered', 'completed', 'cancelled'];
    if (!status || !VALID_STATUSES.includes(status.toLowerCase())) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const targetStatus = status.toLowerCase();

    // 1. Fetch current transaction
    const txRes = await query('SELECT * FROM energy_transactions WHERE id = $1', [txId]);
    if (txRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = txRes.rows[0];
    const currentStatus = (tx.status || 'pending').toLowerCase();

    // Check authorization: User must be buyer or seller
    if (tx.seller_id !== userId && tx.buyer_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this transaction' });
    }

    // Cancellation route
    if (targetStatus === 'cancelled') {
      return processTransactionCancellation(tx, req, res);
    }

    // Terminal statuses cannot transition
    if (currentStatus === 'completed') {
      return res.status(400).json({ error: 'Cannot modify an already completed transaction' });
    }
    if (currentStatus === 'cancelled') {
      return res.status(400).json({ error: 'Cannot modify an already cancelled transaction' });
    }

    // Valid lifecycle progression rules:
    // PENDING -> ACCEPTED (Producer only)
    // ACCEPTED -> IN_TRANSMISSION (Producer only)
    // IN_TRANSMISSION -> DELIVERED (Producer only)
    // DELIVERED -> COMPLETED (Buyer or Producer)
    // PENDING / ACCEPTED -> CANCELLED (Buyer or Producer)
    const allowedTransitions = {
      pending: ['accepted', 'cancelled'],
      accepted: ['in_transmission', 'cancelled'],
      in_transmission: ['delivered'],
      delivered: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
      return res.status(400).json({
        error: `Invalid transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${
          allowedTransitions[currentStatus]?.join(', ') || 'none'
        }`,
      });
    }

    // Role-specific verification: Producer-only states
    if (['accepted', 'in_transmission', 'delivered'].includes(targetStatus)) {
      if (tx.seller_id !== userId) {
        return res.status(403).json({
          error: 'Forbidden: Only the energy producer/seller can advance this order stage.',
        });
      }
    }

    // Update status in PostgreSQL
    const updateRes = await query(
      `UPDATE energy_transactions
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [targetStatus, txId]
    );

    // HD-37: Automatically create immutable audit trail record for state advance
    await createAuditLog({
      transaction_id: `TX-P2P-${txId}`,
      user_id: String(userId),
      actor: req.user?.name ? `${req.user.name}` : `User #${userId}`,
      action: `STATUS_${targetStatus.toUpperCase()}`,
      transaction_type: 'status_change',
      amount: parseFloat(tx.total_amount || 0),
      status: targetStatus === 'completed' ? 'verified' : (targetStatus === 'cancelled' ? 'cancelled' : 'pending'),
      description: `Transaction #${txId} status advanced from '${currentStatus.toUpperCase()}' to '${targetStatus.toUpperCase()}'. Microgrid state verified on blockchain.`,
      metadata: {
        transaction_id: txId,
        previous_status: currentStatus,
        new_status: targetStatus,
        seller_id: tx.seller_id,
        buyer_id: tx.buyer_id,
      },
    });

    res.json({
      success: true,
      message: `Transaction #${txId} status updated to '${targetStatus.toUpperCase()}'`,
      transaction: updateRes.rows[0] || { ...tx, status: targetStatus },
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ error: 'Failed to update transaction status' });
  }
});

// POST /api/energy/transactions/:id/cancel - Explicit cancellation endpoint
router.post('/transactions/:id/cancel', verifyToken, async (req, res) => {
  try {
    const txId = req.params.id;
    const userId = req.user.id;

    const txRes = await query('SELECT * FROM energy_transactions WHERE id = $1', [txId]);
    if (txRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = txRes.rows[0];
    if (tx.seller_id !== userId && tx.buyer_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to cancel this transaction' });
    }

    return processTransactionCancellation(tx, req, res);
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    res.status(500).json({ error: 'Failed to cancel transaction' });
  }
});

// GET /api/energy/transactions - Fetch user transactions
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const dbRes = await query(
      `SELECT t.*,
              s.name as seller_name, b.name as buyer_name,
              o.energy_source
       FROM energy_transactions t
       JOIN users s ON t.seller_id = s.id
       JOIN users b ON t.buyer_id = b.id
       JOIN energy_offers o ON t.energy_offer_id = o.id
       WHERE t.seller_id = $1 OR t.buyer_id = $2
       ORDER BY t.created_at DESC`,
      [userId, userId]
    );

    res.json({ success: true, transactions: dbRes.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/energy/transactions/:id - Fetch single transaction with reviews
router.get('/transactions/:id', verifyToken, async (req, res) => {
  try {
    const txId = req.params.id;
    const userId = req.user.id;

    const dbRes = await query(
      `SELECT t.*,
              s.name as seller_name, s.email as seller_email,
              b.name as buyer_name, b.email as buyer_email,
              o.energy_source
       FROM energy_transactions t
       JOIN users s ON t.seller_id = s.id
       JOIN users b ON t.buyer_id = b.id
       JOIN energy_offers o ON t.energy_offer_id = o.id
       WHERE t.id = $1 AND (t.seller_id = $2 OR t.buyer_id = $2)`,
      [txId, userId]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction record not found' });
    }

    const tx = dbRes.rows[0];

    // Fetch any reviews for this transaction
    const reviewsRes = await query(
      `SELECT r.*,
              u1.name as reviewer_name,
              u2.name as reviewee_name
       FROM transaction_reviews r
       LEFT JOIN users u1 ON r.reviewer_id = u1.id
       LEFT JOIN users u2 ON r.reviewee_id = u2.id
       WHERE r.transaction_id = $1
       ORDER BY r.created_at DESC`,
      [txId]
    );

    tx.reviews = reviewsRes.rows || [];
    tx.user_review = tx.reviews.find((r) => r.reviewer_id == userId || String(r.reviewer_id) === String(userId)) || null;

    res.json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// POST /api/energy/transactions/:id/review - Rate and review completed transaction (HD-61)
router.post('/transactions/:id/review', verifyToken, async (req, res) => {
  try {
    const txId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { rating, review } = req.body;

    // 1. Validate rating
    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars' });
    }

    // 2. Validate optional review length
    const reviewText = typeof review === 'string' ? review.trim() : '';
    if (reviewText.length > 500) {
      return res.status(400).json({ error: 'Review text cannot exceed 500 characters' });
    }

    // 3. Fetch transaction
    const txRes = await query('SELECT * FROM energy_transactions WHERE id = $1', [txId]);
    if (txRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = txRes.rows[0];
    const currentStatus = (tx.status || 'pending').toLowerCase();

    // 4. Validate transaction is completed
    if (currentStatus !== 'completed') {
      return res.status(400).json({
        error: `Ratings and reviews are only permitted for completed transactions (current status: '${currentStatus}')`,
      });
    }

    // 5. Validate user is a participant
    const isBuyer = tx.buyer_id == userId || String(tx.buyer_id) === String(userId);
    const isSeller = tx.seller_id == userId || String(tx.seller_id) === String(userId);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'You are not authorized to review this transaction' });
    }

    // 6. Prevent self-review
    if (tx.buyer_id == tx.seller_id) {
      return res.status(400).json({ error: 'Cannot review your own self-transaction' });
    }

    const revieweeId = isBuyer ? tx.seller_id : tx.buyer_id;

    // 7. Check for duplicate review
    const existingReviewRes = await query(
      'SELECT * FROM transaction_reviews WHERE transaction_id = $1 AND reviewer_id = $2',
      [txId, userId]
    );

    if (existingReviewRes.rows.length > 0) {
      return res.status(400).json({
        error: 'You have already submitted a review for this transaction (duplicate reviews prevented)',
        existingReview: existingReviewRes.rows[0],
      });
    }

    // 8. Insert new review
    const insertRes = await query(
      `INSERT INTO transaction_reviews (transaction_id, reviewer_id, reviewee_id, rating, review)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [txId, userId, revieweeId, parsedRating, reviewText]
    );

    const createdReview = insertRes.rows[0];

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: createdReview,
    });
  } catch (error) {
    if (error.code === '23505' || String(error.message).includes('unique constraint')) {
      return res.status(400).json({ error: 'You have already submitted a review for this transaction' });
    }
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/energy/transactions/:id/reviews - Fetch all reviews for a transaction
router.get('/transactions/:id/reviews', verifyToken, async (req, res) => {
  try {
    const txId = parseInt(req.params.id, 10);
    const reviewsRes = await query(
      `SELECT r.*,
              u1.name as reviewer_name,
              u2.name as reviewee_name
       FROM transaction_reviews r
       LEFT JOIN users u1 ON r.reviewer_id = u1.id
       LEFT JOIN users u2 ON r.reviewee_id = u2.id
       WHERE r.transaction_id = $1
       ORDER BY r.created_at DESC`,
      [txId]
    );

    res.json({
      success: true,
      reviews: reviewsRes.rows,
      count: reviewsRes.rows.length,
    });
  } catch (error) {
    console.error('Error fetching transaction reviews:', error);
    res.status(500).json({ error: 'Failed to fetch transaction reviews' });
  }
});

export default router;

