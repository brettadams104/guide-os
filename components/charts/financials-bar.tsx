'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

export function FinancialsBar({ data }: { data: { month: string; revenue: number; outstanding: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No financial data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
        <Tooltip formatter={(v: unknown) => [`$${typeof v === 'number' ? v.toFixed(0) : v}`, '']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name="Collected" fill="#0ea5e9" radius={[4,4,0,0]} />
        <Bar dataKey="outstanding" name="Outstanding" fill="#fbbf24" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
