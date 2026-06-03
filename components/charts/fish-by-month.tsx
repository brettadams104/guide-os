'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function FishByMonth({ data }: { data: { month: string; count: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No catch data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [v, 'Fish']} />
        <Bar dataKey="count" radius={[4,4,0,0]} fill="#6366f1" />
      </BarChart>
    </ResponsiveContainer>
  )
}
