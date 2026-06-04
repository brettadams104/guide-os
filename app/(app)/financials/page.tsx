import { createClient } from '@/lib/supabase/server'
import { FinancialsBar } from '@/components/charts/financials-bar'
import { RevenueAreaChart } from '@/components/charts/revenue-area-chart'
import { RevenueByPackage } from '@/components/charts/revenue-by-package'
import { TopClientsChart } from '@/components/charts/top-clients-chart'

export default async function FinancialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('id, trip_date, amount_collected, price, payment_method, client_id, time_slot_id, clients(name), guide_time_slots(label)')
    .eq('guide_id', user!.id)
    .eq('status', 'completed')
    .order('trip_date', { ascending: false })

  const totalRevenue = (trips ?? []).reduce((s, t) => s + (t.amount_collected ?? 0), 0)
  const totalBilled = (trips ?? []).reduce((s, t) => s + (t.price ?? 0), 0)
  const totalOutstanding = Math.max(0, totalBilled - totalRevenue)
  const totalTrips = (trips ?? []).length
  const avgPerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0

  // Best month
  const monthRevMap: Record<string, number> = {}
  ;(trips ?? []).forEach(t => {
    const m = t.trip_date.slice(0, 7)
    monthRevMap[m] = (monthRevMap[m] ?? 0) + (t.amount_collected ?? 0)
  })
  const bestMonth = Object.entries(monthRevMap).sort((a, b) => b[1] - a[1])[0]
  const bestMonthLabel = bestMonth
    ? new Date(bestMonth[0] + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
    : '—'
  const bestMonthAmount = bestMonth ? bestMonth[1] : 0

  // Collection rate
  const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 100

  // Monthly data
  const revenueData = Object.entries(monthRevMap).sort().map(([m, revenue]) => ({
    month: new Date(m + '-01').toLocaleString('default', { month: 'short' }),
    revenue,
  }))

  // Monthly collected vs outstanding
  const monthBilledMap: Record<string, number> = {}
  ;(trips ?? []).forEach(t => {
    const m = t.trip_date.slice(0, 7)
    monthBilledMap[m] = (monthBilledMap[m] ?? 0) + (t.price ?? 0)
  })
  const financialsBarData = Object.keys({ ...monthRevMap, ...monthBilledMap })
    .sort()
    .map(m => ({
      month: new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      revenue: monthRevMap[m] ?? 0,
      outstanding: Math.max(0, (monthBilledMap[m] ?? 0) - (monthRevMap[m] ?? 0)),
    }))

  // Revenue by package
  const packageMap: Record<string, number> = {}
  ;(trips ?? []).forEach(t => {
    const label = (t.guide_time_slots as unknown as { label: string } | null)?.label ?? 'No Package'
    packageMap[label] = (packageMap[label] ?? 0) + (t.amount_collected ?? 0)
  })
  const packageData = Object.entries(packageMap)
    .map(([pkg, revenue]) => ({ package: pkg, revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  // Top clients
  const clientMap: Record<string, { name: string; revenue: number }> = {}
  ;(trips ?? []).forEach(t => {
    const id = t.client_id ?? 'unknown'
    const name = (t.clients as unknown as { name: string } | null)?.name ?? 'No client'
    if (!clientMap[id]) clientMap[id] = { name, revenue: 0 }
    clientMap[id].revenue += t.amount_collected ?? 0
  })
  const topClients = Object.values(clientMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Avg per trip by month
  const avgByMonth = Object.entries(monthRevMap).sort().map(([m, rev]) => {
    const count = (trips ?? []).filter(t => t.trip_date.startsWith(m)).length
    return {
      month: new Date(m + '-01').toLocaleString('default', { month: 'short' }),
      revenue: count > 0 ? Math.round(rev / count) : 0,
    }
  })

  // Outstanding trips
  const outstanding = (trips ?? [])
    .filter(t => (t.price ?? 0) > (t.amount_collected ?? 0))
    .map(t => ({
      id: t.id,
      client: (t.clients as unknown as { name: string } | null)?.name ?? 'No client',
      date: t.trip_date,
      owed: (t.price ?? 0) - (t.amount_collected ?? 0),
    }))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Financials</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-sky-500 rounded-2xl p-5 col-span-2 lg:col-span-1">
          <p className="text-xs text-sky-100 uppercase tracking-widest font-semibold">Total Collected</p>
          <p className="text-4xl font-black text-white mt-2">${totalRevenue.toFixed(0)}</p>
          <p className="text-sky-200 text-xs mt-1">{totalTrips} completed trips</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Avg Per Trip</p>
          <p className="text-3xl font-black text-slate-900 mt-2">${avgPerTrip.toFixed(0)}</p>
        </div>
        <div className={`rounded-2xl p-5 ${totalOutstanding > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-200'}`}>
          <p className={`text-xs uppercase tracking-widest font-semibold ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Outstanding</p>
          <p className={`text-3xl font-black mt-2 ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>${totalOutstanding.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Best Month</p>
          <p className="text-xl font-black text-slate-900 mt-2">${bestMonthAmount.toFixed(0)}</p>
          <p className="text-slate-400 text-xs mt-1">{bestMonthLabel}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Collection Rate</p>
          <p className="text-3xl font-black text-slate-900 mt-2">{collectionRate}%</p>
          <div className="mt-2 bg-slate-100 rounded-full h-1.5">
            <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total Billed</p>
          <p className="text-3xl font-black text-slate-900 mt-2">${totalBilled.toFixed(0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly revenue area */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
          <h2 className="font-bold text-slate-900 mb-1">Monthly Revenue</h2>
          <p className="text-xs text-slate-400 mb-4">Total collected by month</p>
          <RevenueAreaChart data={revenueData} />
        </div>

        {/* Collected vs Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
          <h2 className="font-bold text-slate-900 mb-1">Collected vs Outstanding</h2>
          <p className="text-xs text-slate-400 mb-4">Blue = collected · Yellow = still owed</p>
          <FinancialsBar data={financialsBarData} />
        </div>

        {/* Revenue by package */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1">Revenue by Package</h2>
          <p className="text-xs text-slate-400 mb-4">Which packages generate the most</p>
          <RevenueByPackage data={packageData} />
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1">Top Clients by Spend</h2>
          <p className="text-xs text-slate-400 mb-4">Your highest-value clients</p>
          <TopClientsChart data={topClients} />
        </div>

        {/* Avg revenue per trip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
          <h2 className="font-bold text-slate-900 mb-1">Average Revenue Per Trip</h2>
          <p className="text-xs text-slate-400 mb-4">Is your average trip value trending up?</p>
          <RevenueAreaChart data={avgByMonth} />
        </div>
      </div>

      {/* Outstanding balances */}
      {outstanding.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-amber-800">Outstanding Balances</h2>
              <p className="text-xs text-amber-600 mt-0.5">{outstanding.length} trip{outstanding.length !== 1 ? 's' : ''} · ${outstanding.reduce((s, t) => s + t.owed, 0).toFixed(0)} total owed</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {outstanding.map(t => (
              <li key={t.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.client}</p>
                  <p className="text-xs text-slate-400">{new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <p className="font-bold text-amber-600">${t.owed.toFixed(0)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
