interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

export function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div className={`rounded-2xl border p-6 ${accent ? 'bg-sky-500 border-sky-400' : 'bg-white border-slate-200'}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${accent ? 'text-sky-100' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-sky-200' : 'text-slate-400'}`}>{sub}</p>}
    </div>
  )
}
