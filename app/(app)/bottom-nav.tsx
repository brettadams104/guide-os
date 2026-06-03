'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: '◈' },
  { href: '/trips', label: 'Trips', icon: '◎' },
  { href: '/calendar', label: 'Calendar', icon: '▦' },
  { href: '/financials', label: 'Financials', icon: '$' },
  { href: '/analytics', label: 'Analytics', icon: '▲' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#0f1f35] border-t border-white/10 flex z-20 md:hidden">
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              active ? 'text-sky-400' : 'text-slate-500'
            }`}
          >
            <span className="text-lg">{icon}</span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
