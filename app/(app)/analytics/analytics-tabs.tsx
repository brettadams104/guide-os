'use client'

import { useState, useMemo, useEffect } from 'react'
import { fmtMonthShort, fmtMonthYear, fmtMonthLong, fmtDate, fmtDateShort } from '@/lib/date-utils'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { SpeciesDonut } from '@/components/charts/species-donut'
import { FishByMoon } from '@/components/charts/fish-by-moon'
import { FishByPressure } from '@/components/charts/fish-by-pressure'
import { FishByMonth } from '@/components/charts/fish-by-month'
import { FinancialsBar } from '@/components/charts/financials-bar'
import { RevenueAreaChart } from '@/components/charts/revenue-area-chart'
import { RevenueByPackage } from '@/components/charts/revenue-by-package'
import { TopClientsChart } from '@/components/charts/top-clients-chart'
import { YoYChart } from '@/components/charts/yoy-chart'
import { PaymentMethodDonut } from '@/components/charts/payment-method-donut'
import Link from 'next/link'

const TABS = ['Financials', 'Fishing'] as const
type Tab = typeof TABS[number]

function buildFinancialData(filtered: any[], scheduled: any[] = []) {
  const allTrips         = [...filtered, ...(scheduled ?? [])]
  const totalTips        = filtered.reduce((s: number, t: any) => s + (t.tip_amount ?? 0), 0)
  const totalCollected   = filtered.reduce((s: number, t: any) => s + (t.amount_collected ?? 0), 0)
  const totalRevenue     = totalCollected + totalTips
  const totalBilled      = filtered.reduce((s: number, t: any) => s + (t.price ?? 0), 0)
  const totalOutstanding = allTrips.reduce((s: number, t: any) => s + Math.max(0, (t.price ?? 0) - (t.amount_collected ?? 0)), 0)
  const count = filtered.length
  const avgPerTrip = count > 0 ? totalRevenue / count : 0
  const collectionRate = totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 100

  const monthRevMap: Record<string, number> = {}
  const monthBilledMap: Record<string, number> = {}
  filtered.forEach((t: any) => {
    const m = t.trip_date.slice(0, 7)
    monthRevMap[m] = (monthRevMap[m] ?? 0) + (t.amount_collected ?? 0)
    monthBilledMap[m] = (monthBilledMap[m] ?? 0) + (t.price ?? 0)
  })

  const bestMonth = Object.entries(monthRevMap).sort((a, b) => b[1] - a[1])[0]
  const bestMonthLabel = bestMonth ? fmtMonthLong(bestMonth[0]) : '—'
  const bestMonthAmount = bestMonth ? bestMonth[1] : 0

  const revenueData = Object.entries(monthRevMap).sort().map(([m, revenue]) => ({
    month: fmtMonthShort(m),
    revenue,
  }))

  const financialsBarData = Object.keys({ ...monthRevMap, ...monthBilledMap }).sort().map(m => ({
    month: fmtMonthYear(m),
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
    return { month: fmtMonthShort(m), revenue: c > 0 ? Math.round(rev / c) : 0 }
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

  return { totalRevenue, totalTips, totalBilled, totalOutstanding, totalTrips: count, avgPerTrip, collectionRate, bestMonthLabel, bestMonthAmount, revenueData, financialsBarData, paymentData, packageData, topClients, avgByMonth, outstanding }
}

export function AnalyticsTabs({ fishingData, allTrips, scheduledTrips, allYears, yoyData }: {
  fishingData: any
  allTimeFinancial: any
  allTrips: any[]
  scheduledTrips: any[]
  allYears: number[]
  yoyData: Record<number, number[]>
}) {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab')
      if (p === 'Fishing') return 'Fishing'
    }
    return 'Financials'
  })
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  function switchTab(t: Tab) {
    setTab(t)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', t)
    window.history.replaceState(null, '', url.toString())
  }

  const {
    speciesData, moonData, pressureData, monthFishData, totalFish, totalTrips,
    avgFishPerTrip, bestTrip, successRate, timeOfDayData, dayOfWeekData,
    topLocations, packageFishData, avgFishTrend, hasLiveCatchData, yoyFishData,
  } = fishingData

  const filtered = useMemo(() =>
    selectedYear ? allTrips.filter(t => t.trip_date.startsWith(String(selectedYear))) : allTrips,
    [allTrips, selectedYear]
  )

  const fin = useMemo(() => buildFinancialData(filtered, scheduledTrips ?? []), [filtered, scheduledTrips])

  return (
    <>
      {/* Main tab toggle */}
      <div data-tour="analytics-tabs" className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => switchTab(t)}
            data-tour-tab={t.toLowerCase()}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >{t}</button>
        ))}
      </div>

      {/* ── Financials ─────────────────────────────────────────── */}
      {tab === 'Financials' && (
        <div className="space-y-6">

          {/* Year filter */}
          {allYears.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-slate-500 font-medium">Filter by year:</span>
              <button onClick={() => setSelectedYear(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${!selectedYear ? 'bg-[#0f1f35] text-white border-[#0f1f35]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                All Time
              </button>
              {allYears.map(y => (
                <button key={y} onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedYear === y ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'}`}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-sky-500 rounded-2xl p-5 col-span-2 lg:col-span-1">
              <p className="text-xs text-sky-100 uppercase tracking-widest font-semibold">Total Collected</p>
              <p className="text-4xl font-black text-white mt-2">${fin.totalRevenue.toFixed(0)}</p>
              <p className="text-sky-200 text-xs mt-1">{fin.totalTrips} completed trips</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Avg Per Trip</p>
              <p className="text-3xl font-black text-slate-900 mt-2">${fin.avgPerTrip.toFixed(0)}</p>
            </div>
            <Link href="/outstanding" className={`rounded-2xl p-5 block hover:opacity-80 transition-opacity ${fin.totalOutstanding > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-200'}`}>
              <p className={`text-xs uppercase tracking-widest font-semibold ${fin.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Outstanding</p>
              <p className={`text-3xl font-black mt-2 ${fin.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>${fin.totalOutstanding.toFixed(0)}</p>
              {fin.totalOutstanding > 0 && <p className="text-xs text-amber-500 mt-1">Tap to view →</p>}
            </Link>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Best Month</p>
              <p className="text-xl font-black text-slate-900 mt-2">${fin.bestMonthAmount.toFixed(0)}</p>
              <p className="text-slate-400 text-xs mt-1">{fin.bestMonthLabel}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
              <p className="text-xs text-emerald-600 uppercase tracking-widest font-semibold">Total Tips</p>
              <p className="text-3xl font-black text-emerald-700 mt-2">${fin.totalTips.toFixed(0)}</p>
              <p className="text-emerald-500 text-xs mt-1">across {fin.totalTrips} trips</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Collection Rate</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{fin.collectionRate}%</p>
              <div className="mt-2 bg-slate-100 rounded-full h-1.5">
                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(fin.collectionRate, 100)}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total Billed</p>
              <p className="text-3xl font-black text-slate-900 mt-2">${fin.totalBilled.toFixed(0)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
              <h2 className="font-bold text-slate-900 mb-1">Monthly Revenue</h2>
              <p className="text-xs text-slate-400 mb-4">Total collected by month</p>
              <RevenueAreaChart data={fin.revenueData} />
            </div>

            {Object.keys(yoyData).length > 1 && !selectedYear && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
                <h2 className="font-bold text-slate-900 mb-1">Year-Over-Year Revenue</h2>
                <p className="text-xs text-slate-400 mb-4">Compare monthly revenue across years</p>
                <YoYChart data={yoyData} />
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
              <h2 className="font-bold text-slate-900 mb-1">Collected vs Outstanding</h2>
              <p className="text-xs text-slate-400 mb-4">Blue = collected · Yellow = still owed</p>
              <FinancialsBar data={fin.financialsBarData} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-1">Revenue by Package</h2>
              <p className="text-xs text-slate-400 mb-4">Which packages generate the most</p>
              <RevenueByPackage data={fin.packageData} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-1">Top Clients by Spend</h2>
              <p className="text-xs text-slate-400 mb-4">Your highest-value clients</p>
              <TopClientsChart data={fin.topClients} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
              <h2 className="font-bold text-slate-900 mb-1">Average Revenue Per Trip</h2>
              <p className="text-xs text-slate-400 mb-4">Is your average trip value trending up?</p>
              <RevenueAreaChart data={fin.avgByMonth} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Revenue by Payment Method</h2>
              <PaymentMethodDonut data={fin.paymentData} />
            </div>
          </div>

          {/* Outstanding balances */}
          {fin.outstanding.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-100 bg-amber-50">
                <h2 className="font-bold text-amber-800">Outstanding Balances</h2>
                <p className="text-xs text-amber-600 mt-0.5">{fin.outstanding.length} trip{fin.outstanding.length !== 1 ? 's' : ''} · ${fin.outstanding.reduce((s: number, t: any) => s + t.owed, 0).toFixed(0)} total owed</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {fin.outstanding.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 text-sm">{t.client}</p>
                        {t.status === 'scheduled' && (
                          <span className="text-xs bg-sky-100 text-sky-600 font-medium px-1.5 py-0.5 rounded-full">Upcoming</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <Link href={`/trips/${t.id}`} className="font-bold text-amber-600">${t.owed.toFixed(0)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Fishing ────────────────────────────────────────────── */}
      {tab === 'Fishing' && (
        <div className="space-y-6">

          {/* Key stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-sky-500 rounded-2xl p-5">
              <p className="text-xs text-sky-100 uppercase tracking-widest font-semibold">Total Fish</p>
              <p className="text-4xl font-black text-white mt-2">{totalFish.toLocaleString()}</p>
              <p className="text-sky-200 text-xs mt-1">{totalTrips} completed trips</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Avg Per Trip</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{avgFishPerTrip}</p>
              <p className="text-slate-400 text-xs mt-1">Fish per outing</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Success Rate</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{successRate}%</p>
              <div className="mt-2 bg-slate-100 rounded-full h-1.5">
                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(successRate, 100)}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Personal Best</p>
              {bestTrip ? (
                <>
                  <p className="text-3xl font-black text-slate-900 mt-2">{bestTrip.fish}</p>
                  <p className="text-slate-400 text-xs mt-1 truncate">{bestTrip.location ?? new Date(bestTrip.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </>
              ) : <p className="text-slate-400 text-sm mt-2">No data yet</p>}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Avg fish per trip trend */}
            {Object.keys(yoyFishData).length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
                <h2 className="font-bold text-slate-900 mb-1">Avg Fish Per Trip — Year-Over-Year</h2>
                <p className="text-xs text-slate-400 mb-4">Compare average catches across years</p>
                <YoYChart data={yoyFishData} formatValue={(v) => `${v} fish`} />
              </div>
            )}

            {/* 2. Species breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Species Breakdown</h2>
              <SpeciesDonut data={speciesData} />
            </div>

            {/* 3. Top locations */}
            {topLocations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 mb-1">Top Fishing Spots</h2>
                <p className="text-xs text-slate-400 mb-4">Your most productive waters by total fish</p>
                <ResponsiveContainer width="100%" height={Math.max(140, topLocations.length * 36)}>
                  <BarChart data={topLocations} layout="vertical" barSize={22}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: unknown) => [`${v} fish`, '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="fish" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 4. Package fish performance */}
            {packageFishData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 mb-1">Avg Fish by Package</h2>
                <p className="text-xs text-slate-400 mb-4">Which packages produce the best fishing?</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={packageFishData} barSize={32}>
                    <XAxis dataKey="package" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v: unknown) => [`${v} avg fish`, '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="avgFish" fill="#0f1f35" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Other charts */}
            {/* Time of day */}
            {hasLiveCatchData && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 mb-1">Fish by Time of Day</h2>
                <p className="text-xs text-slate-400 mb-4">When do fish bite most on your guided trips?</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={timeOfDayData} barSize={32}>
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v: unknown) => [`${v} fish`, '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="fish" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Fish by month */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Fish Caught by Month</h2>
              <FishByMonth data={monthFishData} />
            </div>

            {/* Moon phase */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Avg Fish by Moon Phase</h2>
              <FishByMoon data={moonData} />
            </div>

            {/* Pressure trend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Avg Fish by Pressure Trend</h2>
              <FishByPressure data={pressureData} />
            </div>

            {/* Best day of week - LAST */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
              <h2 className="font-bold text-slate-900 mb-1">Best Day of the Week</h2>
              <p className="text-xs text-slate-400 mb-4">Average fish per trip by day — great for scheduling</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dayOfWeekData} barSize={28}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: unknown, _: unknown, p: any) => [`${v} avg fish (${p?.payload?.trips ?? 0} trips)`, '']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {dayOfWeekData.map((entry: {avg: number}, i: number) => (
                      <Cell key={i} fill={entry.avg === Math.max(...dayOfWeekData.map((d: {avg: number}) => d.avg)) ? '#0f1f35' : '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 mt-2 text-center">Darkest bar = best day</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
