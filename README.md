# Election Comment Analyzer

A complete system that collects Facebook comments, analyzes them for stance (support/oppose/neutral) and sentiment, stores results in PostgreSQL, and displays insights through a web dashboard.

## 🚀 Quick Start Options

Choose your preferred setup method:

### Option 1: Docker (Recommended - Easiest)
- ✅ No local dependencies needed
- ✅ Everything runs in containers
- ✅ Works on Windows, Mac, Linux

### Option 2: Local Development
- ✅ Direct access to code
- ✅ Faster development cycle
- ⚠️ Requires Node.js, Python, PostgreSQL

---

## 🐳 Docker Setup

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### A. Running WITHOUT Facebook API (Local Testing)

**Step 1: Clone and Setup**
```bash
git clone <your-repo-url>
cd comment-analyzer
cp .env.example .env
```

**Step 2: Edit Environment File**
Open `.env` and ensure these settings:
```env
# Database (keep as-is for Docker)
DB_HOST=db
DB_PORT=5432
DB_NAME=comments
DB_USER=postgres
DB_PASSWORD=Kishan8051

# Facebook (leave as placeholders for local testing)
FB_APP_ID=YOUR_APP_ID
FB_APP_SECRET=YOUR_APP_SECRET
FB_ACCESS_TOKEN=PLACEHOLDER
FB_POST_IDS=dummy_post

# Dashboard (important for local testing)
NEXT_PUBLIC_ANALYZER_URL=http://localhost:8000/summary
```

**Step 3: Start All Services**
```bash
docker compose up --build
```

**Step 4: Add Test Data**
```bash
# Add sample comments to analyze
docker exec -it comment-analyzer-db-1 psql -U postgres -d comments -c "
INSERT INTO posts(id) VALUES ('dummy_post') ON CONFLICT DO NOTHING;
INSERT INTO comments_raw(id, post_id, text, created_time) VALUES 
('c1','dummy_post','Abhishek Singh best candidate!','2025-10-21'),
('c2','dummy_post','Priyaji ko vote do','2025-10-21'),
('c3','dummy_post','Ravi Kumar bilkul nahi','2025-10-21'),
('c4','dummy_post','I support Priya Sharma completely','2025-10-21'),
('c5','dummy_post','Abhishekji is terrible choice','2025-10-21')
ON CONFLICT DO NOTHING;
"
```

**Step 5: Analyze Comments**
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/analyze" -Method POST

# Mac/Linux
curl -X POST http://localhost:8000/analyze
```

**Step 6: View Dashboard**
Open http://localhost:3000 in your browser (first load may take 30 seconds)

### B. Running WITH Facebook API

**Step 1-2: Same as above**

**Step 3: Get Facebook Credentials**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and get:
   - App ID
   - App Secret
   - Access Token (long-lived page token recommended)
   - Post IDs you want to monitor

**Step 4: Update Environment**
Edit `.env`:
```env
# Facebook API (replace with your actual values)
FB_APP_ID=your_actual_app_id
FB_APP_SECRET=your_actual_app_secret
FB_ACCESS_TOKEN=your_actual_long_lived_token
FB_POST_IDS=post_id_1,post_id_2,post_id_3
```

**Step 5: Start Services**
```bash
docker compose up --build
```

**Step 6: Monitor**
- Dashboard: http://localhost:3000
- API: http://localhost:8000/summary
- The collector will automatically fetch comments every 5 minutes

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20+ ([Download](https://nodejs.org/))
- Python 3.11+ ([Download](https://www.python.org/downloads/))
- PostgreSQL 15+ ([Download](https://www.postgresql.org/download/))

### A. Local Setup WITHOUT Facebook API

**Step 1: Clone and Setup**
```bash
git clone <your-repo-url>
cd comment-analyzer
cp .env.example .env
```

**Step 2: Edit Environment for Local**
Open `.env`:
```env
# Database (localhost for local development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=comments
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Facebook (placeholders for local testing)
FB_APP_ID=YOUR_APP_ID
FB_APP_SECRET=YOUR_APP_SECRET
FB_ACCESS_TOKEN=PLACEHOLDER
FB_POST_IDS=dummy_post

# Dashboard
NEXT_PUBLIC_ANALYZER_URL=http://localhost:8000/summary
```

**Step 3: Setup Database**
```bash
# Create database and tables
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE comments;"
psql -U postgres -h localhost -d comments -f db/init.sql
psql -U postgres -h localhost -d comments -f db/seed_candidates.sql
```

**Step 4: Start Analyzer (Terminal 1)**
```bash
cd analyzer
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements_light.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

