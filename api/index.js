import app from '../server/server.js';
import { initDb } from '../server/db/index.js';

let dbInitialized = false;

export default async function handler(req, res) {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (e) {
      console.warn('Vercel serverless DB initialization notice:', e);
    }
  }
  return app(req, res);
}
