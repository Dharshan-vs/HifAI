import admin from 'firebase-admin';
import { query } from '../db/index.js';

// Initialize Firebase Admin SDK if service account key is available or fallback to default
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'auth-hifi',
      });
    }
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (err) {
    console.warn('Firebase Admin SDK initialization warning:', err.message);
  }
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token header format' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    let decodedToken;

    const isDev = process.env.NODE_ENV !== 'production';

    // Fast-path for development & demo sessions
    if (isDev && (!token || token === 'demo-token' || token.startsWith('demo') || token === 'guest-token' || token === 'undefined')) {
      decodedToken = {
        uid: 'demo-user-001',
        email: 'user@yuga.energy',
        name: 'YUGA Member',
        phone_number: '+1 555-0199',
        picture: '',
      };
    } else {
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (firebaseErr) {
        if (!isDev) {
          console.error('Production token verification failed:', firebaseErr.message);
          return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token' });
        }
        // Fallback decoding ONLY for development verification if service account credentials are not loaded locally
        const parts = token.split('.');
        if (parts.length >= 2 && parts[1]) {
          try {
            const decodedString = Buffer.from(parts[1], 'base64').toString('utf-8');
            const parsed = JSON.parse(decodedString);
            decodedToken = {
              uid: parsed.user_id || parsed.sub || parsed.uid || 'demo-user-001',
              email: parsed.email || 'user@yuga.energy',
              name: parsed.name || 'YUGA Member',
              phone_number: parsed.phone_number || '',
              picture: parsed.picture || '',
            };
          } catch {
            decodedToken = {
              uid: `dev_${token.slice(0, 16)}`,
              email: 'dev@yuga.energy',
              name: 'YUGA Member',
              phone_number: '',
              picture: '',
            };
          }
        } else {
          decodedToken = {
            uid: `dev_${token.slice(0, 16)}`,
            email: 'dev@yuga.energy',
            name: 'YUGA Member',
            phone_number: '',
            picture: '',
          };
        }
      }
    }

    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check if role is specified via header or admin token
    const requestedRole = req.headers['x-demo-role'] || (decodedToken.email?.includes('admin') ? 'admin' : 'consumer');

    // Lookup corresponding PostgreSQL user
    const dbRes = await query('SELECT * FROM users WHERE firebase_uid = $1', [decodedToken.uid]);
    let user = dbRes.rows[0];

    // Auto-register user in PostgreSQL if missing
    if (!user) {
      const insertRes = await query(
        `INSERT INTO users (firebase_uid, email, name, phone, profile_image, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (firebase_uid) DO UPDATE
         SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          decodedToken.uid,
          decodedToken.email || '',
          decodedToken.name || (requestedRole === 'admin' ? 'System Administrator' : 'YUGA User'),
          decodedToken.phone_number || '',
          decodedToken.picture || '',
          requestedRole,
        ]
      );
      user = insertRes.rows[0];
    } else if (req.headers['x-demo-role'] && user.role !== req.headers['x-demo-role']) {
      user.role = req.headers['x-demo-role'];
    }

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase token' });
  }
}

/**
 * Admin authorization check middleware - strictly restricts access to System Administrators
 */
export function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Admin-only access. Only authenticated users with the System Administrator role can access this resource.',
    });
  }
  next();
}

