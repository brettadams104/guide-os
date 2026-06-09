import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const { data: trips } = await supabase
    .from('trips')
    .select('*, trip_catches(species, count)')
    .eq('client_id', id)
    .order('trip_date', { ascending: false })

  const totalSpent = (trips ?? []).reduce((sum, t) => sum + (t.amount_collected ?? 0), 0)
  const outstanding = (trips ?? []).reduce((sum, t) => sum + Math.max(0, (t.price ?? 0) - (t.amount_collected ?? 0)), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients" className="text-slate-400 hover:text-slate-600 text-sm">← Clients</Link>
          <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
        </div>
        <Link href={`/clients/${id}/edit`} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-xl transition-colors">Edit</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-2 gap-4">
        {client.phone && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
            <a href={`tel:${client.phone}`} className="text-sky-500 font-medium text-sm mt-1 block hover:text-sky-400">{client.phone}</a>
          </div>
        )}
        {client.email && (
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
            <p className="text-slate-900 font-medium text-sm mt-1 truncate">{client.email}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Trips</p>
          <p className="text-slate-900 font-bold text-xl mt-1">{(trips ?? []).length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Spent</p>
          <p className="text-slate-900 font-bold text-xl mt-1">${totalSpent.toFixed(0)}</p>
        </div>
        {outstanding > 0 && (
          <div>
            <p className="text-xs text-orange-500 uppercase tracking-wide">Outstanding</p>
            <p className="text-orange-500 font-bold text-xl mt-1">${outstanding.toFixed(0)}</p>
          </div>
        )}
        {client.notes && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Notes</p>
            <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Trip History</h2>
        </div>
        {!trips?.length ? (
          <p className="px-6 py-8 text-slate-400 text-sm text-center">No trips yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {trips.map(trip => {
              const totalFish = (trip.trip_catches as { species: string; count: number }[])?.reduce((s, c) => s + c.count, 0) ?? 0
              const owed = Math.max(0, (trip.price ?? 0) - (trip.amount_collected ?? 0))
              const hasOutstanding = owed > 0
              return (
                <li key={trip.id} className={hasOutstanding ? 'bg-amber-50' : ''}>
                  <Link href={`/trips/${trip.id}?back=/clients/${id}`} className="flex items-center justify-between px-6 py-4 hover:bg-amber-100/60 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        {hasOutstanding && (
                          <span className="text-xs bg-amber-200 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                            ${owed.toFixed(0)} owed
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{trip.location ?? 'No location'} · {totalFish} fish</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      {trip.price && (
                        <p className={`text-sm font-semibold ${hasOutstanding ? 'text-amber-600' : 'text-slate-700'}`}>
                          ${(trip.amount_collected ?? 0).toFixed(0)} / ${trip.price.toFixed(0)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
