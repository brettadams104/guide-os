'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { removeWaterGauge } from '@/lib/actions/water-gauges'

export interface GaugeData {
  gaugeId: string
  siteNo: string
  displayName: string
  siteName: string
  cfs: number | null
  gageHeight: number | null
  lastUpdated: string | null
  trend: 'rising' | 'falling' | 'steady' | null
  history: { label: string; cfs: number }[]
}

function TrendIcon({ trend }: { trend: GaugeData['trend'] }) {
  if (trend === 'rising') return <span className="text-blue-500 font-bold text-lg">↑</span>
  if (trend === 'falling') return <span className="text-amber-500 font-bold text-lg">↓</span>
  if (trend === 'steady') return <span className="text-slate-400 font-bold text-lg">→</span>
  return null
}

function formatUpdated(dateTime: string | null): string {
  if (!dateTime) return 'No data'
  const diff = Math.floor((Date.now() - new Date(dateTime).getTime()) / 60000)
  if (diff < 2) return 'Just now'
  if (diff < 60) return `${diff} min ago`
  const h = Math.floor(diff / 60)
  return `${h}h ago`
}

export function GaugeCard({ gauge }: { gauge: GaugeData }) {
  const [removing, setRemoving] = useState(false)

  async function handleRemove() {
    setRemoving(true)
    await removeWaterGauge(gauge.gaugeId)
  }

  const trendLabel = gauge.trend === 'rising' ? 'Rising' : gauge.trend === 'falling' ? 'Falling' : 'Steady'
  const trendColor = gauge.trend === 'rising' ? 'text-blue-500' : gauge.trend === 'falling' ? 'text-amber-500' : 'text-slate-400'

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-opacity ${removing ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-base truncate">{gauge.displayName}</p>
          <p className="text-slate-400 text-xs mt-0.5 truncate">{gauge.siteName} · {gauge.siteNo}</p>
        </div>
        <button
          onClick={handleRemove}
          className="shrink-0 text-slate-300 hover:text-red-400 transition-colors mt-0.5 text-sm"
          title="Remove"
        >
          ✕
        </button>
      </div>

      {/* Flow stats */}
      <div className="px-5 pb-4 flex items-end gap-6">
        <div>
          <p className="text-4xl font-black text-sky-600">
            {gauge.cfs != null ? Math.round(gauge.cfs).toLocaleString() : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">CFS</p>
        </div>
        {gauge.trend && (
          <div className="flex items-center gap-1 pb-1">
            <TrendIcon trend={gauge.trend} />
            <span className={`text-sm font-semibold ${trendColor}`}>{trendLabel}</span>
          </div>
        )}
        {gauge.gageHeight != null && (
          <div className="ml-auto pb-1 text-right">
            <p className="text-lg font-bold text-slate-700">{gauge.gageHeight.toFixed(2)} ft</p>
            <p className="text-xs text-slate-400">gage height</p>
          </div>
        )}
      </div>

      {/* 7-day sparkline */}
      {gauge.history.length > 2 && (
        <div className="px-1">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={gauge.history} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`grad-${gauge.siteNo}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v: unknown) => [`${Math.round(v as number).toLocaleString()} CFS`, '']}
                labelFormatter={() => ''}
              />
              <Area
                type="monotone"
                dataKey="cfs"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill={`url(#grad-${gauge.siteNo})`}
                dot={false}
                activeDot={{ r: 3, fill: '#0ea5e9' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">Updated {formatUpdated(gauge.lastUpdated)}</p>
        <a
          href={`https://waterdata.usgs.gov/monitoring-location/${gauge.siteNo}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-500 hover:text-sky-400 font-medium"
        >
          USGS Site ↗
        </a>
      </div>
    </div>
  )
}
