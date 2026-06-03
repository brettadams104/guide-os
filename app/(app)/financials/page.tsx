import { createClient } from '@/lib/supabase/server'
import { FinancialsBar } from '@/components/charts/financials-bar'
import { PaymentMethodDonut } from '@/components/charts/payment-method-donut'
import { RevenueChart } from '@/components/charts/revenue-chart'

export default async function FinancialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('id, trip_date, amount_collected, price, payment_method, clients(name)')
    .eq('guide_id', user!.id)
    .eq('status', 'completed')
    .order('trip_date', { ascending: false })

  const totalRevenue = (trips ?? []).reduce((s, t) => s + (t.amount_collected ?? 0), 0)
  const totalBilled = (trips ?? []).reduce((s, t) => s + (t.price ?? 0), 0)
  const totalOutstanding = Math.max(0, totalBilled - totalRevenue)
  const totalTrips = (trips ?? []).length
  const avgPerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0

  // Monthly collected vs outstanding
  const monthFinMap: Record<string, { revenue: number; billed: number }> = {}
  ;(trips ?? []).forEach(t => {
    const month = t.trip_date.slice(0, 7)
    if (!monthFinMap[month]) monthFinMap[month] = { revenue: 0, billed: 0 }
    monthFinMap[month].revenue += t.amount_collected ?? 0
    monthFinMap[month].billed += t.price ?? 0
  })

  const financialsBarData = Object.entries(monthFinMap).sort().map(([month, d]) => ({
    month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
    revenue: d.revenue,
    outstanding: Math.max(0, d.billed - d.revenue),
  }))

  const revenueData = Object.entries(monthFinMap).sort().map(([month, d]) => ({
    month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
    revenue: d.revenue,
  }))

  const avgByMonth = Object.entries(monthFinMap).sort().map(([month, d]) => {
    const count = (trips ?? []).filter(t => t.trip_date.startsWith(month)).length
    return {
      month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      revenue: count > 0 ? Math.round(d.revenue / count) : 0,
    }
  })

  const paymentMap: Record<string, number> = {}
  ;(trips ?? []).forEach(t => {
    if (!t.payment_method || !t.amount_collected) return
    paymentMap[t.payment_method] = (paymentMap[t.payment_method] ?? 0) + t.amount_collected
  })
  const paymentData = Object.entries(paymentMap)
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount)

  // Outstanding trips list
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sky-500 rounded-2xl p-5">
          <p className="text-xs text-sky-100 uppercase tracking-wide">Total Collected</p>
          <p className="text-3xl font-bold text-white mt-1">${totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Billed</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">${totalBilled.toFixed(0)}</p>
        </div>
        <div className={`rounded-2xl p-5 ${totalOutstanding > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Outstanding</p>
          <p className={`text-3xl font-bold mt-1 ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>${totalOutstanding.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Per Trip</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">${avgPerTrip.toFixed(0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-1">Collected vs Outstanding by Month</h2>
          <p className="text-xs text-slate-400 mb-4">Blue = collected · Yellow = still owed</p>
          <FinancialsBar data={financialsBarData} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
          <RevenueChart data={revenueData} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Revenue by Payment Method</h2>
          <PaymentMethodDonut data={paymentData} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-4">Average Revenue Per Trip by Month</h2>
          <RevenueChart data={avgByMonth} />
        </div>
      </div>

      {/* Outstanding trips */}
      {outstanding.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50">
            <h2 className="font-semibold text-amber-800">Outstanding Balances</h2>
            <p className="text-xs text-amber-600 mt-0.5">{outstanding.length} trip{outstanding.length !== 1 ? 's' : ''} with unpaid balances</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {outstanding.map(t => (
              <li key={t.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{t.client}</p>
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
