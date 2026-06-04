'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function RevenueAreaChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No revenue data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
        <Tooltip formatter={(v: unknown) => [`$${typeof v === 'number' ? v.toFixed(0) : v}`, 'Revenue']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#revenueGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
