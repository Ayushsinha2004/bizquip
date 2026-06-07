import { TIME_FILTERS } from '../hooks/useBizquipData'

export function Header({ timeFilter, onTimeFilterChange, live, dataThrough }) {
  const through = dataThrough
    ? new Date(dataThrough).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  return (
    <header className="hdr">
      <div className="hdr-brand">
        <img className="hdr-logo-img" src="/bizquip-white.png" alt="Bizquip" />
        <span className="hdr-divider" />
        <div>
          <div className="hdr-title">Cross-Sell Engine<span className="beta">PERFORMANCE</span></div>
          <div className="hdr-sub">AI cross-sell &amp; up-sell · opportunities surfaced from Intact iQ</div>
        </div>
      </div>
      <div className="hdr-right">
        <div className="filter" role="tablist" aria-label="Time range">
          {TIME_FILTERS.map((f) => (
            <button key={f.key}
              className={`filter-btn${timeFilter === f.key ? ' active' : ''}`}
              onClick={() => onTimeFilterChange(f.key)} aria-selected={timeFilter === f.key}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="hdr-meta">
          <span className={`dot${live ? '' : ' stale'}`} />{live ? 'Live' : 'Awaiting feed'}
          {live && through ? <span> · orders through {through}</span> : null}
        </div>
      </div>
    </header>
  )
}
