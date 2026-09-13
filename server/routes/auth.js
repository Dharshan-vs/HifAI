import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { query } from '../db/index.js';

const router = express.Router();

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
           role = COALESCE($6, users.role),
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
