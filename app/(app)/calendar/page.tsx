import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarClient } from './calendar-client'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('id, trip_date, location, clients(name)')
    .eq('guide_id', user!.id)
    .order('trip_date')

  const events = (trips ?? []).map(t => ({
    id: t.id,
    trip_date: t.trip_date,
    client_name: (t.clients as unknown as { name: string } | null)?.name ?? null,
    location: t.location,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <Link href="/trips/new" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">+ Log Trip</Link>
      </div>
      <CalendarClient events={events} />
    </div>
  )
}
