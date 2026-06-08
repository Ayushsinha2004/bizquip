import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { fetchOpportunities, feedConfigured } from '../lib/feed'

// Source: the `opportunity` table (Bizquip Supabase) via the native-Supabase n8n
// feed. All rows are fetched once and the KPIs are aggregated client-side.
// Columns used (from the opportunity DDL): order_date, order_value, status,
// email_send_status, trigger_type, product_category, company_name, customer, created_at.
// Windows are anchored to the latest order_date in the data (the data's "now").
const HOURS_SAVED_PER_OPPORTUNITY = 0.25 // rep list-prep/analysis saved per opportunity (confirm w/ Bizquip)
const REFRESH_MS = 5 * 60 * 1000

export const TIME_FILTERS = [
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
]
export const filterLabel = (k) => (TIME_FILTERS.find((f) => f.key === k) || {}).label || k

const num = (v) => (v == null ? 0 : Number(v) || 0)
const ACRONYMS = new Set(['FM', 'AV', 'IT', 'HR'])
const prettyTrigger = (code) => String(code || '—').split(/[_\s]+/).map((w) => {
  const u = w.toUpperCase(); return ACRONYMS.has(u) ? u : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
}).join(' ')

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const dayKey = (d) => startOfDay(d).toISOString().slice(0, 10)
const weekStart = (d) => { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }

function compute(rows, filter) {
  const withDate = rows.filter((r) => r.order_date)
  const times = withDate.map((r) => new Date(r.order_date).getTime()).filter((t) => !isNaN(t))
  const anchor = times.length ? new Date(Math.max(...times)) : new Date()

  const def = TIME_FILTERS.find((f) => f.key === filter) || TIME_FILTERS[0]
  let startMs = -Infinity
  if (def.days != null) { const s = startOfDay(anchor); s.setDate(s.getDate() - (def.days - 1)); startMs = s.getTime() }

  const win = withDate.filter((r) => new Date(r.order_date).getTime() >= startMs)
  const opportunities = win.length
  const pipeline_value = win.reduce((a, r) => a + num(r.order_value), 0)
  const customers = new Set(win.map((r) => r.customer ?? r.company_name).filter((x) => x != null)).size

  // weekly trend
  const wk = {}
  win.forEach((r) => { const k = dayKey(weekStart(new Date(r.order_date))); wk[k] = (wk[k] || 0) + 1 })
  const weekly = Object.keys(wk).sort().map((k) => ({ label: new Date(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), count: wk[k] }))

  // top triggers
  const tg = {}
  win.forEach((r) => { const k = prettyTrigger(r.trigger_type); tg[k] = (tg[k] || 0) + 1 })
  const triggers = Object.entries(tg).map(([stage, n]) => ({ stage, n })).sort((a, b) => b.n - a.n).slice(0, 8)

  return {
    kpis: {
      opportunities,
      pipeline_value,
      customers,
      time_saved_h: +(opportunities * HOURS_SAVED_PER_OPPORTUNITY).toFixed(0),
    },
    triggers,
    weekly,
    dataThrough: times.length ? dayKey(anchor) : null,
  }
}

export function useBizquipData(timeFilter = '90d') {
  const raw = useRef(null)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!feedConfigured()) { setError('Feed not configured. Activate the n8n workflow and set the webhook URL in .env.'); setLoading(false); return }
    try {
      raw.current = await fetchOpportunities()
      setError(null)
      setVersion((v) => v + 1)
    } catch (err) {
      setError(err.message || 'Failed to load Bizquip feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  const data = useMemo(() => {
    if (!raw.current) return null
    return compute(raw.current, timeFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, version])

  return { data, loading, error, reload: load }
}
