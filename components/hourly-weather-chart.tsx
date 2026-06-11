'use client'

import { useRef, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ComposedChart } from 'recharts'

export interface HourlyChartPoint {
  label: string
  isNow: boolean
  temp: number
  windSpeed: number
  windDir: number
  pressure: number
  precipitation: number
  cloudCover: number
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function hpaToInHg(hpa: number): number {
  return hpa * 0.02953
}

function windArrowColor(speed: number): string {
  if (speed < 5) return '#cbd5e1'
  if (speed < 15) return '#7dd3fc'
  if (speed < 25) return '#3b82f6'
  return '#1d4ed8'
}

const CHART_WIDTH = 900

function WindArrowStrip({ data }: { data: HourlyChartPoint[] }) {
  const plotLeft  = 86
  const plotRight = CHART_WIDTH - 98
  const plotWidth = plotRight - plotLeft
  const n = data.length

  return (
    <svg width={CHART_WIDTH} height={48} style={{ display: 'block' }}>
      {data.map((h, i) => {
        const cx       = plotLeft + (i + 0.5) * (plotWidth / n)
        const rotation = (h.windDir + 180) % 360
        const color    = windArrowColor(h.windSpeed)
        return (
          <g key={i} transform={`translate(${cx}, 24) rotate(${rotation})`}>
            <line x1="0" y1="8" x2="0" y2="-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="0,-9 -3.5,-2 3.5,-2" fill={color} />
          </g>
        )
      })}
    </svg>
  )
}

export function HourlyWeatherChart({ data }: { data: HourlyChartPoint[] }) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const nowIdx     = data.findIndex(d => d.isNow)
  const currentData = data.find(d => d.isNow) ?? data[0]
  const avgHigh    = data.length ? Math.max(...data.map(d => d.temp)) : 0
  const pressureMin = data.length ? Math.min(...data.map(d => d.pressure)) - 1 : 1010
  const pressureMax = data.length ? Math.max(...data.map(d => d.pressure)) + 1 : 1016

  useEffect(() => {
    if (!scrollRef.current || nowIdx < 0) return
    const pxPerHour = CHART_WIDTH / 24
    scrollRef.current.scrollLeft = Math.max(0, (nowIdx - 3) * pxPerHour)
  }, [nowIdx])

  if (!data.length) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 pt-4 pb-3">Hourly Detail</p>

      {/* Chart key */}
      <div className="px-4 pb-3 border-b border-slate-100">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-5 shrink-0 border-t-2 border-green-500 block" />
            <span>Pressure (inHg)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 shrink-0 border-t-2 border-orange-500 block" />
            <span>Temperature (°F)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 shrink-0 border-t-2 border-dashed border-blue-400 block" />
            <span>Wind Speed (mph)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex gap-1 shrink-0">
              {['#cbd5e1','#7dd3fc','#3b82f6','#1d4ed8'].map(c => (
                <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </span>
            <span>Wind direction arrows</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ width: CHART_WIDTH, minWidth: CHART_WIDTH }}>

          {/* Pressure stats bar */}
          {currentData && (
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex gap-5 text-xs font-medium text-slate-500">
              <span>Bar: <span className="text-slate-800 font-bold">{hpaToInHg(currentData.pressure).toFixed(2)}"</span></span>
              <span>Rain: <span className="text-slate-800 font-bold">{currentData.precipitation}"</span></span>
              <span>Clouds: <span className="text-slate-800 font-bold">{currentData.cloudCover}%</span></span>
            </div>
          )}

          {/* Pressure chart */}
          <div className="bg-white pt-2">
            <LineChart width={CHART_WIDTH} height={110} data={data} margin={{ top: 4, right: 12, bottom: 0, left: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={2} />
              <YAxis domain={[pressureMin, pressureMax]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => hpaToInHg(v).toFixed(2)} width={42} />
              <ReferenceLine x="Now" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="pressure" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={false} />
            </LineChart>
          </div>

          {/* Temp stats bar */}
          {currentData && (
            <div className="px-4 py-2.5 bg-slate-50 border-y border-slate-200 flex gap-5 text-xs font-medium text-slate-500">
              <span>Temp: <span className="text-slate-800 font-bold">{currentData.temp}°F</span></span>
              <span>Wind: <span className="text-slate-800 font-bold">{degToCompass(currentData.windDir)}@{currentData.windSpeed}mph</span></span>
              <span>High: <span className="text-slate-800 font-bold">{avgHigh}°F</span></span>
            </div>
          )}

          {/* Temp + Wind chart */}
          <div className="bg-white pt-2">
            <ComposedChart width={CHART_WIDTH} height={130} data={data} margin={{ top: 4, right: 52, bottom: 8, left: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={2} />
              <YAxis yAxisId="temp" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}°`} width={42} />
              <YAxis yAxisId="wind" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}mph`} width={46} />
              <ReferenceLine yAxisId="temp" x="Now" stroke="#f97316" strokeWidth={2} />
              <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} activeDot={false} />
              <Line yAxisId="wind" type="monotone" dataKey="windSpeed" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={false} />
            </ComposedChart>
          </div>

          {/* Wind arrows */}
          <div className="bg-white border-t border-slate-100 pb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 pt-2 pb-1">Wind Direction</p>
            <WindArrowStrip data={data} />
          </div>

        </div>
      </div>
    </div>
  )
}