**Step 5: Start Dashboard (Terminal 2)**
```bash
cd dashboard
npm install
npm run dev
```

**Step 6: Add Test Data**
```bash
# Connect to your local PostgreSQL
psql -U postgres -h localhost -d comments -c "
INSERT INTO posts(id) VALUES ('dummy_post') ON CONFLICT DO NOTHING;
INSERT INTO comments_raw(id, post_id, text, created_time) VALUES 
('c1','dummy_post','Abhishek Singh best candidate!','2025-10-21'),
('c2','dummy_post','Priyaji ko vote do','2025-10-21'),
('c3','dummy_post','Ravi Kumar bilkul nahi','2025-10-21')
ON CONFLICT DO NOTHING;
"
```

**Step 7: Test**
- Analyze: `curl -X POST http://localhost:8000/analyze`
- Dashboard: http://localhost:3000

### B. Local Setup WITH Facebook API

**Steps 1-3: Same as above**

**Step 4: Get Facebook credentials and update `.env`**

**Step 5: Start All Services**

**Analyzer (Terminal 1):**
```bash
cd analyzer
python -m venv .venv
# Activate venv (see above)
pip install -r requirements.txt  # Full requirements with transformers
uvicorn app:app --host 0.0.0.0 --port 8000
```

**Collector (Terminal 2):**
```bash
cd collector
npm install
npm start
```

**Dashboard (Terminal 3):**
```bash
cd dashboard
npm install
npm run dev
```

---

## 🔧 Usage Commands

### Adding More Test Data
```bash
# Docker
docker exec -it comment-analyzer-db-1 psql -U postgres -d comments -c "
INSERT INTO comments_raw(id, post_id, text, created_time) VALUES 
('c6','dummy_post','New comment text here','2025-10-21');
"

# Local
psql -U postgres -h localhost -d comments -c "
INSERT INTO comments_raw(id, post_id, text, created_time) VALUES 
('c6','dummy_post','New comment text here','2025-10-21');
"
```

### Triggering Analysis
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/analyze" -Method POST

# Mac/Linux/Git Bash
curl -X POST http://localhost:8000/analyze
```

### Checking API Status
```bash
# Health check
curl http://localhost:8000/health

# Get analysis results
curl http://localhost:8000/summary
```

### Stopping Services
```bash
# Docker
docker compose down

# Local (Ctrl+C in each terminal)
```

---

## 📊 What You'll See

### Dashboard Features
- **Support vs Oppose Charts**: Visual breakdown of stance analysis
- **Sentiment Analysis**: Positive/negative/neutral sentiment tracking
- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Candidate Tracking**: Pre-configured for Abhishek Singh, Priya Sharma, Ravi Kumar

### API Endpoints
- `GET /health` - Service health check
- `POST /analyze` - Trigger comment analysis
- `GET /summary` - Get analysis results

---

## 🛠️ Troubleshooting

### Common Issues

**Dashboard shows "This site can't be reached"**
- Wait 30 seconds for Next.js to compile
- Check if port 3000 is available
- Restart dashboard: `docker compose restart dashboard`

**"Connection refused" errors**
- Ensure all services are running: `docker compose ps`
- Check logs: `docker logs comment-analyzer-[service-name]-1`

**Empty charts on dashboard**
- Add test data (see commands above)
- Trigger analysis: `curl -X POST http://localhost:8000/analyze`
- Check API: `curl http://localhost:8000/summary`

**Facebook API errors (when using real API)**
- Verify your access token is valid
- Check post IDs are accessible
- Ensure you have proper permissions

### Getting Help
1. Check service logs: `docker compose logs [service-name]`
2. Verify all containers are running: `docker compose ps`
3. Test API directly: `curl http://localhost:8000/health`

---

## 🏗️ Architecture

- **Collector** (Node.js): Fetches Facebook comments
- **Analyzer** (Python/FastAPI): ML analysis using transformers
- **Dashboard** (Next.js): Web interface with charts
- **Database** (PostgreSQL): Data storage

## 📝 Notes

- Uses lightweight mock ML models for local testing (fast)
- Full transformer models available for production use
- All commenter IDs are hashed for privacy
- Supports both Hindi and English text analysis
