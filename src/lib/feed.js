// Bizquip — hand-made mode. The n8n webhook uses the native Supabase node to
// "Get Many" rows from the `opportunity` table and returns them as a JSON array.
// We fetch the rows once and aggregate the KPIs client-side (PostgREST/Supabase
// returns rows, not SQL aggregates). The body is ignored by the native node.

const USE_PROXY = import.meta.env.VITE_BIZQUIP_USE_PROXY === '1'
const WEBHOOK_URL = import.meta.env.VITE_BIZQUIP_WEBHOOK_URL
const ENDPOINT = USE_PROXY ? '/feed' : WEBHOOK_URL

export function feedConfigured() {
  return Boolean(USE_PROXY || WEBHOOK_URL)
}

// Fetch all `opportunity` rows through the feed. Returns an array of row objects.
export async function fetchOpportunities() {
  if (!ENDPOINT) throw new Error('Feed not configured — set VITE_BIZQUIP_USE_PROXY=1 (or VITE_BIZQUIP_WEBHOOK_URL) in .env')
  let res
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  } catch (e) {
    throw new Error('Feed unreachable — is the n8n workflow active with a Supabase credential attached?')
  }
  if (!res.ok) throw new Error(`Feed returned HTTP ${res.status}`)

  const text = await res.text()
  if (!text || !text.trim()) {
    throw new Error('Feed returned empty — the workflow is likely inactive or missing its Supabase credential.')
  }
  let data
  try { data = JSON.parse(text) } catch (e) { throw new Error('Feed returned a non-JSON response.') }
  if (!Array.isArray(data)) data = data == null ? [] : [data]

  // Unwrap n8n item shape ({json: row}) if present.
  const rows = data.map((it) => (it && typeof it === 'object' && 'json' in it ? it.json : it))
  // Surface an n8n / Supabase error returned as a single object.
  if (rows.length === 1 && rows[0] && (rows[0].error || rows[0].message) && !('order_date' in rows[0])) {
    throw new Error(String(rows[0].error || rows[0].message))
  }
  return rows
}
