'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS: Record<string, string> = {
  cash: '#10b981', card: '#0ea5e9', venmo: '#6366f1',
  zelle: '#8b5cf6', check: '#f59e0b', other: '#94a3b8'
}

export function PaymentMethodDonut({ data }: { data: { method: string; amount: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No payment data yet.</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="method" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
          {data.map((d, i) => <Cell key={i} fill={COLORS[d.method] ?? '#94a3b8'} />)}
        </Pie>
        <Tooltip formatter={(v: unknown) => [`$${typeof v === 'number' ? v.toFixed(0) : v}`, '']} />
        <Legend formatter={v => v.charAt(0).toUpperCase() + v.slice(1)} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
