import { createClient } from '@/lib/supabase/server'
import { SpeciesDonut } from '@/components/charts/species-donut'
import { FishByMoon } from '@/components/charts/fish-by-moon'
import { FishByPressure } from '@/components/charts/fish-by-pressure'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { FishByMonth } from '@/components/charts/fish-by-month'
import { FinancialsBar } from '@/components/charts/financials-bar'
import { PaymentMethodDonut } from '@/components/charts/payment-method-donut'
import { RevenueAreaChart } from '@/components/charts/revenue-area-chart'
import { RevenueByPackage } from '@/components/charts/revenue-by-package'
import { TopClientsChart } from '@/components/charts/top-clients-chart'
import { YoYChart } from '@/components/charts/yoy-chart'
import { AnalyticsTabs } from './analytics-tabs'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: trips }, { data: catches }, { data: conditions }] = await Promise.all([
    supabase.from('trips')
      .select('id, trip_date, amount_collected, price, payment_method, client_id, time_slot_id, clients(name), guide_time_slots(label)')
      .eq('guide_id', user!.id)
      .eq('status', 'completed')
      .order('trip_date', { ascending: false }),
    supabase.from('trip_catches').select('species, count, trip_id'),
    supabase.from('trip_conditions').select('trip_id, moon_phase, pressure_trend'),
  ])

  // ── Fishing analytics ──────────────────────────────────────────────────────

  const speciesMap: Record<string, number> = {}
  ;(catches ?? []).forEach(c => { speciesMap[c.species] = (speciesMap[c.species] ?? 0) + c.count })
  const speciesData = Object.entries(speciesMap).map(([species, count]) => ({ species, count })).sort((a, b) => b.count - a.count)

  const moonFish: Record<string, number[]> = {}
  ;(conditions ?? []).forEach(c => {
    if (!c.moon_phase) return
    const total = (catches ?? []).filter(tc => tc.trip_id === c.trip_id).reduce((s, tc) => s + tc.count, 0)
    if (!moonFish[c.moon_phase]) moonFish[c.moon_phase] = []
    moonFish[c.moon_phase].push(total)
  })
  const moonData = Object.entries(moonFish).map(([phase, counts]) => ({
    phase: phase.replace(' Moon', '').replace('ing', ''),
    avg: counts.reduce((s, n) => s + n, 0) / counts.length,
  }))

  const pressureFish: Record<string, number[]> = {}
  ;(conditions ?? []).forEach(c => {
    if (!c.pressure_trend) return
    const total = (catches ?? []).filter(tc => tc.trip_id === c.trip_id).reduce((s, tc) => s + tc.count, 0)
    if (!pressureFish[c.pressure_trend]) pressureFish[c.pressure_trend] = []
    pressureFish[c.pressure_trend].push(total)
  })
  const pressureData = Object.entries(pressureFish).map(([trend, counts]) => ({
    trend, avg: counts.reduce((s, n) => s + n, 0) / counts.length,
  }))

  const monthFishMap: Record<string, number> = {}
  ;(catches ?? []).forEach(c => {
    const trip = (trips ?? []).find(t => t.id === c.trip_id)
    if (!trip) return
    const month = trip.trip_date.slice(0, 7)
    monthFishMap[month] = (monthFishMap[month] ?? 0) + c.count
  })
  const monthFishData = Object.entries(monthFishMap).sort().map(([month, count]) => ({
    month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
    count,
  }))

  const totalFish = speciesData.reduce((s, d) => s + d.count, 0)
  const totalTrips = (trips ?? []).length

  // ── Financial analytics ────────────────────────────────────────────────────

  const allYears = [...new Set((trips ?? []).map(t => parseInt(t.trip_date.slice(0, 4))))].sort((a, b) => b - a)

  // YoY data
  const yoyData: Record<number, number[]> = {}
  ;(trips ?? []).forEach(t => {
    const year = parseInt(t.trip_date.slice(0, 4))
    const monthIdx = parseInt(t.trip_date.slice(5, 7)) - 1
    if (!yoyData[year]) yoyData[year] = Array(12).fill(0)
    yoyData[year][monthIdx] += t.amount_collected ?? 0
  })

  // Build monthly maps for all trips (year filtering happens client-side)
  const buildFinancialData = (filtered: typeof trips) => {
    const totalRevenue = (filtered ?? []).reduce((s, t) => s + (t.amount_collected ?? 0), 0)
    const totalBilled = (filtered ?? []).reduce((s, t) => s + (t.price ?? 0), 0)
    const totalOutstanding = Math.max(0, totalBilled - totalRevenue)
    const count = (filtered ?? []).length
    const avgPerTrip = count > 0 ? totalRevenue / count : 0
    const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 100

    const monthRevMap: Record<string, number> = {}
    const monthBilledMap: Record<string, number> = {}
    ;(filtered ?? []).forEach(t => {
      const m = t.trip_date.slice(0, 7)
      monthRevMap[m] = (monthRevMap[m] ?? 0) + (t.amount_collected ?? 0)
      monthBilledMap[m] = (monthBilledMap[m] ?? 0) + (t.price ?? 0)
    })

    const bestMonth = Object.entries(monthRevMap).sort((a, b) => b[1] - a[1])[0]
    const bestMonthLabel = bestMonth ? new Date(bestMonth[0] + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : '—'
    const bestMonthAmount = bestMonth ? bestMonth[1] : 0

    const revenueData = Object.entries(monthRevMap).sort().map(([m, revenue]) => ({
      month: new Date(m + '-01').toLocaleString('default', { month: 'short' }),
      revenue,
    }))

    const financialsBarData = Object.keys({ ...monthRevMap, ...monthBilledMap }).sort().map(m => ({
      month: new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      revenue: monthRevMap[m] ?? 0,
      outstanding: Math.max(0, (monthBilledMap[m] ?? 0) - (monthRevMap[m] ?? 0)),
    }))

    const paymentMap: Record<string, number> = {}
    ;(filtered ?? []).forEach(t => {
      if (!t.payment_method || !t.amount_collected) return
      paymentMap[t.payment_method] = (paymentMap[t.payment_method] ?? 0) + t.amount_collected
    })
    const paymentData = Object.entries(paymentMap).map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount)

    const packageMap: Record<string, number> = {}
    ;(filtered ?? []).forEach(t => {
      const label = (t.guide_time_slots as unknown as { label: string } | null)?.label ?? 'No Package'
      packageMap[label] = (packageMap[label] ?? 0) + (t.amount_collected ?? 0)
    })
    const packageData = Object.entries(packageMap).map(([pkg, revenue]) => ({ package: pkg, revenue })).sort((a, b) => b.revenue - a.revenue)

    const clientMap: Record<string, { name: string; revenue: number }> = {}
    ;(filtered ?? []).forEach(t => {
      const id = t.client_id ?? 'unknown'
      const name = (t.clients as unknown as { name: string } | null)?.name ?? 'No client'
      if (!clientMap[id]) clientMap[id] = { name, revenue: 0 }
      clientMap[id].revenue += t.amount_collected ?? 0
    })
    const topClients = Object.values(clientMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    const avgByMonth = Object.entries(monthRevMap).sort().map(([m, rev]) => {
      const c = (filtered ?? []).filter(t => t.trip_date.startsWith(m)).length
      return { month: new Date(m + '-01').toLocaleString('default', { month: 'short' }), revenue: c > 0 ? Math.round(rev / c) : 0 }
    })

    const outstanding = (filtered ?? [])
      .filter(t => (t.price ?? 0) > (t.amount_collected ?? 0))
      .map(t => ({
        id: t.id,
        client: (t.clients as unknown as { name: string } | null)?.name ?? 'No client',
        date: t.trip_date,
        owed: (t.price ?? 0) - (t.amount_collected ?? 0),
      }))

    return { totalRevenue, totalBilled, totalOutstanding, totalTrips: count, avgPerTrip, collectionRate, bestMonthLabel, bestMonthAmount, revenueData, financialsBarData, paymentData, packageData, topClients, avgByMonth, outstanding }
  }

  // Pass all trips data — year filtering happens client-side in the tabs
  const allTripsData = trips ?? []

  const fishingData = { speciesData, moonData, pressureData, monthFishData, totalFish, totalTrips }
  const financialData = { allTrips: allTripsData, allYears, yoyData, buildFinancialData: null }

  // Pre-compute all-time financial data for server render
  const allTimeFinancial = buildFinancialData(trips)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      <AnalyticsTabs
        fishingData={fishingData}
        allTimeFinancial={allTimeFinancial}
        allTrips={allTripsData as any[]}
        allYears={allYears}
        yoyData={yoyData}
      />
    </div>
  )
}
