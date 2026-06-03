'use client'

import { useState } from 'react'
import { SpeciesDonut } from '@/components/charts/species-donut'
import { FishByMoon } from '@/components/charts/fish-by-moon'
import { FishByPressure } from '@/components/charts/fish-by-pressure'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { FishByMonth } from '@/components/charts/fish-by-month'
import { FinancialsBar } from '@/components/charts/financials-bar'
import { PaymentMethodDonut } from '@/components/charts/payment-method-donut'

const TABS = ['Fishing', 'Financials'] as const
type Tab = typeof TABS[number]

export function AnalyticsTabs({ fishingData, financialData }: {
  fishingData: any
  financialData: any
}) {
  const [tab, setTab] = useState<Tab>('Financials')

  const { speciesData, moonData, pressureData, monthFishData, totalFish } = fishingData
  const { financialsBarData, revenueData, paymentData, avgByMonth, totalRevenue, totalBilled, totalOutstanding, totalTrips } = financialData

  return (
    <>
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
              <p className="text-3xl font-bold text-slate-900 mt-1">${totalTrips > 0 ? (totalRevenue / totalTrips).toFixed(0) : '0'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
              <h2 className="font-semibold text-slate-900 mb-1">Collected vs Outstanding by Month</h2>
              <p className="text-xs text-slate-400 mb-4">Blue = collected · Yellow = still owed</p>
              <FinancialsBar data={financialsBarData} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Monthly Revenue Trend</h2>
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
