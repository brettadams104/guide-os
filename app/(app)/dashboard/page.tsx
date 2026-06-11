import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatCard } from '@/components/stat-card'
import { CalendarClient } from '../calendar/calendar-client'
import { TodayDate } from '@/components/today-date'
import { AddEventModal } from '@/components/add-event-modal'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Subtract 12h from UTC to get a safe floor that covers all US timezones.
  // This ensures we never accidentally filter out today's trips when the server
  // clock is ahead of the guide's local time.
  const safeToday = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().split('T')[0]
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const yearStart = `${now.getFullYear()}-01-01`

  const [{ count: yearTrips }, { data: monthTrips }, { data: allTrips }, { data: upcomingTrips }, { data: allTripEvents }, { data: guideEvents }] = await Promise.all([
    supabase.from('trips').select('*', { count: 'exact', head: true }).eq('guide_id', user!.id).gte('trip_date', yearStart).eq('status', 'completed'),
    supabase.from('trips').select('price, amount_collected').eq('guide_id', user!.id).gte('trip_date', monthStart),
    supabase.from('trips').select('price, amount_collected').eq('guide_id', user!.id),
    supabase.from('trips').select('*, clients(name)').eq('guide_id', user!.id)
      .gte('trip_date', safeToday)
      .order('trip_date', { ascending: true }).limit(5),
    supabase.from('trips').select('id, trip_date, location, status, notes, clients(name)').eq('guide_id', user!.id).order('trip_date'),
    supabase.from('guide_events').select('*').eq('guide_id', user!.id).order('event_date'),
  ])

  const monthRevenue = (monthTrips ?? []).reduce((sum, t) => sum + (t.amount_collected ?? 0), 0)
  const outstanding = (allTrips ?? []).reduce((sum, t) => sum + Math.max(0, (t.price ?? 0) - (t.amount_collected ?? 0)), 0)

  // Fetch time slot + staff data separately (safe if migration not run)
  const slotResult = await supabase
    .from('trips')
    .select('id, start_time, end_time, guide_time_slots(label, start_time, end_time), guide_staff(name)')
    .eq('guide_id', user!.id)
  const slotMap: Record<string, { time_label: string | null; start_time: string | null; end_time: string | null; guide_name: string | null }> = {}
  ;(slotResult.error ? [] : slotResult.data ?? []).forEach((d: any) => {
    const slot = d.guide_time_slots
    slotMap[d.id] = {
      time_label: slot?.label ?? null,
      start_time: d.start_time ?? slot?.start_time ?? null,
      end_time: d.end_time ?? slot?.end_time ?? null,
      guide_name: d.guide_staff?.name ?? null,
    }
  })

  const calendarEvents = (allTripEvents ?? []).map(t => ({
    id: t.id,
    trip_date: t.trip_date,
    client_name: (t.clients as unknown as { name: string } | null)?.name ?? null,
    location: t.location,
    status: (t.status as string) ?? 'scheduled',
    notes: t.notes ?? null,
    ...(slotMap[t.id] ?? { time_label: null, start_time: null, end_time: null, guide_name: null }),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5"><TodayDate /></p>
        </div>
        <Link href="/trips" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          Manage Trips
        </Link>
      </div>

      <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`${now.getFullYear()} Trips`} value={yearTrips ?? 0} sub="completed this year" />
        <StatCard label="Trips This Month" value={(monthTrips ?? []).length} />
        <StatCard label="Month Revenue" value={`$${monthRevenue.toFixed(0)}`} accent />
        <StatCard label="Outstanding" value={`$${outstanding.toFixed(0)}`} sub="across all clients" href="/outstanding?back=/dashboard" />
      </div>

      <div data-tour="upcoming-trips" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Upcoming Trips</h2>
          <Link href="/trips" className="text-sky-500 text-sm hover:text-sky-400">View all →</Link>
        </div>
        {!upcomingTrips?.length ? (
          <div className="px-6 py-10 text-center">
            <p className="text-slate-400 text-sm">No upcoming trips.</p>
            <Link href="/trips/new" className="text-sky-500 text-sm mt-2 inline-block hover:text-sky-400">Log your next trip →</Link>
          </div>
        ) : (() => {
          // Group trips by date
          const grouped: Record<string, typeof upcomingTrips> = {}
          for (const trip of upcomingTrips) {
            if (!grouped[trip.trip_date]) grouped[trip.trip_date] = []
            grouped[trip.trip_date]!.push(trip)
          }
          const sortedDates = Object.keys(grouped).sort()

          function formatDateHeader(dateStr: string): string {
            const d = new Date(dateStr + 'T00:00:00')
            const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
            const month = d.toLocaleDateString('en-US', { month: 'long' })
            const day = d.getDate()
            const ord = day % 10 === 1 && day !== 11 ? 'st'
              : day % 10 === 2 && day !== 12 ? 'nd'
              : day % 10 === 3 && day !== 13 ? 'rd' : 'th'
            return `${weekday}, ${month} ${day}${ord}`
          }

          return (
            <div className="divide-y divide-slate-100">
              {sortedDates.map(date => (
                <div key={date}>
                  <div className="px-6 py-2.5 bg-slate-50">
                    <p className="font-bold text-slate-800 text-sm">{formatDateHeader(date)}</p>
                  </div>
                  {grouped[date]!.map(trip => (
                    <Link key={trip.id} href={`/trips/${trip.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors border-t border-slate-100 first:border-t-0">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{(trip.clients as { name: string } | null)?.name ?? 'No client'}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{trip.location ?? 'Location TBD'}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Calendar</h2>
          <div className="flex items-center gap-3">
            <AddEventModal />
            <Link href="/trips?tab=schedule" className="text-sky-500 hover:text-sky-400 text-sm font-medium transition-colors">
              + Schedule Trip
            </Link>
          </div>
        </div>
        <CalendarClient events={calendarEvents} guideEvents={guideEvents ?? []} />
      </div>
    </div>
  )
}
