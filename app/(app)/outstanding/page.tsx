import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 600

export default async function OutstandingPage({ searchParams }: { searchParams: Promise<{ back?: string }> }) {
  const { back } = await searchParams
  const backHref = back ?? '/analytics'
  const backLabel = back === '/dashboard' ? '← Dashboard' : '← Analytics'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [{ data: completed }, { data: scheduled }] = await Promise.all([
    supabase.from('trips')
      .select('id, trip_date, price, amount_collected, location, client_id, clients(id, name)')
      .eq('guide_id', user.id)
      .eq('status', 'completed')
      .order('trip_date', { ascending: false }),
    supabase.from('trips')
      .select('id, trip_date, price, amount_collected, location, client_id, clients(id, name)')
      .eq('guide_id', user.id)
      .in('status', ['scheduled', 'in_progress'])
      .order('trip_date', { ascending: true }),
  ])

  // Merge and filter to only trips with an outstanding balance
  const allOutstanding = [
    ...(completed ?? []).map(t => ({ ...t, status: 'completed' as const })),
    ...(scheduled ?? []).map(t => ({ ...t, status: 'scheduled' as const })),
  ].filter(t => (t.price ?? 0) > (t.amount_collected ?? 0))

  // Group by client
  const byClient: Record<string, { name: string; clientId: string; trips: typeof allOutstanding }> = {}
  allOutstanding.forEach(t => {
    const clientId = t.client_id ?? 'unknown'
    const name = (t.clients as unknown as { name: string } | null)?.name ?? 'No client'
    if (!byClient[clientId]) byClient[clientId] = { name, clientId, trips: [] }
    byClient[clientId].trips.push(t)
  })

  const clients = Object.values(byClient).sort((a, b) => {
    const aTotal = a.trips.reduce((s, t) => s + (t.price ?? 0) - (t.amount_collected ?? 0), 0)
    const bTotal = b.trips.reduce((s, t) => s + (t.price ?? 0) - (t.amount_collected ?? 0), 0)
    return bTotal - aTotal
  })

  const grandTotal = allOutstanding.reduce((s, t) => s + (t.price ?? 0) - (t.amount_collected ?? 0), 0)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="text-slate-400 hover:text-slate-600 text-sm">{backLabel}</Link>
        <h1 className="text-2xl font-bold text-slate-900">Outstanding Balances</h1>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No outstanding balances — you&apos;re all caught up.</p>
        </div>
      ) : (
        <>
          {/* Summary banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Total Outstanding</p>
              <p className="text-3xl font-black text-amber-600 mt-1">${grandTotal.toFixed(0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-500">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-amber-500">{allOutstanding.length} trip{allOutstanding.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Per-client cards */}
          <div className="space-y-4">
            {clients.map(({ name, clientId, trips }) => {
              const clientTotal = trips.reduce((s, t) => s + (t.price ?? 0) - (t.amount_collected ?? 0), 0)
              return (
                <div key={clientId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Client header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <Link href={`/clients/${clientId}?back=/outstanding`} className="font-bold text-slate-900 hover:text-sky-600 transition-colors">
                      {name}
                    </Link>
                    <span className="font-black text-amber-600 text-lg">${clientTotal.toFixed(0)}</span>
                  </div>

                  {/* Trips */}
                  <ul className="divide-y divide-slate-100">
                    {trips.map(t => {
                      const owed = (t.price ?? 0) - (t.amount_collected ?? 0)
                      const collected = t.amount_collected ?? 0
                      const price = t.price ?? 0
                      return (
                        <li key={t.id} className="px-5 py-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">
                                {new Date(t.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              {t.status === 'scheduled' && (
                                <span className="text-xs bg-sky-100 text-sky-600 font-medium px-1.5 py-0.5 rounded-full">Upcoming</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {t.location ?? 'No location'} · ${collected.toFixed(0)} of ${price.toFixed(0)} collected
                            </p>
                          </div>
                          <Link href={`/trips/${t.id}`} className="ml-4 shrink-0 font-bold text-amber-600 hover:text-amber-500 transition-colors">
                            ${owed.toFixed(0)}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
