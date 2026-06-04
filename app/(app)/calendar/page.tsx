import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarClient } from './calendar-client'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('id, trip_date, location, status, notes, clients(name)')
    .eq('guide_id', user!.id)
    .order('trip_date')

  // Try to fetch time slot + staff info separately (safe — won't break if columns don't exist)
  const detailResult = await supabase
    .from('trips')
    .select('id, guide_time_slots(label, start_time, end_time), guide_staff(name)')
    .eq('guide_id', user!.id)
    .order('trip_date')
  const tripDetails = detailResult.error ? null : detailResult.data

  const detailMap: Record<string, { time_label: string | null; start_time: string | null; end_time: string | null; guide_name: string | null }> = {}
  ;(tripDetails ?? []).forEach((d: any) => {
    const slot = d.guide_time_slots as { label: string; start_time: string | null; end_time: string | null } | null
    detailMap[d.id] = {
      time_label: slot?.label ?? null,
      start_time: slot?.start_time ?? null,
      end_time: slot?.end_time ?? null,
      guide_name: (d.guide_staff as { name: string } | null)?.name ?? null,
    }
  })

  const events = (trips ?? []).map(t => ({
    id: t.id,
    trip_date: t.trip_date,
    client_name: (t.clients as unknown as { name: string } | null)?.name ?? null,
    location: t.location,
    status: t.status as string ?? 'scheduled',
    notes: t.notes,
    ...(detailMap[t.id] ?? { time_label: null, start_time: null, end_time: null, guide_name: null }),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <Link href="/trips" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">Manage Trips</Link>
      </div>
      <CalendarClient events={events} />
    </div>
  )
}
