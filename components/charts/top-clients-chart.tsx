'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6']

export function TopClientsChart({ data }: { data: { name: string; revenue: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No client data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(v: unknown) => [`$${typeof v === 'number' ? v.toFixed(0) : v}`, 'Revenue']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
