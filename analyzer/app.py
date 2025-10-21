# Lines 1-9: Import required modules
import os, re, json                              # Standard library modules
import psycopg                                   # PostgreSQL async driver
from fastapi import FastAPI                      # Web framework
from fastapi.middleware.cors import CORSMiddleware  # CORS support
from datetime import datetime                    # Date/time handling
from unidecode import unidecode                  # Unicode to ASCII conversion
import emoji                                     # Emoji handling
from langdetect import detect                    # Language detection
from model_bootstrap_light import load_pipelines, STANCE_LABELS  # ML models

# Lines 11-12: Configuration from environment
DB_DSN = f"host={os.getenv('DB_HOST')} port={os.getenv('DB_PORT','5432')} dbname={os.getenv('DB_NAME')} user={os.getenv('DB_USER')} password={os.getenv('DB_PASSWORD')}"
BATCH = int(os.getenv('ANALYZER_BATCH_SIZE', '100'))  # Batch size for processing

# Lines 14-23: FastAPI app setup with CORS
app = FastAPI(title="Comment Analyzer")          # Create FastAPI instance

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                         # Allow all origins (for development)
    allow_credentials=True,                      # Allow credentials
    allow_methods=["*"],                         # Allow all HTTP methods
    allow_headers=["*"],                         # Allow all headers
)

# Line 25: Load ML models
stance_pipe, sentiment_pipe = load_pipelines()

# Lines 27-37: Text normalization function
async def normalize(txt: str) -> str:
    t = txt.strip().lower()                      # Remove whitespace and lowercase
    t = emoji.replace_emoji(t, replace=" ")      # Replace emojis with spaces
    t = re.sub(r"http\S+|www\.\S+", " ", t)     # Remove URLs
    t = re.sub(r"[@#]", " ", t)                 # Remove @ and # symbols
    t = re.sub(r"\s+", " ", t)                  # Normalize whitespace
    try:
        lang = detect(t)                         # Detect language
    except:
        lang = "en"                             # Default to English if detection fails
    return unidecode(t) if lang != "hi" else t  # Convert to ASCII unless Hindi

# Lines 39-46: Get candidate mapping from database
async def resolve_candidate_map(conn):
    cur = conn.cursor()                          # Create database cursor
    await cur.execute("SELECT id, name, aliases FROM candidates")  # Get all candidates
    rows = await cur.fetchall()                  # Fetch results
    mapping = []
    for r in rows:                              # Process each candidate
        mapping.append((r[0], r[1], [a.lower() for a in (r[2] or [])]))  # ID, name, lowercase aliases
    return mapping

# Lines 48-50: Health check endpoint
@app.get("/health")
async def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}  # Return status and timestamp

# Lines 52-98: Main analysis endpoint
@app.post("/analyze")
async def analyze_batch():
    async with await psycopg.AsyncConnection.connect(DB_DSN) as conn:  # Connect to database
        cand_map = await resolve_candidate_map(conn)  # Get candidate mappings
        
        # Lines 55-61: Query for unanalyzed comments
        q = """
            SELECT id, text FROM comments_raw
            WHERE analyzed = FALSE
            ORDER BY created_time ASC
            LIMIT %s
        """
        cur = conn.cursor()
        await cur.execute(q, (BATCH,))           # Execute query with batch limit
        rows = await cur.fetchall()              # Get results
        if not rows:
            return {"processed": 0}              # Return if no comments to process

        to_mark = []                            # Comments to mark as analyzed
        inserts = []                            # Analysis results to insert
        
        # Lines 65-84: Process each comment
        for cid, text in rows:
            clean = await normalize(text)        # Normalize comment text
            candidate_id = None
            
            # Find which candidate is mentioned
            for c_id, c_name, aliases in cand_map:
                for a in aliases + [c_name.lower()]:  # Check name and aliases
                    if re.search(rf"\b{re.escape(a)}\b", clean):  # Word boundary search
                        candidate_id = c_id
                        break
                if candidate_id: break
            
            if candidate_id is None:            # No candidate mentioned
                to_mark.append(cid)             # Just mark as analyzed
                continue

            # Run ML analysis
            stance_out = stance_pipe(clean, STANCE_LABELS, multi_label=False)  # Stance classification
            stance = stance_out["labels"][0]    # Get predicted stance
            sent_out = sentiment_pipe(clean)[0] # Sentiment analysis
            
            # Convert sentiment label to standard format
            sentiment = "neutral"
            label = sent_out["label"].lower()
            if "neg" in label: sentiment = "negative"
            elif "pos" in label: sentiment = "positive"

            # Prepare data for insertion
            inserts.append((cid, candidate_id, stance, sentiment, json.dumps({
                "stance": stance_out,           # Raw stance scores
                "sentiment": sent_out,          # Raw sentiment scores
            })))
            to_mark.append(cid)

        # Lines 86-97: Save results to database
        async with conn.transaction():          # Use database transaction
            if inserts:                         # Insert analysis results
                cur = conn.cursor()
                await cur.executemany(
                    """
                    INSERT INTO analysis_results (comment_id, candidate_id, stance, sentiment, score)
                    VALUES (%s,%s,%s,%s,%s)
                    ON CONFLICT DO NOTHING
                    """,
                    inserts
                )
            if to_mark:                         # Mark comments as analyzed
                cur = conn.cursor()
                await cur.executemany("UPDATE comments_raw SET analyzed = TRUE WHERE id = %s", [(i,) for i in to_mark])

        return {"processed": len(to_mark), "stored": len(inserts)}  # Return processing stats

# Lines 100-111: Summary endpoint for dashboard
@app.get("/summary")
async def summary():
    async with await psycopg.AsyncConnection.connect(DB_DSN) as conn:  # Connect to database
        # Get stance counts
        cur1 = conn.cursor()
        await cur1.execute("SELECT candidate, stance, count FROM v_support_counts")
        sup = await cur1.fetchall()
        
        # Get sentiment counts
        cur2 = conn.cursor()
        await cur2.execute("SELECT candidate, sentiment, count FROM v_sentiment_counts")
        sen = await cur2.fetchall()
        
        # Return formatted results
        return {
            "support": [{"candidate": r[0], "stance": r[1], "count": int(r[2])} for r in sup],
            "sentiment": [{"candidate": r[0], "sentiment": r[1], "count": int(r[2])} for r in sen]
        }

# Lines 113-115: Run server if script executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # Start server on all interfaces, port 8000
