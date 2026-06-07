'use client'

import { useState, useMemo } from 'react'
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

const TABS = ['Fishing', 'Financials'] as const
type Tab = typeof TABS[number]

function buildFinancialData(filtered: any[]) {
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
    month: new Date(m + '-01').toLocaleString('default', { month: 'short' }),
    revenue,
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

  const outstanding = filtered
    .filter((t: any) => (t.price ?? 0) > (t.amount_collected ?? 0))
    .map((t: any) => ({
      id: t.id,
      client: (t.clients as { name: string } | null)?.name ?? 'No client',
      date: t.trip_date,
      owed: (t.price ?? 0) - (t.amount_collected ?? 0),
    }))

  return { totalRevenue, totalBilled, totalOutstanding, totalTrips: count, avgPerTrip, collectionRate, bestMonthLabel, bestMonthAmount, revenueData, financialsBarData, paymentData, packageData, topClients, avgByMonth, outstanding }
}

export function AnalyticsTabs({ fishingData, allTrips, allYears, yoyData }: {
  fishingData: any
  allTimeFinancial: any
  allTrips: any[]
  allYears: number[]
  yoyData: Record<number, number[]>
}) {
  const [tab, setTab] = useState<Tab>('Fishing')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const { speciesData, moonData, pressureData, monthFishData, totalFish, totalTrips } = fishingData

  const filtered = useMemo(() =>
    selectedYear ? allTrips.filter(t => t.trip_date.startsWith(String(selectedYear))) : allTrips,
    [allTrips, selectedYear]
  )

  const fin = useMemo(() => buildFinancialData(filtered), [filtered])

  return (
    <>
      {/* Main tab toggle */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
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
            <div className={`rounded-2xl p-5 ${fin.totalOutstanding > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-200'}`}>
              <p className={`text-xs uppercase tracking-widest font-semibold ${fin.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Outstanding</p>
              <p className={`text-3xl font-black mt-2 ${fin.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>${fin.totalOutstanding.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Best Month</p>
              <p className="text-xl font-black text-slate-900 mt-2">${fin.bestMonthAmount.toFixed(0)}</p>
              <p className="text-slate-400 text-xs mt-1">{fin.bestMonthLabel}</p>
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
                      <p className="font-semibold text-slate-900 text-sm">{t.client}</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Trips</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalTrips}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Fish</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalFish}</p>
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
              <h2 className="font-semibold text-slate-900 mb-4">Fish Caught by Month</h2>
              <FishByMonth data={monthFishData} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
