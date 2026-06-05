import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { TripTimer } from '@/app/(app)/trips/[id]/live/trip-timer'
import { WeatherTab } from '@/app/(app)/trips/[id]/live/weather-tab'
import { FishLogTab } from '@/app/(app)/trips/[id]/live/fish-log-tab'
import { PhotosTab } from '@/app/(app)/trips/[id]/live/photos-tab'
import { NotesTab } from '@/app/(app)/trips/[id]/live/notes-tab'
import { LiveTabBar } from '@/app/(app)/trips/[id]/live/live-tab-bar'

// Never cache this page — guide data (presets, location) must always be fresh
export const dynamic = 'force-dynamic'

export default async function TripLivePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'weather' } = await searchParams
  const supabase = await createClient()

  // Join guides directly so presets come in the same query — no separate auth call needed
  const { data: trip } = await supabase
    .from('trips')
    .select('*, clients(name), trip_live_catches(*), trip_photos(*), guides(species_presets, lure_presets, location)')
    .eq('id', id)
    .single()

  if (!trip) notFound()
  if (!(trip as any).started_at) redirect(`/trips/${id}`)

  const liveCatches = (trip.trip_live_catches as {
    id: string; species: string; count: number; logged_at: string;
    size_inches: number | null; weight_lbs: number | null;
    caught_on: string | null; photo_url: string | null
  }[]) ?? []
  const photos = (trip.trip_photos as { id: string; url: string }[]) ?? []
  const clientName = (trip.clients as { name: string } | null)?.name ?? 'No client'

  const guide = trip.guides as { species_presets: string[]; lure_presets: string[]; location: string | null } | null
  const speciesPresets: string[] = guide?.species_presets ?? []
  const lurePresets: string[] = guide?.lure_presets ?? []
  const guideLocation: string = guide?.location ?? ''

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top bar */}
      <div className="bg-[#0f1f35] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{clientName}</p>
          <p className="text-slate-400 text-xs">{new Date((trip as any).trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
        <TripTimer startedAt={(trip as any).started_at} />
        <div className="flex gap-2">
          <Link href={`/trips/${id}`}
            className="text-xs text-slate-400 border border-white/20 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            ⏸ Pause
          </Link>
          <Link href={`/trips/${id}/summary`}
            className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-400 transition-colors">
            Finish
          </Link>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'weather' && <WeatherTab defaultLocation={guideLocation} />}
        {tab === 'fish' && <FishLogTab tripId={id} initialCatches={liveCatches} initialPhotos={photos} speciesPresets={speciesPresets} lurePresets={lurePresets} />}
        {tab === 'photos' && <PhotosTab tripId={id} initialPhotos={photos} />}
        {tab === 'notes' && <NotesTab tripId={id} initialNotes={(trip as any).live_notes ?? ''} />}
      </div>

      {/* Bottom tab bar */}
      <LiveTabBar tripId={id} activeTab={tab} />
    </div>
  )
}
