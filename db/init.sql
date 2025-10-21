CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  candidate_hint INTEGER NULL REFERENCES candidates(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments_raw (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  commenter_hash TEXT,
  text TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_time TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  analyzed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id BIGSERIAL PRIMARY KEY,
  comment_id TEXT REFERENCES comments_raw(id) ON DELETE CASCADE,
  candidate_id INTEGER REFERENCES candidates(id),
  stance TEXT CHECK (stance IN ('support','oppose','neutral')),
  sentiment TEXT CHECK (sentiment IN ('positive','negative','neutral')),
  score JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE VIEW v_support_counts AS
SELECT c.name AS candidate,
       ar.stance,
       COUNT(*) AS count
FROM analysis_results ar
JOIN candidates c ON c.id = ar.candidate_id
GROUP BY c.name, ar.stance;

CREATE VIEW v_sentiment_counts AS
SELECT c.name AS candidate,
       ar.sentiment,
       COUNT(*) AS count
FROM analysis_results ar
JOIN candidates c ON c.id = ar.candidate_id
GROUP BY c.name, ar.sentiment;
