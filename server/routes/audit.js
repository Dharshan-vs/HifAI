import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { query } from '../db/index.js';
import { createAuditLog } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/audit/summary - Summary cards for admin dashboard
router.get('/summary', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const summaryRes = await query(`
      SELECT 
        COUNT(*) as total_audit_records,
        COUNT(DISTINCT transaction_id) as total_transactions,
        COUNT(*) FILTER (WHERE LOWER(status) IN ('verified', 'completed')) as verified_transactions,
        COUNT(*) FILTER (WHERE LOWER(status) IN ('failed', 'tampered')) as failed_tampered_transactions
      FROM audit_logs
    `);

    const row = summaryRes.rows[0] || {};
    res.json({
      success: true,
      summary: {
        total_transactions: parseInt(row.total_transactions || 0, 10),
        verified_transactions: parseInt(row.verified_transactions || 0, 10),
        failed_tampered_transactions: parseInt(row.failed_tampered_transactions || 0, 10),
        total_audit_records: parseInt(row.total_audit_records || 0, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    res.status(500).json({ error: 'Failed to fetch audit summary' });
  }
});

// GET /api/audit/logs - Fetch all audit logs with search, filters and pagination
router.get('/logs', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      search,
      q,
      transaction_id,
      transaction_type,
      status,
      start_date,
      end_date,
      limit = 100,
      offset = 0,
    } = req.query;

    const searchTerm = search || q;
    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (transaction_id && transaction_id.trim()) {
      params.push(transaction_id.trim());
      sql += ` AND transaction_id = $${params.length}`;
    }

    if (transaction_type && transaction_type !== 'all') {
      params.push(transaction_type.toLowerCase());
      sql += ` AND LOWER(transaction_type) = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status.toLowerCase());
      sql += ` AND LOWER(status) = $${params.length}`;
    }

    if (start_date) {
      params.push(new Date(start_date).toISOString());
      sql += ` AND timestamp >= $${params.length}`;
    }

    if (end_date) {
      params.push(new Date(end_date).toISOString());
      sql += ` AND timestamp <= $${params.length}`;
    }

    if (searchTerm && searchTerm.trim()) {
      params.push(`%${searchTerm.trim().toLowerCase()}%`);
      const pIdx = params.length;
      sql += ` AND (
        LOWER(transaction_id) LIKE $${pIdx} OR
        LOWER(COALESCE(actor, '')) LIKE $${pIdx} OR
        LOWER(action) LIKE $${pIdx} OR
        LOWER(blockchain_hash) LIKE $${pIdx} OR
        LOWER(COALESCE(description, '')) LIKE $${pIdx} OR
        CAST(id AS TEXT) LIKE $${pIdx}
      )`;
    }

    sql += ` ORDER BY timestamp DESC, id DESC`;

    if (limit && !isNaN(parseInt(limit, 10))) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }

    if (offset && !isNaN(parseInt(offset, 10))) {
      params.push(parseInt(offset, 10));
      sql += ` OFFSET $${params.length}`;
    }

    const dbRes = await query(sql, params);
    res.json({
      success: true,
      logs: dbRes.rows,
      count: dbRes.rows.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/audit/logs/:id - Fetch single audit record
router.get('/logs/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbRes = await query(`SELECT * FROM audit_logs WHERE id = $1`, [id]);

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: 'Audit record not found' });
    }

    res.json({ success: true, log: dbRes.rows[0] });
  } catch (error) {
    console.error('Error fetching audit record:', error);
    res.status(500).json({ error: 'Failed to fetch audit record' });
  }
});

// POST /api/audit/logs - Create audit record
router.post('/logs', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const created = await createAuditLog(req.body);
    if (!created) {
      return res.status(500).json({ error: 'Failed to create audit log entry' });
    }
    res.status(201).json({ success: true, log: created });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// DELETE IMMUTABILITY ENFORCEMENT
// Acceptance Criteria 3: Historical records cannot be deleted
router.delete('/logs/:id', verifyToken, (req, res) => {
  return res.status(405).json({
    error: 'Method Not Allowed: Historical audit records are immutable blockchain logs and cannot be deleted.',
  });
});

router.delete('/logs', verifyToken, (req, res) => {
  return res.status(405).json({
    error: 'Method Not Allowed: Bulk deletion is strictly forbidden on immutable audit records.',
  });
});

export default router;
