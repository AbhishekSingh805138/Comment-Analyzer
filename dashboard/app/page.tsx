'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Support = { candidate: string; stance: 'support'|'oppose'|'neutral'; count: number };
type Sentiment = { candidate: string; sentiment: 'positive'|'negative'|'neutral'; count: number };

export default function Page() {
  const [support, setSupport] = useState<Support[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment[]>([]);

  async function load() {
    const res = await fetch(process.env.NEXT_PUBLIC_ANALYZER_URL || 'http://localhost:8000/summary', { cache: 'no-store' });
    const data = await res.json();
    setSupport(data.support);
    setSentiment(data.sentiment);
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const byCandidate = (rows: Support[]) => {
    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.candidate] ??= { candidate: r.candidate, support: 0, oppose: 0, neutral: 0 };
      (map[r.candidate] as any)[r.stance] = r.count;
    }
    return Object.values(map);
  };

  const byCandidateSent = (rows: Sentiment[]) => {
    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.candidate] ??= { candidate: r.candidate, positive: 0, negative: 0, neutral: 0 };
      (map[r.candidate] as any)[r.sentiment] = r.count;
    }
    return Object.values(map);
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Support vs Oppose (by candidate)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCandidate(support)}>
              <XAxis dataKey="candidate" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="support" />
              <Bar dataKey="oppose" />
              <Bar dataKey="neutral" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Sentiment (by candidate)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCandidateSent(sentiment)}>
              <XAxis dataKey="candidate" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" />
              <Bar dataKey="negative" />
              <Bar dataKey="neutral" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
