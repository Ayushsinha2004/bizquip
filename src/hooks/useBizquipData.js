import { useState, useEffect, useCallback, useRef } from 'react'
import { runSql, feedConfigured } from '../lib/feed'

// ── Reconciled against the LIVE Bizquip schema (2026-06-08) ──────────────────
// Live table: `opportunities` (10,671 rows). Key columns:
//   order_date (date)         — the triggering sales order date = the real time axis
//   order_value (numeric)     — € value of that order  (Σ ≈ €7.75M)
//   customer_id               — distinct customers reached (≈236)
//   trigger_name              — cross-sell trigger code (SUPPLIES_NO_FM, TONER_NO_PAPER, …)
//   trigger_type, sales_rep, status, is_actioned, created_at
// NOTE: `created_at` is a Feb-2026 *migration* timestamp (all rows in a 12-day blob),
// so every window/trend is anchored to `order_date` instead. status is ~all 'pending'
// and is_actioned ~all true, so they're not used as progression metrics.
// The other tables (opportunity, customer, rejected_opportunity) are currently empty.
const HOURS_SAVED_PER_OPPORTUNITY = 0.25 // rep list-prep/analysis saved per opportunity (confirm w/ Bizquip)
const REFRESH_MS = 60 * 1000

export const TIME_FILTERS = [
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
]
export const filterLabel = (k) => (TIME_FILTERS.find((f) => f.key === k) || {}).label || k

// Windows are anchored to the latest order_date in the data (the data's "now"),
// computed server-side — the dataset is historical (Nov 2025–Jan 2026).
function whereClause(filter) {
  const def = TIME_FILTERS.find((f) => f.key === filter) || TIME_FILTERS[0]
  if (def.days == null) return ''
  return `where order_date >= (select max(order_date) from opportunities) - interval '${def.days} days'`
}
const num = (v) => (v == null ? 0 : Number(v) || 0)
const ACRONYMS = new Set(['FM', 'AV', 'IT', 'HR'])
function prettyTrigger(code) {
  return String(code).split('_').map((w) => {
    const u = w.toUpperCase()
    return ACRONYMS.has(u) ? u : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  }).join(' ')
}

export function useBizquipData(timeFilter = '90d') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const timer = useRef(null)

  const load = useCallback(async () => {
    if (!feedConfigured()) { setError('Feed not configured. Deploy the n8n workflow and set the webhook URL in .env.'); setLoading(false); return }
    setLoading(true)
    const w = whereClause(timeFilter)
    try {
      const [kpi, triggers, trend, anchor] = await Promise.all([
        runSql(`select count(*)::int opps, coalesce(sum(order_value),0)::float val, count(distinct customer_id)::int custs from opportunities ${w}`),
        runSql(`select coalesce(trigger_name,'—') g, count(*)::int n from opportunities ${w} group by 1 order by 2 desc limit 8`),
        runSql(`select to_char(date_trunc('week', order_date),'YYYY-MM-DD') wk, count(*)::int n from opportunities ${w} group by 1 order by 1`),
        runSql(`select to_char(max(order_date),'YYYY-MM-DD') mx from opportunities`),
      ])
      const k = kpi?.[0] || {}
      const opps = num(k.opps)
      setData({
        kpis: {
          opportunities: opps,
          pipeline_value: num(k.val),
          customers: num(k.custs),
          time_saved_h: +(opps * HOURS_SAVED_PER_OPPORTUNITY).toFixed(0),
        },
        triggers: (triggers || []).map((r) => ({ stage: prettyTrigger(r.g), n: num(r.n) })),
        weekly: (trend || []).map((r) => ({ label: new Date(r.wk).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), count: num(r.n) })),
        dataThrough: anchor?.[0]?.mx || null,
      })
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load Bizquip feed')
    } finally {
      setLoading(false)
    }
  }, [timeFilter])

  useEffect(() => {
    load()
    timer.current = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer.current)
  }, [load])

  return { data, loading, error, reload: load }
}
