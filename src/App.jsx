import { useState } from 'react'
import { useBizquipData, filterLabel } from './hooks/useBizquipData'
import { Header } from './components/Header'
import { KpiCards } from './components/KpiCards'
import { StageFunnel } from './components/StageFunnel'
import { TrendChart } from './components/TrendChart'

export default function App() {
  const [timeFilter, setTimeFilter] = useState('90d')
  const { data, loading, error } = useBizquipData(timeFilter)
  const label = filterLabel(timeFilter)
  const live = !error && !!data

  if (loading && !data && !error) {
    return (<div className="loading-screen"><div className="spinner" /><span>Loading Bizquip performance…</span></div>)
  }

  return (
    <div className="dashboard">
      <Header timeFilter={timeFilter} onTimeFilterChange={setTimeFilter} live={live} dataThrough={data?.dataThrough} />

      {error && (
        <div className="banner banner-info">
          <b>Live feed not connected.</b> Import <code>n8n/Bizquip Results Engine - KPI Feed.json</code> into the
          Bizquip n8n, attach a read-only Postgres credential, activate it, then set the webhook URL in <code>.env</code>.
          <br /><span style={{ color: 'var(--text-dim)' }}>({error})</span>
        </div>
      )}

      <p className="section-label">{label} · at a glance</p>
      <KpiCards kpis={data?.kpis} windowLabel={label} />

      <p className="section-label">Pipeline &amp; activity</p>
      <div className="grid-2">
        <TrendChart weekly={data?.weekly} windowLabel={label} />
        <StageFunnel stages={data?.triggers} title="Top cross-sell triggers" hint={label} />
      </div>

      <p className="note">
        Live, read-only view of the Bizquip cross-sell engine — opportunities surfaced from Intact iQ sales orders,
        read from the platform's own database via a read-only n8n feed. Windows and the weekly trend are anchored to the
        order date (the dataset currently runs to Jan 2026). "Time given back" uses a conservative ~15 minutes of rep
        list-prep saved per opportunity surfaced (assumption to confirm with the Bizquip sales lead). Never includes fees.
      </p>
    </div>
  )
}
