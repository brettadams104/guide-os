'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  years: number[]
  selected: number | null
}

export function YearSelector({ years, selected }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  function select(year: number | null) {
    const p = new URLSearchParams(params.toString())
    if (year) p.set('year', String(year))
    else p.delete('year')
    router.push(`/financials?${p.toString()}`)
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <span className="text-xs text-slate-500 font-medium">Filter by year:</span>
      <button
        onClick={() => select(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
          !selected ? 'bg-[#0f1f35] text-white border-[#0f1f35]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
        }`}
      >
        All Time
      </button>
      {years.map(y => (
        <button
          key={y}
          onClick={() => select(y)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            selected === y ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  )
}
