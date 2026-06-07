import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

function TripIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h1m16 0h1M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/><path d="M5 17H3v-4l2-5h11l3 5v4h-2"/><path d="M9 17h6"/></svg>
}

function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}

function GearIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}

function SignOutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

function ChevronRight() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('name, location').eq('id', user!.id).single()

  const name = (guide as any)?.name ?? 'Guide'
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Guide header */}
      <div className="bg-[#0f1f35] rounded-2xl p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xl">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-lg truncate">{name}</p>
          <p className="text-slate-400 text-sm truncate">{user?.email}</p>
        </div>
      </div>

      {/* Business */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Business</p>
        </div>
        <Link href="/clients" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-500">
            <UsersIcon />
            <span className="text-sm font-medium text-slate-900">Clients</span>
          </div>
          <ChevronRight />
        </Link>
        <Link href="/trips" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-500">
            <TripIcon />
            <span className="text-sm font-medium text-slate-900">Trips</span>
          </div>
          <ChevronRight />
        </Link>
        <Link href="/calendar" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3 text-slate-500">
            <CalendarIcon />
            <span className="text-sm font-medium text-slate-900">Calendar</span>
          </div>
          <ChevronRight />
        </Link>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
        </div>
        <Link href="/settings" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3 text-slate-500">
            <GearIcon />
            <span className="text-sm font-medium text-slate-900">Settings</span>
          </div>
          <ChevronRight />
        </Link>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <form action={signOut}>
          <button type="submit" className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left text-red-400">
            <SignOutIcon />
            <span className="text-sm font-medium text-red-500">Sign Out</span>
          </button>
        </form>
      </div>

    </div>
  )
}
