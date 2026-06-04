'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  data: Record<number, number[]>  // year → 12 monthly revenue values
}

export function YoYChart({ data }: Props) {
  const years = Object.keys(data).map(Number).sort()
  if (!years.length) return <p className="text-slate-400 text-sm text-center py-8">Not enough data yet.</p>

  const chartData = MONTHS.map((month, i) => {
    const row: Record<string, string | number> = { month }
    years.forEach(year => { row[year] = data[year]?.[i] ?? 0 })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
        <Tooltip formatter={(v: unknown, name: unknown) => [`$${typeof v === 'number' ? v.toFixed(0) : v}`, String(name)]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {years.map((year, i) => (
          <Line key={year} type="monotone" dataKey={year} name={String(year)}
            stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
