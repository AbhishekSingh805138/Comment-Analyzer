import 'dotenv/config';
import crypto from 'crypto';
import { fetchComments } from './graph.js';
import { upsertPost, insertComment, pool } from './db.js';

const POSTS = (process.env.FB_POST_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

function hash(s?: string) {
  return s ? crypto.createHash('sha256').update(s).digest('hex') : undefined;
}

async function runOnce() {
  console.log('Collector running in local mode - no Facebook API calls');
  // In local mode, we skip Facebook API calls
  // Test data should be inserted manually via SQL
}

// simple interval loop (every 5 minutes)
const INTERVAL_MS = 5 * 60 * 1000;
runOnce().catch(console.error);
setInterval(() => runOnce().catch(console.error), INTERVAL_MS);

process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
