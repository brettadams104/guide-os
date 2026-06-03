'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function FishByMoon({ data }: { data: { phase: string; avg: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">Not enough trip data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="phase" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Avg fish']} />
        <Bar dataKey="avg" radius={[4,4,0,0]} fill="#0ea5e9" />
      </BarChart>
    </ResponsiveContainer>
  )
}
