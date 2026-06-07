import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
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
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-lg">◉</span>
            <span className="text-sm font-medium text-slate-900">Clients</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
        <Link href="/trips" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-lg">◎</span>
            <span className="text-sm font-medium text-slate-900">Trips</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
        <Link href="/calendar" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-lg">▦</span>
            <span className="text-sm font-medium text-slate-900">Calendar</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
        </div>
        <Link href="/settings" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-lg">⚙</span>
            <span className="text-sm font-medium text-slate-900">Settings</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <form action={signOut}>
          <button type="submit" className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left">
            <span className="text-red-400 text-lg">→</span>
            <span className="text-sm font-medium text-red-500">Sign Out</span>
          </button>
        </form>
      </div>

    </div>
  )
}
