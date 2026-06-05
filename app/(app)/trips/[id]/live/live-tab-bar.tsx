'use client'

import Link from 'next/link'

function SunIcon({ active }: { active: boolean }) {
  const c = active ? '#38bdf8' : '#64748b'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
      <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="16.95" y2="7.05" />
      <line x1="7.05" y1="16.95" x2="4.93" y2="19.07" />
    </svg>
  )
}

function FishIcon({ active }: { active: boolean }) {
  const c = active ? '#38bdf8' : '#64748b'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Body */}
      <path d="M2 12c2-4 6-6 10-6s8 2 10 6c-2 4-6 6-10 6S4 16 2 12z" />
      {/* Tail fin */}
      <path d="M2 12 L-2 8 M2 12 L-2 16" transform="translate(2,0)" />
      {/* Eye */}
      <circle cx="17" cy="11" r="1" fill={c} stroke="none" />
    </svg>
  )
}

function CameraIcon({ active }: { active: boolean }) {
  const c = active ? '#38bdf8' : '#64748b'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Body */}
      <rect x="2" y="8" width="20" height="13" rx="2" />
      {/* Lens */}
      <circle cx="12" cy="14.5" r="3.5" />
      {/* Viewfinder bump */}
      <path d="M8 8V6.5A1.5 1.5 0 0 1 9.5 5h5A1.5 1.5 0 0 1 16 6.5V8" />
      {/* Flash dot */}
      <circle cx="18.5" cy="11.5" r="0.75" fill={c} stroke="none" />
    </svg>
  )
}

function NotepadIcon({ active }: { active: boolean }) {
  const c = active ? '#38bdf8' : '#64748b'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round">
      {/* Page */}
      <rect x="4" y="3" width="16" height="18" rx="2" />
      {/* Lines */}
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
      {/* Binding top */}
      <line x1="9" y1="1" x2="9" y2="5" />
      <line x1="15" y1="1" x2="15" y2="5" />
    </svg>
  )
}

const TABS = [
  { key: 'weather', label: 'Weather', Icon: SunIcon },
  { key: 'fish',    label: 'Fish Log', Icon: FishIcon },
  { key: 'photos',  label: 'Photos',   Icon: CameraIcon },
  { key: 'notes',   label: 'Notes',    Icon: NotepadIcon },
]

export function LiveTabBar({ tripId, activeTab }: { tripId: string; activeTab: string }) {
  return (
    <nav className="bg-[#0f1f35] border-t border-white/10 flex shrink-0">
      {TABS.map(({ key, label, Icon }) => (
        <Link
          key={key}
          href={`/trips/${tripId}/live?tab=${key}`}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
            activeTab === key ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Icon active={activeTab === key} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
