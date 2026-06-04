'use client'

import Link from 'next/link'

const TABS = [
  { key: 'weather', icon: '🌤', label: 'Weather' },
  { key: 'fish', icon: '🎣', label: 'Fish Log' },
  { key: 'photos', icon: '📷', label: 'Photos' },
  { key: 'notes', icon: '📝', label: 'Notes' },
]

export function LiveTabBar({ tripId, activeTab }: { tripId: string; activeTab: string }) {
  return (
    <nav className="bg-[#0f1f35] border-t border-white/10 flex shrink-0">
      {TABS.map(t => (
        <Link
          key={t.key}
          href={`/trips/${tripId}/live?tab=${t.key}`}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
            activeTab === t.key ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="text-xl">{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
