import { createClient } from '@/lib/supabase/server'
import { SpeciesDonut } from '@/components/charts/species-donut'
import { FishByMoon } from '@/components/charts/fish-by-moon'
import { FishByPressure } from '@/components/charts/fish-by-pressure'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { FishByMonth } from '@/components/charts/fish-by-month'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: trips }, { data: catches }, { data: conditions }] = await Promise.all([
    supabase.from('trips').select('id, trip_date, amount_collected').eq('guide_id', user!.id),
    supabase.from('trip_catches').select('species, count, trip_id'),
    supabase.from('trip_conditions').select('trip_id, moon_phase, pressure_trend'),
  ])

  // Species breakdown
  const speciesMap: Record<string, number> = {}
  ;(catches ?? []).forEach(c => { speciesMap[c.species] = (speciesMap[c.species] ?? 0) + c.count })
  const speciesData = Object.entries(speciesMap).map(([species, count]) => ({ species, count })).sort((a, b) => b.count - a.count)

  // Fish by moon phase
  const moonFish: Record<string, number[]> = {}
  ;(conditions ?? []).forEach(c => {
    if (!c.moon_phase) return
    const tripCatches = (catches ?? []).filter(tc => tc.trip_id === c.trip_id)
    const total = tripCatches.reduce((s, tc) => s + tc.count, 0)
    if (!moonFish[c.moon_phase]) moonFish[c.moon_phase] = []
    moonFish[c.moon_phase].push(total)
  })
  const moonData = Object.entries(moonFish).map(([phase, counts]) => ({
    phase: phase.replace(' Moon', '').replace('ing', ''),
    avg: counts.reduce((s, n) => s + n, 0) / counts.length,
  }))

  // Fish by pressure
  const pressureFish: Record<string, number[]> = {}
  ;(conditions ?? []).forEach(c => {
    if (!c.pressure_trend) return
    const tripCatches = (catches ?? []).filter(tc => tc.trip_id === c.trip_id)
    const total = tripCatches.reduce((s, tc) => s + tc.count, 0)
    if (!pressureFish[c.pressure_trend]) pressureFish[c.pressure_trend] = []
    pressureFish[c.pressure_trend].push(total)
  })
  const pressureData = Object.entries(pressureFish).map(([trend, counts]) => ({
    trend, avg: counts.reduce((s, n) => s + n, 0) / counts.length,
  }))

  // Revenue by month
  const revenueMap: Record<string, number> = {}
  ;(trips ?? []).forEach(t => {
    const month = t.trip_date.slice(0, 7)
    revenueMap[month] = (revenueMap[month] ?? 0) + (t.amount_collected ?? 0)
  })
  const revenueData = Object.entries(revenueMap).sort().map(([month, revenue]) => ({
    month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
    revenue,
  }))

  // Fish by month
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
  const totalRevenue = (trips ?? []).reduce((s, t) => s + (t.amount_collected ?? 0), 0)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Trips</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{(trips ?? []).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Fish</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalFish}</p>
        </div>
        <div className="bg-sky-500 rounded-2xl p-5">
          <p className="text-xs text-sky-100 uppercase tracking-wide">Total Revenue</p>
          <p className="text-3xl font-bold text-white mt-1">${totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Species Breakdown</h2>
          <SpeciesDonut data={speciesData} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Avg Fish by Moon Phase</h2>
          <FishByMoon data={moonData} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Avg Fish by Pressure Trend</h2>
          <FishByPressure data={pressureData} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
          <RevenueChart data={revenueData} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-4">Fish Caught by Month</h2>
          <FishByMonth data={monthFishData} />
        </div>
      </div>
    </div>
  )
}
