export const revalidate = 600

import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsTabs } from './analytics-tabs'

// Lazy-load chart components (they're only shown in tabs, no need to load upfront)
const SpeciesDonut = dynamic(() => import('@/components/charts/species-donut').then(m => ({ default: m.SpeciesDonut })))
const FishByMoon = dynamic(() => import('@/components/charts/fish-by-moon').then(m => ({ default: m.FishByMoon })))
const FishByPressure = dynamic(() => import('@/components/charts/fish-by-pressure').then(m => ({ default: m.FishByPressure })))
const FishByMonth = dynamic(() => import('@/components/charts/fish-by-month').then(m => ({ default: m.FishByMonth })))
const FinancialsBar = dynamic(() => import('@/components/charts/financials-bar').then(m => ({ default: m.FinancialsBar })))
const PaymentMethodDonut = dynamic(() => import('@/components/charts/payment-method-donut').then(m => ({ default: m.PaymentMethodDonut })))
const RevenueAreaChart = dynamic(() => import('@/components/charts/revenue-area-chart').then(m => ({ default: m.RevenueAreaChart })))
const RevenueByPackage = dynamic(() => import('@/components/charts/revenue-by-package').then(m => ({ default: m.RevenueByPackage })))
const TopClientsChart = dynamic(() => import('@/components/charts/top-clients-chart').then(m => ({ default: m.TopClientsChart })))
const YoYChart = dynamic(() => import('@/components/charts/yoy-chart').then(m => ({ default: m.YoYChart })))

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function timeBucket(iso: string): string {
  const h = new Date(iso).getHours()
  if (h >= 4 && h < 7) return 'Dawn'
  if (h >= 7 && h < 11) return 'Morning'
  if (h >= 11 && h < 14) return 'Midday'
  if (h >= 14 && h < 18) return 'Afternoon'
  return 'Evening'
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: trips }, { data: scheduledTrips }, { data: catches }, { data: conditions }] = await Promise.all([
    supabase.from('trips')
      .select('id, trip_date, location, amount_collected, tip_amount, price, payment_method, client_id, time_slot_id, started_at, ended_at, clients(name), guide_time_slots(label)')
      .eq('guide_id', user!.id)
      .eq('status', 'completed')
      .order('trip_date', { ascending: false }),
    supabase.from('trips')
      .select('id, trip_date, price, amount_collected, clients(name)')
      .eq('guide_id', user!.id)
      .in('status', ['scheduled', 'in_progress']),
    supabase.from('trip_catches').select('species, count, trip_id'),
    supabase.from('trip_conditions').select('trip_id, moon_phase, pressure_trend'),
  ])

  const completedTripIds = (trips ?? []).map(t => t.id)
  const { data: liveCatches } = completedTripIds.length > 0
    ? await supabase.from('trip_live_catches').select('logged_at, count').in('trip_id', completedTripIds)
    : { data: [] }

  // ── Fishing analytics ─────────────────────────────────────────────────────

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

  // ── NEW: Key stat cards ────────────────────────────────────────────────────

  const avgFishPerTrip = totalTrips > 0 ? Math.round((totalFish / totalTrips) * 10) / 10 : 0

  const fishByTrip = (trips ?? []).map(t => ({
    date: t.trip_date,
    location: t.location,
    fish: (catches ?? []).filter(c => c.trip_id === t.id).reduce((s, c) => s + c.count, 0),
  })).sort((a, b) => b.fish - a.fish)
  const bestTrip = fishByTrip[0] ?? null

  const tripsWithCatch = (trips ?? []).filter(t => (catches ?? []).some(c => c.trip_id === t.id)).length
  const successRate = totalTrips > 0 ? Math.round((tripsWithCatch / totalTrips) * 100) : 0

  const totalHours = (trips ?? []).reduce((s, t: any) => {
    if (!t.started_at || !t.ended_at) return s
    return s + (new Date(t.ended_at).getTime() - new Date(t.started_at).getTime()) / 3600000
  }, 0)

  // ── Time of day (from live catches) ───────────────────────────────────────
  const buckets = ['Dawn', 'Morning', 'Midday', 'Afternoon', 'Evening']
  const timeMap: Record<string, number> = Object.fromEntries(buckets.map(b => [b, 0]))
  ;(liveCatches ?? []).forEach(lc => {
    if (lc.logged_at) timeMap[timeBucket(lc.logged_at)] = (timeMap[timeBucket(lc.logged_at)] ?? 0) + lc.count
  })
  const timeOfDayData = buckets.map(b => ({ time: b, fish: timeMap[b] }))

  // ── Best day of week ───────────────────────────────────────────────────────
  const dayMap: Record<number, { trips: number; fish: number }> = {}
  ;(trips ?? []).forEach(t => {
    const day = new Date(t.trip_date + 'T00:00:00').getDay()
    if (!dayMap[day]) dayMap[day] = { trips: 0, fish: 0 }
    dayMap[day].trips++
    dayMap[day].fish += (catches ?? []).filter(c => c.trip_id === t.id).reduce((s, c) => s + c.count, 0)
  })
  const dayOfWeekData = DAY_NAMES.map((name, i) => ({
    day: name,
    avg: dayMap[i] ? Math.round((dayMap[i].fish / dayMap[i].trips) * 10) / 10 : 0,
    trips: dayMap[i]?.trips ?? 0,
  }))

  // ── Top locations ──────────────────────────────────────────────────────────
  const locationMap: Record<string, number> = {}
  ;(trips ?? []).forEach(t => {
    if (!t.location) return
    const fish = (catches ?? []).filter(c => c.trip_id === t.id).reduce((s, c) => s + c.count, 0)
    locationMap[t.location] = (locationMap[t.location] ?? 0) + fish
  })
  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, fish]) => ({ name, fish }))

  // ── Package vs catch performance ───────────────────────────────────────────
  const pkgMap: Record<string, { trips: number; fish: number }> = {}
  ;(trips ?? []).forEach(t => {
    const label = (t.guide_time_slots as unknown as { label: string } | null)?.label ?? null
    if (!label) return
    if (!pkgMap[label]) pkgMap[label] = { trips: 0, fish: 0 }
    pkgMap[label].trips++
    pkgMap[label].fish += (catches ?? []).filter(c => c.trip_id === t.id).reduce((s, c) => s + c.count, 0)
  })
  const packageFishData = Object.entries(pkgMap)
    .map(([pkg, d]) => ({ package: pkg, avgFish: d.trips > 0 ? Math.round((d.fish / d.trips) * 10) / 10 : 0 }))
    .sort((a, b) => b.avgFish - a.avgFish)

  // ── Monthly avg fish per trip trend ───────────────────────────────────────
  const monthTripMap: Record<string, { trips: number; fish: number }> = {}
  ;(trips ?? []).forEach(t => {
    const m = t.trip_date.slice(0, 7)
    if (!monthTripMap[m]) monthTripMap[m] = { trips: 0, fish: 0 }
    monthTripMap[m].trips++
    monthTripMap[m].fish += (catches ?? []).filter(c => c.trip_id === t.id).reduce((s, c) => s + c.count, 0)
  })
  const avgFishTrend = Object.entries(monthTripMap).sort().map(([m, d]) => ({
    month: new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
    avg: d.trips > 0 ? Math.round((d.fish / d.trips) * 10) / 10 : 0,
  }))

  // ── Financial analytics ────────────────────────────────────────────────────
  const allYears = [...new Set((trips ?? []).map(t => parseInt(t.trip_date.slice(0, 4))))].sort((a, b) => b - a)

  const yoyData: Record<number, number[]> = {}
  ;(trips ?? []).forEach(t => {
    const year = parseInt(t.trip_date.slice(0, 4))
    const monthIdx = parseInt(t.trip_date.slice(5, 7)) - 1
    if (!yoyData[year]) yoyData[year] = Array(12).fill(0)
    yoyData[year][monthIdx] += t.amount_collected ?? 0
  })

  // ── Year-over-year avg fish per trip ──────────────────────────────────────
  const yoyFishData: Record<number, (number | null)[]> = {}
  ;(trips ?? []).forEach(t => {
    const year = parseInt(t.trip_date.slice(0, 4))
    const monthIdx = parseInt(t.trip_date.slice(5, 7)) - 1
    if (!yoyFishData[year]) yoyFishData[year] = Array(12).fill({ trips: 0, fish: 0 })
    const current = yoyFishData[year][monthIdx] as any
    const trips_count = (current?.trips ?? 0) + 1
    const fish_count = (current?.fish ?? 0) + ((catches ?? []).filter(c => c.trip_id === t.id).reduce((s, c) => s + c.count, 0))
    yoyFishData[year][monthIdx] = trips_count > 0 ? Math.round((fish_count / trips_count) * 10) / 10 : 0
  })

  const allTimeFinancial = buildFinancialData(trips ?? [], scheduledTrips ?? [])

  const fishingData = {
    speciesData, moonData, pressureData, monthFishData, totalFish, totalTrips,
    avgFishPerTrip, bestTrip, successRate, totalHours: Math.round(totalHours * 10) / 10,
    timeOfDayData, dayOfWeekData, topLocations, packageFishData, avgFishTrend,
    hasLiveCatchData: (liveCatches ?? []).length > 0,
    yoyFishData,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      <AnalyticsTabs
        fishingData={fishingData}
        allTimeFinancial={allTimeFinancial}
        allTrips={(trips ?? []) as any[]}
        scheduledTrips={(scheduledTrips ?? []) as any[]}
        allYears={allYears}
        yoyData={yoyData}
      />
    </div>
  )
}

