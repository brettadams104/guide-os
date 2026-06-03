'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No revenue data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
        <Tooltip formatter={(v) => [`$${typeof v === 'number' ? v.toFixed(0) : v}`, 'Revenue']} />
        <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
