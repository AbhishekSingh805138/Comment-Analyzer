import 'dotenv/config';
import crypto from 'crypto';
import { fetchComments } from './graph.js';
import { upsertPost, insertComment, pool } from './db.js';

const POSTS = (process.env.FB_POST_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

function hash(s?: string) {
  return s ? crypto.createHash('sha256').update(s).digest('hex') : undefined;
}

async function runOnce() {
  for (const postId of POSTS) {
    await upsertPost(postId);
    const comments = await fetchComments(postId);
    for (const c of comments) {
      const text = (c.message || '').trim();
      if (!text) continue;
      await insertComment({
        id: c.id,
        post_id: postId,
        text,
        like_count: c.like_count || 0,
        created_time: c.created_time,
        commenter_hash: hash(c.from?.id),
      });
    }
  }
}

// simple interval loop (every 5 minutes)
const INTERVAL_MS = 5 * 60 * 1000;
runOnce().catch(console.error);
setInterval(() => runOnce().catch(console.error), INTERVAL_MS);

process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