function buildFinancialData(filtered: any[], scheduled: any[] = []) {
  const totalRevenue = filtered.reduce((s: number, t: any) => s + (t.amount_collected ?? 0), 0)
  const totalBilled = filtered.reduce((s: number, t: any) => s + (t.price ?? 0), 0)
  const totalOutstanding = Math.max(0, totalBilled - totalRevenue)
  const count = filtered.length
  const avgPerTrip = count > 0 ? totalRevenue / count : 0
  const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 100

  const monthRevMap: Record<string, number> = {}
  const monthBilledMap: Record<string, number> = {}
  filtered.forEach((t: any) => {
    const m = t.trip_date.slice(0, 7)
    monthRevMap[m] = (monthRevMap[m] ?? 0) + (t.amount_collected ?? 0)
    monthBilledMap[m] = (monthBilledMap[m] ?? 0) + (t.price ?? 0)
  })

  const bestMonth = Object.entries(monthRevMap).sort((a, b) => b[1] - a[1])[0]
  const bestMonthLabel = bestMonth ? new Date(bestMonth[0] + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : '—'
  const bestMonthAmount = bestMonth ? bestMonth[1] : 0

  const revenueData = Object.entries(monthRevMap).sort().map(([m, revenue]) => ({
    month: new Date(m + '-01').toLocaleString('default', { month: 'short' }), revenue,
  }))

  const financialsBarData = Object.keys({ ...monthRevMap, ...monthBilledMap }).sort().map(m => ({
    month: new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
    revenue: monthRevMap[m] ?? 0,
    outstanding: Math.max(0, (monthBilledMap[m] ?? 0) - (monthRevMap[m] ?? 0)),
  }))

  const paymentMap: Record<string, number> = {}
  filtered.forEach((t: any) => {
    if (!t.payment_method || !t.amount_collected) return
    paymentMap[t.payment_method] = (paymentMap[t.payment_method] ?? 0) + t.amount_collected
  })
  const paymentData = Object.entries(paymentMap).map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount)

  const packageMap: Record<string, number> = {}
  filtered.forEach((t: any) => {
    const label = (t.guide_time_slots as { label: string } | null)?.label ?? 'No Package'
    packageMap[label] = (packageMap[label] ?? 0) + (t.amount_collected ?? 0)
  })
  const packageData = Object.entries(packageMap).map(([pkg, revenue]) => ({ package: pkg, revenue })).sort((a, b) => b.revenue - a.revenue)

  const clientMap: Record<string, { name: string; revenue: number }> = {}
  filtered.forEach((t: any) => {
    const id = t.client_id ?? 'unknown'
    const name = (t.clients as { name: string } | null)?.name ?? 'No client'
    if (!clientMap[id]) clientMap[id] = { name, revenue: 0 }
    clientMap[id].revenue += t.amount_collected ?? 0
  })
  const topClients = Object.values(clientMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const avgByMonth = Object.entries(monthRevMap).sort().map(([m, rev]) => {
    const c = filtered.filter((t: any) => t.trip_date.startsWith(m)).length
    return { month: new Date(m + '-01').toLocaleString('default', { month: 'short' }), revenue: c > 0 ? Math.round(rev / c) : 0 }
  })

  const outstanding = [
    ...filtered.filter((t: any) => (t.price ?? 0) > (t.amount_collected ?? 0))
      .map((t: any) => ({
        id: t.id,
        client: (t.clients as { name: string } | null)?.name ?? 'No client',
        date: t.trip_date,
        owed: (t.price ?? 0) - (t.amount_collected ?? 0),
        status: 'completed',
      })),
    ...scheduled.filter((t: any) => (t.price ?? 0) > (t.amount_collected ?? 0))
      .map((t: any) => ({
        id: t.id,
        client: (t.clients as { name: string } | null)?.name ?? 'No client',
        date: t.trip_date,
        owed: (t.price ?? 0) - (t.amount_collected ?? 0),
        status: 'scheduled',
      })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return { totalRevenue, totalBilled, totalOutstanding, totalTrips: count, avgPerTrip, collectionRate, bestMonthLabel, bestMonthAmount, revenueData, financialsBarData, paymentData, packageData, topClients, avgByMonth, outstanding }
}
