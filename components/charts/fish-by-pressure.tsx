'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function FishByPressure({ data }: { data: { trend: string; avg: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">Not enough data yet.</p>
  const colors: Record<string, string> = { rising: '#10b981', steady: '#0ea5e9', falling: '#ef4444' }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="trend" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Avg fish']} />
        <Bar dataKey="avg" radius={[4,4,0,0]}>
          {data.map((d, i) => <Cell key={i} fill={colors[d.trend] ?? '#0ea5e9'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
