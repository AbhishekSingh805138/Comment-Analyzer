import { Pool } from 'pg';
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function upsertPost(id: string) {
  await pool.query(
    `INSERT INTO posts (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
    [id]
  );
}

export async function insertComment(c: {
  id: string; post_id: string; text: string; like_count: number; created_time: string; commenter_hash?: string;
}) {
  await pool.query(
    `INSERT INTO comments_raw (id, post_id, text, like_count, created_time, commenter_hash)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO NOTHING`,
    [c.id, c.post_id, c.text, c.like_count, c.created_time, c.commenter_hash || null]
  );
}
