'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#0ea5e9','#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']

export function SpeciesDonut({ data }: { data: { species: string; count: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No catch data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Pie
          data={data}
          dataKey="count"
          nameKey="species"
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={95}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: unknown) => [`${v} fish`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
