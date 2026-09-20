import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { query } from '../db/index.js';

const router = express.Router();

// POST /api/auth/check-email-role
router.post('/check-email-role', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const dbRes = await query('SELECT role, email FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (dbRes.rows.length > 0) {
      return res.json({ exists: true, role: dbRes.rows[0].role });
    }
    return res.json({ exists: false, role: null });
  } catch (error) {
    console.error('Error checking email role:', error);
    res.status(500).json({ error: 'Database check error' });
  }
});

// POST /api/auth/sync-user
router.post('/sync-user', verifyToken, async (req, res) => {
  try {
    const { uid, email, name, phone_number, picture } = req.firebaseUser;
    const { role, name: bodyName, phone: bodyPhone } = req.body;

    const finalName = bodyName || name || req.user.name || 'YUGA Member';
    const finalPhone = bodyPhone || phone_number || req.user.phone || '';
    const finalRole = role || req.user.role || 'consumer';

    const dbRes = await query(
      `INSERT INTO users (firebase_uid, email, name, phone, profile_image, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (firebase_uid) DO UPDATE
       SET name = EXCLUDED.name,
           email = COALESCE(EXCLUDED.email, users.email),
           phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE users.phone END,
           role = COALESCE(users.role, $6),
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [uid, email || '', finalName, finalPhone, picture || '', finalRole]
    );

    const user = dbRes.rows[0];
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error syncing user with PostgreSQL:', error);
    res.status(500).json({ error: 'Failed to sync user with database' });
  }
});

export default router;
