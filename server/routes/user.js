import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { query } from '../db/index.js';

const router = express.Router();

// GET /api/user/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    res.json({ success: true, profile: req.user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/user/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, profile_image, role } = req.body;
    const userId = req.user.id;

    const dbRes = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           profile_image = COALESCE($3, profile_image),
           role = COALESCE($4, role),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, phone, profile_image, role, userId]
    );

    res.json({ success: true, profile: dbRes.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
