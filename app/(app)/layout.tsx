import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { TourWrapper } from '@/components/tour-wrapper'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: guide }, { data: liveTrip }] = await Promise.all([
    supabase.from('guides').select('name, onboarding_complete').eq('id', user.id).single(),
    supabase
      .from('trips')
      .select('id, trip_date, clients(name)')
      .eq('guide_id', user.id)
      .not('started_at', 'is', null)
      .is('ended_at', null)
      .maybeSingle(),
  ])

  const liveClient = (liveTrip?.clients as unknown as { name: string } | null)?.name ?? 'Current Trip'
  const tourComplete = (guide as any)?.onboarding_complete === true

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <Sidebar signOut={signOut} guideName={guide?.name ?? 'Guide'} />
      </div>

      <main className="md:pl-60 pb-20 md:pb-0 min-h-screen">

        {liveTrip && (
          <div className="bg-green-600 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <p className="text-white text-sm font-semibold truncate">
                Trip in Progress — {liveClient}
              </p>
            </div>
            <Link
              href={`/trips/${liveTrip.id}/live`}
              className="shrink-0 bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap"
            >
              Return to Trip →
            </Link>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>

      <BottomNav />
      <TourWrapper userId={user.id} tourComplete={tourComplete} />
    </div>
  )
}
