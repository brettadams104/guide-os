import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('*, clients(name), trip_catches(species, count)')
    .eq('guide_id', user!.id)
    .order('trip_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Trips</h1>
        <Link href="/trips/new" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">+ Log Trip</Link>
      </div>

      {!trips?.length ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No trips logged yet.</p>
          <Link href="/trips/new" className="text-sky-500 text-sm mt-2 inline-block hover:text-sky-400">Log your first trip →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {trips.map(trip => {
              const totalFish = (trip.trip_catches as { count: number }[])?.reduce((s, c) => s + c.count, 0) ?? 0
              return (
                <li key={trip.id}>
                  <Link href={`/trips/${trip.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {(trip.clients as { name: string } | null)?.name ?? 'No client'} · {trip.location ?? 'No location'} · {totalFish} fish
                      </p>
                    </div>
                    {trip.price != null && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">${trip.amount_collected?.toFixed(0)}</p>
                        {(trip.amount_collected ?? 0) < (trip.price ?? 0) && (
                          <p className="text-xs text-orange-500">${((trip.price ?? 0) - (trip.amount_collected ?? 0)).toFixed(0)} owed</p>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
