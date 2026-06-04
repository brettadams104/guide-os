'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export function RevenueByPackage({ data }: { data: { package: string; revenue: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No package revenue data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="revenue" nameKey="package" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: unknown) => [`$${typeof v === 'number' ? v.toFixed(0) : v}`, 'Revenue']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
