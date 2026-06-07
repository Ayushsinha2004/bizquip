export function StageFunnel({ stages, title = 'Breakdown', hint = '' }) {
  const rows = stages || []
  const max = rows.reduce((m, s) => Math.max(m, s.n), 0) || 1
  return (
    <div className="card">
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        {hint ? <span className="hint">{hint}</span> : null}
      </div>
      <div style={{ padding: '12px 0 16px' }}>
        {rows.length === 0 && (
          <div style={{ padding: '8px 20px', color: 'var(--text-faint)', fontSize: 13 }}>No data yet.</div>
        )}
        {rows.map((s) => (
          <div className="stage-row" key={s.stage}>
            <span className="stage-name" title={s.stage}>{s.stage}</span>
            <span className="stage-bar-wrap"><span className="stage-bar" style={{ width: `${Math.max(4, (s.n / max) * 100)}%` }} /></span>
            <span className="stage-n">{s.n.toLocaleString('en-GB')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
