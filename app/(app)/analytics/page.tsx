import { createClient } from '@/lib/supabase/server'
import { SpeciesDonut } from '@/components/charts/species-donut'
import { FishByMoon } from '@/components/charts/fish-by-moon'
import { FishByPressure } from '@/components/charts/fish-by-pressure'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { FishByMonth } from '@/components/charts/fish-by-month'
import { FinancialsBar } from '@/components/charts/financials-bar'
import { PaymentMethodDonut } from '@/components/charts/payment-method-donut'
import { AnalyticsTabs } from './analytics-tabs'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: trips }, { data: catches }, { data: conditions }] = await Promise.all([
    supabase.from('trips').select('id, trip_date, amount_collected, price, payment_method').eq('guide_id', user!.id).eq('status', 'completed'),
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

  // ── Financial analytics ────────────────────────────────────────────────────

  const totalRevenue = (trips ?? []).reduce((s, t) => sum(s, t.amount_collected), 0)
  const totalBilled = (trips ?? []).reduce((s, t) => sum(s, t.price), 0)
  const totalOutstanding = Math.max(0, totalBilled - totalRevenue)
  const totalTrips = (trips ?? []).length

  // Revenue vs outstanding by month
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

  // Monthly revenue line
  const revenueData = Object.entries(monthFinMap).sort().map(([month, d]) => ({
    month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
    revenue: d.revenue,
  }))

  // Payment method breakdown
  const paymentMap: Record<string, number> = {}
  ;(trips ?? []).forEach(t => {
    if (!t.payment_method || !t.amount_collected) return
    paymentMap[t.payment_method] = (paymentMap[t.payment_method] ?? 0) + t.amount_collected
  })
  const paymentData = Object.entries(paymentMap).map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount)

  // Average revenue per trip by month
  const avgByMonth = Object.entries(monthFinMap).sort().map(([month, d]) => {
    const tripsInMonth = (trips ?? []).filter(t => t.trip_date.startsWith(month)).length
    return {
      month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      revenue: tripsInMonth > 0 ? Math.round(d.revenue / tripsInMonth) : 0,
    }
  })

  const fishingData = { speciesData, moonData, pressureData, monthFishData, totalFish }
  const financialData = { financialsBarData, revenueData, paymentData, avgByMonth, totalRevenue, totalBilled, totalOutstanding, totalTrips }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      <AnalyticsTabs fishingData={fishingData} financialData={financialData} />
    </div>
  )
}

function sum(acc: number, val: number | null) { return acc + (val ?? 0) }
