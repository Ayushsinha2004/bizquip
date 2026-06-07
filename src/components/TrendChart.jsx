import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function TrendChart({ weekly, windowLabel }) {
  return (
    <div className="card">
      <div className="panel-head">
        <span className="panel-title">Opportunities surfaced — weekly</span>
        <span className="hint">{windowLabel}</span>
      </div>
      <div style={{ padding: '14px 12px 16px' }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={weekly || []} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="bz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea7b26" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ea7b26" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e3e8f0" vertical={false} />
            <XAxis dataKey="label" stroke="#8a97a8" tickLine={false} axisLine={false} fontSize={12} minTickGap={18} interval="preserveStartEnd" />
            <YAxis stroke="#8a97a8" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e3e8f0', borderRadius: 8, color: '#0f2440' }}
              labelStyle={{ color: '#5b6b82' }}
              formatter={(v) => [`${v} opportunities`, 'Surfaced']}
            />
            <Area type="monotone" dataKey="count" stroke="#ea7b26" strokeWidth={2.5} fill="url(#bz)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
