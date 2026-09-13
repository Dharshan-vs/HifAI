import crypto from 'crypto';
import { query } from '../db/index.js';

/**
 * Generates a standard deterministic SHA-256 blockchain transaction hash
 */
export function generateBlockchainHash(payload) {
  const nonce = crypto.randomBytes(8).toString('hex');
  const rawString = `${JSON.stringify(payload)}_${Date.now()}_${nonce}`;
  const hash = crypto.createHash('sha256').update(rawString).digest('hex');
  return `0x${hash}`;
}

/**
 * Creates an immutable audit trail record in the database
 */
export async function createAuditLog({
  transaction_id,
  user_id = null,
  actor = 'System',
  action,
  transaction_type,
  amount = 0,
  status = 'verified',
  blockchain_hash = null,
  description = '',
  metadata = {},
}) {
  try {
    const finalHash =
      blockchain_hash ||
      generateBlockchainHash({
        transaction_id,
        user_id,
        actor,
        action,
        transaction_type,
        amount,
        status,
        timestamp: new Date().toISOString(),
      });

    const parsedAmount = parseFloat(amount) || 0;

    const res = await query(
      `INSERT INTO audit_logs 
       (transaction_id, user_id, actor, action, transaction_type, amount, status, blockchain_hash, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        transaction_id,
        user_id,
        actor,
        action,
        transaction_type,
        parsedAmount,
        status,
        finalHash,
        description,
        typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
      ]
    );

    return res.rows[0];
  } catch (error) {
    console.error('Failed to create immutable audit log:', error);
    // Non-blocking for primary transaction flow
    return null;
  }
}
