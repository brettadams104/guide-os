import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ConditionsDisplay } from '@/components/conditions-display'
import { TripActions } from './trip-actions'
import type { TripConditions } from '@/lib/types'

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('*, clients(name), trip_catches(*), trip_photos(*), trip_conditions(*)')
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const conditions = (trip.trip_conditions as TripConditions[])?.[0] ?? null
  const catches = trip.trip_catches as { id: string; species: string; count: number }[]
  const photos = trip.trip_photos as { id: string; url: string }[]
  const totalFish = catches.reduce((s, c) => s + c.count, 0)
  const balance = Math.max(0, (trip.price ?? 0) - (trip.amount_collected ?? 0))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/trips" className="text-slate-400 hover:text-slate-600 text-sm">← Trips</Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{trip.location ?? 'No location'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Client</p>
          <p className="font-bold text-slate-900 mt-1">{(trip.clients as { name: string } | null)?.name ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Fish Caught</p>
          <p className="font-bold text-slate-900 text-2xl mt-1">{totalFish}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Revenue</p>
          <p className="font-bold text-slate-900 text-2xl mt-1">${(trip.amount_collected ?? 0).toFixed(0)}</p>
          {balance > 0 && <p className="text-xs text-orange-500">${balance.toFixed(0)} owed</p>}
        </div>
      </div>

      {conditions && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900">Conditions</h2>
          <ConditionsDisplay conditions={conditions} />
          {(conditions.sunrise || conditions.sunset) && (
            <div className="flex gap-6 text-sm text-slate-500">
              {conditions.sunrise && <span>🌅 Sunrise: {conditions.sunrise}</span>}
              {conditions.sunset && <span>🌇 Sunset: {conditions.sunset}</span>}
            </div>
          )}
        </div>
      )}


      {trip.notes && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Notes</h2>
          <p className="text-slate-600 text-sm whitespace-pre-wrap">{trip.notes}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map(p => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                <img src={p.url} alt="Trip photo" className="w-full h-48 object-cover rounded-2xl" />
              </a>
            ))}
          </div>
        </div>
      )}

      <TripActions tripId={id} currentStatus={trip.status ?? 'scheduled'} />
    </div>
  )
}
