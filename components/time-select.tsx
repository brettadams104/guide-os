'use client'

const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts: { label: string; value: string }[] = [{ label: '—', value: '' }]
  for (let h = 4; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) break
      const hh   = String(h).padStart(2, '0')
      const mm   = String(m).padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12  = h % 12 || 12
      opts.push({ label: `${h12}:${mm} ${ampm}`, value: `${hh}:${mm}` })
    }
  }
  return opts
})()

export function TimeSelect({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className ?? 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'}
    >
      {TIME_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
