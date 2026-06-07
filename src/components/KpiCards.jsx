const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-GB'))
const eur = (n) => {
  if (n == null) return '—'
  const v = Number(n)
  if (v >= 1_000_000) return '€' + (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return '€' + Math.round(v / 1000) + 'k'
  return '€' + Math.round(v)
}

export function KpiCards({ kpis, windowLabel = 'this period' }) {
  const k = kpis || {}
  const win = windowLabel.toLowerCase()
  const cards = [
    { label: 'Opportunities surfaced', value: fmt(k.opportunities), foot: <>cross-sell/up-sell opportunities found over {win}</> },
    { label: 'Pipeline value', value: eur(k.pipeline_value), foot: <>order value behind those opportunities</> },
    { label: 'Customers reached', value: fmt(k.customers), foot: <>distinct customers with a live opportunity</> },
    { label: 'Time given back', value: k.time_saved_h == null ? '—' : fmt(k.time_saved_h), unit: k.time_saved_h == null ? '' : 'hrs', foot: <>rep list-prep saved · ~15 min per opportunity</> },
  ]
  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <div className="kpi" key={c.label}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value">{c.value}{c.unit ? <span className="unit">{c.unit}</span> : null}</div>
          <div className="kpi-foot">{c.foot}</div>
        </div>
      ))}
    </div>
  )
}
