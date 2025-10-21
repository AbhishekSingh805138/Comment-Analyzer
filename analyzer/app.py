import os, re, json
import psycopg
from fastapi import FastAPI
from datetime import datetime
from unidecode import unidecode
import emoji
from langdetect import detect
from model_bootstrap_light import load_pipelines, STANCE_LABELS

DB_DSN = f"host={os.getenv('DB_HOST')} port={os.getenv('DB_PORT','5432')} dbname={os.getenv('DB_NAME')} user={os.getenv('DB_USER')} password={os.getenv('DB_PASSWORD')}"
BATCH = int(os.getenv('ANALYZER_BATCH_SIZE', '100'))

app = FastAPI(title="Comment Analyzer")
stance_pipe, sentiment_pipe = load_pipelines()

async def normalize(txt: str) -> str:
    t = txt.strip().lower()
    t = emoji.replace_emoji(t, replace=" ")
    t = re.sub(r"http\S+|www\.\S+", " ", t)
    t = re.sub(r"[@#]", " ", t)
    t = re.sub(r"\s+", " ", t)
    try:
        lang = detect(t)
    except:
        lang = "en"
    return unidecode(t) if lang != "hi" else t

async def resolve_candidate_map(conn):
    cur = conn.cursor()
    await cur.execute("SELECT id, name, aliases FROM candidates")
    rows = await cur.fetchall()
    mapping = []
    for r in rows:
        mapping.append((r[0], r[1], [a.lower() for a in (r[2] or [])]))
    return mapping

@app.get("/health")
async def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

@app.post("/analyze")
async def analyze_batch():
    async with await psycopg.AsyncConnection.connect(DB_DSN) as conn:
        cand_map = await resolve_candidate_map(conn)
        q = """
            SELECT id, text FROM comments_raw
            WHERE analyzed = FALSE
            ORDER BY created_time ASC
            LIMIT %s
        """
        cur = conn.cursor()
        await cur.execute(q, (BATCH,))
        rows = await cur.fetchall()
        if not rows:
            return {"processed": 0}

        to_mark = []
        inserts = []
        for cid, text in rows:
            clean = await normalize(text)
            candidate_id = None
            for c_id, c_name, aliases in cand_map:
                for a in aliases + [c_name.lower()]:
                    if re.search(rf"\b{re.escape(a)}\b", clean):
                        candidate_id = c_id
                        break
                if candidate_id: break
            if candidate_id is None:
                to_mark.append(cid)
                continue

            stance_out = stance_pipe(clean, STANCE_LABELS, multi_label=False)
            stance = stance_out["labels"][0]
            sent_out = sentiment_pipe(clean)[0]
            sentiment = "neutral"
            label = sent_out["label"].lower()
            if "neg" in label: sentiment = "negative"
            elif "pos" in label: sentiment = "positive"

            inserts.append((cid, candidate_id, stance, sentiment, json.dumps({
                "stance": stance_out,
                "sentiment": sent_out,
            })))
            to_mark.append(cid)

        async with conn.transaction():
            if inserts:
                cur = conn.cursor()
                await cur.executemany(
                    """
                    INSERT INTO analysis_results (comment_id, candidate_id, stance, sentiment, score)
                    VALUES (%s,%s,%s,%s,%s)
                    ON CONFLICT DO NOTHING
                    """,
                    inserts
                )
            if to_mark:
                cur = conn.cursor()
                await cur.executemany("UPDATE comments_raw SET analyzed = TRUE WHERE id = %s", [(i,) for i in to_mark])

        return {"processed": len(to_mark), "stored": len(inserts)}

@app.get("/summary")
async def summary():
    async with await psycopg.AsyncConnection.connect(DB_DSN) as conn:
        cur1 = conn.cursor()
        await cur1.execute("SELECT candidate, stance, count FROM v_support_counts")
        sup = await cur1.fetchall()
        cur2 = conn.cursor()
        await cur2.execute("SELECT candidate, sentiment, count FROM v_sentiment_counts")
        sen = await cur2.fetchall()
        return {
            "support": [{"candidate": r[0], "stance": r[1], "count": int(r[2])} for r in sup],
            "sentiment": [{"candidate": r[0], "sentiment": r[1], "count": int(r[2])} for r in sen]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
