// Lines 1-4: Import required modules
import 'dotenv/config';                           // Load environment variables
import crypto from 'crypto';                      // For hashing user IDs
import { fetchComments } from './graph.js';       // Facebook API functions
import { upsertPost, insertComment, pool } from './db.js';  // Database functions

// Line 6: Parse post IDs from environment variable
const POSTS = (process.env.FB_POST_IDS || '')    // Get post IDs string
  .split(',')                                     // Split by comma
  .map(s => s.trim())                            // Remove whitespace
  .filter(Boolean);                              // Remove empty strings

// Lines 8-10: Function to hash user IDs for privacy
function hash(s?: string) {
  return s ? crypto.createHash('sha256')         // Create SHA-256 hash
    .update(s)                                   // Add string to hash
    .digest('hex')                               // Get hex representation
    : undefined;                                 // Return undefined if no input
}

// Lines 12-16: Main collection function (modified for local mode)
async function runOnce() {
  console.log('Collector running in local mode - no Facebook API calls');
  // In local mode, we skip Facebook API calls
  // Test data should be inserted manually via SQL
}

// Lines 18-21: Set up periodic execution
const INTERVAL_MS = 5 * 60 * 1000;              // 5 minutes in milliseconds
runOnce().catch(console.error);                  // Run once immediately
setInterval(() => runOnce().catch(console.error), INTERVAL_MS);  // Repeat every 5 minutes

// Line 23: Graceful shutdown handler
process.on('SIGINT', async () => { 
  await pool.end();                              // Close database connections
  process.exit(0);                               // Exit cleanly
});
