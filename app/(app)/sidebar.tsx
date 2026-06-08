'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoMark } from '@/components/logo'

interface Props {
  signOut: () => Promise<void>
  guideName: string
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/clients', label: 'Clients', icon: '◉' },
  { href: '/trips', label: 'Trips', icon: '◎' },
  { href: '/water-flows', label: 'Water Flows', icon: '≋' },
  { href: '/calendar', label: 'Calendar', icon: '▦' },
  { href: '/financials', label: 'Financials', icon: '$' },
  { href: '/analytics', label: 'Analytics', icon: '▲' },
]

export function Sidebar({ signOut, guideName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-[#0f1f35] flex flex-col z-20">
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2.5">
        <LogoMark size={30} variant="on-dark" />
        <span className="text-white font-bold text-lg tracking-tight">GuideStride</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all mb-1">
          <span className="text-base">⚙</span>
          Settings
        </Link>
        <form action={signOut}>
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all">
            <span className="text-base">→</span>
            Sign Out
          </button>
        </form>
        <div className="px-3 pt-3 mt-2 border-t border-white/10">
          <p className="text-xs text-slate-500 truncate">{guideName}</p>
        </div>
      </div>
    </aside>
  )
}
