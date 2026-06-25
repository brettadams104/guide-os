'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/water-flows', label: 'Outlook', icon: '≋' },
  { href: '/trips', label: 'Trips', icon: '◎' },
  { href: '/dashboard', label: 'Home', icon: '◈' },
  { href: '/analytics', label: 'Analytics', icon: 'barchart' },
  { href: '/profile', label: 'Profile', icon: '◉' },
]

function BarChartIcon({ color }: { color: string }) {
  return (
    <span className="text-lg leading-none flex items-center justify-center" style={{ height: '1.75rem' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/>
      </svg>
    </span>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#0f1f35] border-t border-white/10 flex z-50 md:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const color  = active ? '#38bdf8' : '#64748b'
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0 py-1.5 px-0 text-[10px] font-semibold transition-colors min-w-0 ${
              active ? 'text-sky-400' : 'text-slate-500'
            }`}
          >
            {icon === 'barchart'
              ? <BarChartIcon color={color} />
              : <span className="text-lg leading-none">{icon}</span>
            }
            <span className="truncate w-full text-center leading-tight">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
