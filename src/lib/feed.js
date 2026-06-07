// Bizquip is hand-made mode: numbers come from the n8n read-only SQL webhook on
// the Bizquip VM (n8n/Bizquip Results Engine - KPI Feed.json). The browser POSTs
// {sql} to /feed; the Vite proxy forwards it server-side (no CORS preflight).
//
// The webhook runs ONE guarded read-only SELECT and returns the rows. We send
// application/json (routed via the proxy so it never preflights in the browser).

const USE_PROXY = import.meta.env.VITE_BIZQUIP_USE_PROXY === '1'
const WEBHOOK_URL = import.meta.env.VITE_BIZQUIP_WEBHOOK_URL
const ENDPOINT = USE_PROXY ? '/feed' : WEBHOOK_URL

export function feedConfigured() {
  return Boolean(USE_PROXY || WEBHOOK_URL)
}

// Run a single read-only SQL query through the feed and return an array of row objects.
export async function runSql(sql) {
  if (!ENDPOINT) throw new Error('Feed not configured — set VITE_BIZQUIP_USE_PROXY=1 (or VITE_BIZQUIP_WEBHOOK_URL) in .env')
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    })
  } catch (e) {
    throw new Error('Feed unreachable — is the n8n workflow imported, activated, and the URL set?')
  }
  if (!res.ok) throw new Error(`Feed returned HTTP ${res.status} — check the n8n workflow is active`)

  let data = await res.json()
  if (!Array.isArray(data)) data = [data]
  // Unwrap n8n item shape ({json: row}) if present.
  const rows = data.map((it) => (it && typeof it === 'object' && 'json' in it ? it.json : it))
  // Surface a guard / Postgres error returned as a row.
  if (rows.length === 1 && rows[0] && (rows[0].error || rows[0].errorMessage)) {
    throw new Error(String(rows[0].error || rows[0].errorMessage))
  }
  return rows
}
