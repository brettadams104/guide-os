import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CollectPayment } from './collect-payment'

function formatDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const mins = Math.floor((end - start) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}


export default async function TripSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('*, clients(name, email, phone), trip_live_catches(*), trip_photos(*), trip_conditions(*)')
    .eq('id', id)
    .single()

  if (!trip) notFound()
  if (!(trip as any).started_at) notFound()

  const liveCatches = (trip.trip_live_catches as { species: string; count: number }[]) ?? []
  const photos = (trip.trip_photos as { id: string; url: string }[]) ?? []
  const conditions = ((trip.trip_conditions as any[])?.[0]) ?? null
  const client = trip.clients as { name: string; email: string | null; phone: string | null } | null
  const price: number = (trip as any).price ?? 0
  const alreadyCollected: number = (trip as any).amount_collected ?? 0

  const speciesMap: Record<string, number> = {}
  liveCatches.forEach(c => { speciesMap[c.species] = (speciesMap[c.species] ?? 0) + c.count })
  const totalFish = Object.values(speciesMap).reduce((s, n) => s + n, 0)
  const duration = formatDuration((trip as any).started_at, (trip as any).ended_at ?? null)

  const date = new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 pb-32">

      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-black text-slate-900">Trip Complete</h1>
        <p className="text-slate-500 text-sm mt-1">{date}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-sky-500 rounded-2xl p-4 text-center">
          <p className="text-4xl font-black text-white">{totalFish}</p>
          <p className="text-sky-100 text-xs mt-1">Fish Caught</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-black text-slate-900">{duration}</p>
          <p className="text-slate-400 text-xs mt-1">On Water</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-black text-slate-900">{photos.length}</p>
          <p className="text-slate-400 text-xs mt-1">Photos</p>
        </div>
      </div>

      {/* Catch breakdown */}
      {Object.keys(speciesMap).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3">Catch Breakdown</h2>
          <ul className="space-y-2">
            {Object.entries(speciesMap).sort((a, b) => b[1] - a[1]).map(([s, c]) => (
              <li key={s} className="flex justify-between text-sm">
                <span className="text-slate-700">{s}</span>
                <span className="font-bold text-slate-900">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conditions */}
      {conditions && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3">Conditions</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {conditions.weather && <div><p className="text-slate-500 text-xs">Weather</p><p className="font-semibold">{conditions.weather}</p></div>}
            {conditions.temp_high && <div><p className="text-slate-500 text-xs">Temp</p><p className="font-semibold">{conditions.temp_high}°F</p></div>}
            {conditions.moon_phase && <div><p className="text-slate-500 text-xs">Moon</p><p className="font-semibold">{conditions.moon_phase}</p></div>}
            {conditions.pressure_trend && <div><p className="text-slate-500 text-xs">Pressure</p><p className="font-semibold capitalize">{conditions.pressure_trend}</p></div>}
          </div>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-900 mb-3">Photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map(p => (
              <img key={p.id} src={p.url} alt="Trip photo" className="w-full h-28 object-cover rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {(trip as any).live_notes && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-2">Notes</h2>
          <p className="text-slate-600 text-sm whitespace-pre-wrap">{(trip as any).live_notes}</p>
        </div>
      )}

      {/* Collect Payment */}
      {price > 0 && (
        <CollectPayment tripId={id} price={price} alreadyCollected={alreadyCollected} />
      )}

      {/* Back to trip detail */}
      <div>
        <Link href={`/trips/${id}`}
          className="block w-full border border-slate-200 text-slate-600 font-medium py-3 rounded-2xl text-center text-sm hover:bg-slate-50 transition-colors">
          View Trip Detail
        </Link>
      </div>
    </div>
  )
}
