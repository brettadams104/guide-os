import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ConditionsDisplay } from '@/components/conditions-display'
import { TripActions } from './trip-actions'
import { TripCostCard } from './trip-cost-card'
import type { TripConditions } from '@/lib/types'
import { startTrip } from '@/lib/actions/trip-mode'
import { LogDetailsForm } from './log-details-form'

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('*, clients(name, phone, email), trip_catches(*), trip_photos(*), trip_conditions(*)')
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const conditions = (trip.trip_conditions as TripConditions[])?.[0] ?? null
  const catches = trip.trip_catches as { id: string; species: string; count: number }[]
  const photos = trip.trip_photos as { id: string; url: string }[]
  const totalFish = catches.reduce((s, c) => s + c.count, 0)
  const balance = Math.max(0, (trip.price ?? 0) - (trip.amount_collected ?? 0))
  const client = trip.clients as { name: string; phone: string | null; email: string | null } | null
  const isLive = !!(trip as any).started_at && !(trip as any).ended_at

  async function handleStart() {
    'use server'
    await startTrip(id)
    redirect(`/trips/${id}/live`)
  }

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

      {/* Start / Resume Trip */}
      {trip.status === 'scheduled' && !(trip as any).ended_at && (
        <div className={`rounded-2xl p-4 ${isLive ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          {isLive ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-800 text-sm">Trip in progress</p>
                <p className="text-amber-600 text-xs mt-0.5">Tap to return to live mode</p>
              </div>
              <Link href={`/trips/${id}/live`}
                className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Resume Trip →
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800 text-sm">Ready to go?</p>
                <p className="text-green-600 text-xs mt-0.5">Start live trip tracking</p>
              </div>
              <form action={handleStart}>
                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  Start Trip 🎣
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Client</p>
          <p className="font-bold text-slate-900 mt-1">{client?.name ?? '—'}</p>
        </div>
        <TripCostCard
          tripId={id}
          price={trip.price}
          depositPaid={trip.deposit_paid ?? 0}
          amountCollected={trip.amount_collected ?? 0}
        />
      </div>

      {/* Client contact */}
      {client && (client.phone || client.email) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Client Contact</h2>
          <div className="space-y-2">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">📞</span>
                <span className="text-sky-600 font-medium hover:text-sky-500">{client.phone}</span>
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">✉️</span>
                <span className="text-sky-600 font-medium hover:text-sky-500">{client.email}</span>
              </a>
            )}
          </div>
        </div>
      )}

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

      {/* Log Details — only for scheduled trips not yet started through Trip Mode */}
      {trip.status === 'scheduled' && !(trip as any).ended_at && (
        <LogDetailsForm tripId={id} tripDate={trip.trip_date} defaultPrice={trip.price} />
      )}

      <TripActions tripId={id} currentStatus={trip.status ?? 'scheduled'} />
    </div>
  )
}
