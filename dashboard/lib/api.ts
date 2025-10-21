export async function fetchSummary() {
  const res = await fetch(process.env.NEXT_PUBLIC_ANALYZER_URL || 'http://localhost:8000/summary', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
