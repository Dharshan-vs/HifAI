import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import energyRoutes from './routes/energy.js';
import auditRoutes from './routes/audit.js';
import dbViewerRoutes from './routes/dbViewer.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration: restrict origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS security policy: Origin not allowed'));
    },
    credentials: true,
  })
);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/db', dbViewerRoutes);
app.use('/api/db', dbViewerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'YUGA / HifAI Backend Service Running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server & Initialize Database
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`⚡ YUGA Backend Server running on http://localhost:${PORT}`);
  });
}

// Start standalone server if run directly
if (process.env.VERCEL !== '1') {
  startServer();
}

export { app, startServer };
export default app;
