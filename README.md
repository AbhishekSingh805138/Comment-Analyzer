# Election Comment Analyzer

This repo collects Facebook comments for specified post IDs, classifies stance (support/oppose/neutral) and sentiment, stores results in Postgres, and shows a dashboard.

## Quick Start (Docker, recommended)

1. Install Docker Desktop.
2. Copy environment:
   ```bash
   cp .env.example .env
   # edit .env and fill FB_ACCESS_TOKEN and FB_POST_IDS
   ```
3. Run the stack:
   ```bash
   docker compose up --build
   ```
4. Open the dashboard at http://localhost:3000
5. Trigger analysis (you can repeat this):
   ```bash
   curl -X POST http://localhost:8000/analyze
   ```

## Run in VS Code (no Docker)

> Requires: Node 20+, Python 3.11+, PostgreSQL 15+

1. Create and fill `.env` at project root (copy from `.env.example`). For local (no Docker) set `DB_HOST=localhost`.
2. Start Postgres and create DB/tables:
   ```bash
   psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE comments;"
   psql -U postgres -h localhost -d comments -f db/init.sql
   psql -U postgres -h localhost -d comments -f db/seed_candidates.sql
   ```
3. **Analyzer** (Python) in VS Code terminal:
   ```bash
   cd analyzer
   python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   # ensure .env has DB_ vars accessible to this process or export them in your shell
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```
4. **Collector** (Node) in another VS Code terminal:
   ```bash
   cd collector
   npm i
   npm start
   ```
5. **Dashboard** (Next.js) in another terminal:
   ```bash
   cd dashboard
   npm i
   # if analyzer runs at http://localhost:8000, set NEXT_PUBLIC_ANALYZER_URL in .env
   npm run dev
   ```
6. Open http://localhost:3000 and trigger:
   ```bash
   curl -X POST http://localhost:8000/analyze
   ```

## VS Code tips

- Open the root folder in VS Code (`File > Open Folder`).
- Use the built-in terminals (`Terminal > New Terminal`)—one for each service.
- Install extensions:
  - **Python** (Microsoft)
  - **Pylance**
  - **ESLint**
  - **Prettier**
  - **Docker** (if using Docker)
- Create a `.env` at the repo root and also copy it into `analyzer/.env` if you prefer per-service envs.
- You can add a multi-root workspace with 3 terminals (Collector, Analyzer, Dashboard).

## Testing without Facebook
If you don't have tokens yet, you can manually insert rows into `comments_raw` and see the pipeline:
```sql
INSERT INTO posts(id) VALUES ('dummy_post') ON CONFLICT DO NOTHING;

INSERT INTO comments_raw(id, post_id, text, created_time)
VALUES
 ('c1','dummy_post','Abhishek Singh best candidate!','2025-10-20'),
 ('c2','dummy_post','Priyaji ko vote do','2025-10-20'),
 ('c3','dummy_post','Ravi Kumar bilkul nahi','2025-10-20')
ON CONFLICT DO NOTHING;
```
Then call:
```bash
curl -X POST http://localhost:8000/analyze
```
Refresh the dashboard to see counts.

## Notes
- Use Graph API for public Pages/Posts you have access to. Avoid scraping.
- All commenter IDs are hashed in the collector for privacy.
