import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatCard } from '@/components/stat-card'
import { CalendarClient } from '../calendar/calendar-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const [{ count: totalClients }, { data: monthTrips }, { data: allTrips }, { data: upcomingTrips }, { data: allTripEvents }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('guide_id', user!.id),
    supabase.from('trips').select('price, amount_collected').eq('guide_id', user!.id).gte('trip_date', monthStart),
    supabase.from('trips').select('price, amount_collected').eq('guide_id', user!.id),
    supabase.from('trips').select('*, clients(name)').eq('guide_id', user!.id)
      .gte('trip_date', new Date().toISOString().split('T')[0])
      .order('trip_date', { ascending: true }).limit(5),
    supabase.from('trips').select('id, trip_date, location, clients(name)').eq('guide_id', user!.id).order('trip_date'),
  ])

  const monthRevenue = (monthTrips ?? []).reduce((sum, t) => sum + (t.amount_collected ?? 0), 0)
  const outstanding = (allTrips ?? []).reduce((sum, t) => sum + Math.max(0, (t.price ?? 0) - (t.amount_collected ?? 0)), 0)

  const calendarEvents = (allTripEvents ?? []).map(t => ({
    id: t.id,
    trip_date: t.trip_date,
    client_name: (t.clients as unknown as { name: string } | null)?.name ?? null,
    location: t.location,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/trips/new" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + Log Trip
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={totalClients ?? 0} />
        <StatCard label="Trips This Month" value={(monthTrips ?? []).length} />
        <StatCard label="Month Revenue" value={`$${monthRevenue.toFixed(0)}`} accent />
        <StatCard label="Outstanding" value={`$${outstanding.toFixed(0)}`} sub="across all clients" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Upcoming Trips</h2>
          <Link href="/trips" className="text-sky-500 text-sm hover:text-sky-400">View all →</Link>
        </div>
        {!upcomingTrips?.length ? (
          <div className="px-6 py-10 text-center">
            <p className="text-slate-400 text-sm">No upcoming trips.</p>
            <Link href="/trips/new" className="text-sky-500 text-sm mt-2 inline-block hover:text-sky-400">Log your next trip →</Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcomingTrips.map(trip => (
              <li key={trip.id}>
                <Link href={`/trips/${trip.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{(trip.clients as { name: string } | null)?.name ?? 'No client'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{trip.location ?? 'Location TBD'}</p>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Calendar</h2>
          <Link href="/calendar" className="text-sky-500 text-sm hover:text-sky-400">Full view →</Link>
        </div>
        <CalendarClient events={calendarEvents} />
      </div>
    </div>
  )
}
