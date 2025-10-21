'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Support = { candidate: string; stance: 'support'|'oppose'|'neutral'; count: number };
type Sentiment = { candidate: string; sentiment: 'positive'|'negative'|'neutral'; count: number };

export default function Page() {
  const [support, setSupport] = useState<Support[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const url = process.env.NEXT_PUBLIC_ANALYZER_URL || 'http://localhost:8000/summary';
      console.log('Fetching from:', url);
      
      const res = await fetch(url, { 
        cache: 'no-store',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Data received:', data);
      
      setSupport(data.support || []);
      setSentiment(data.sentiment || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <br />
          <button 
            onClick={load} 
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
