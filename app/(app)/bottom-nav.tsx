'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/water-flows', label: 'Outlook', icon: '≋' },
  { href: '/trips', label: 'Trips', icon: '◎' },
  { href: '/dashboard', label: 'Home', icon: '◈' },
  { href: '/analytics', label: 'Analytics', icon: 'chart' },
  { href: '/profile', label: 'Profile', icon: '◉' },
]

function LineChartIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 8 13 13 9 9 2 16" />
    </svg>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#0f1f35] border-t border-white/10 flex z-20 md:hidden">
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const color  = active ? '#38bdf8' : '#64748b'
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              active ? 'text-sky-400' : 'text-slate-500'
            }`}
          >
            {icon === 'chart'
              ? <LineChartIcon color={color} />
              : <span className="text-lg">{icon}</span>
            }
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
