import Link from 'next/link'

interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  warning?: boolean
  href?: string
}

export function StatCard({ label, value, sub, accent, warning, href }: Props) {
  const className = `rounded-2xl border p-6 ${
    accent   ? 'bg-sky-500 border-sky-400' :
    warning  ? 'bg-amber-50 border-amber-200' :
    'bg-white border-slate-200'
  } ${href ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''}`

  const content = (
    <>
      <p className={`text-xs font-semibold uppercase tracking-widest ${accent ? 'text-sky-100' : warning ? 'text-amber-600' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 ${accent ? 'text-white' : warning ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-sky-200' : warning ? 'text-amber-500' : 'text-slate-400'}`}>{sub}</p>}
    </>
  )

  if (href) {
    return <Link href={href} className={className}>{content}</Link>
  }

  return <div className={className}>{content}</div>
}
