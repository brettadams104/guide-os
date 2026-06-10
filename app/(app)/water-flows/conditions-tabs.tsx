'use client'

import { useState } from 'react'
import type { GaugeData } from './gauge-card'
import { GaugeCard } from './gauge-card'
import { GaugeSearch } from './gauge-search'

// ── Types ──────────────────────────────────────────────────────────────────────

interface HourlyWeather {
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  weathercode: number[]
  windspeed_10m: number[]
}

interface DailyWeather {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  weathercode: number[]
  windspeed_10m_max: number[]
  precipitation_sum: number[]
  surface_pressure_mean: number[]
}

export interface WeatherPayload {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    windspeed_10m: number
    winddirection_10m: number
    surface_pressure: number
    weathercode: number
    is_day: number
  }
  hourly: HourlyWeather
  daily: DailyWeather
  location: string
}

export interface OutlookPayload extends WeatherPayload {
  moonPhase: string
  moonIllumination: number
  sunrise: string
  sunset: string
  yesterdayHigh: number | null
  yesterdayLow: number | null
  yesterdayWeather: string | null
  pressureTrend: 'rising' | 'steady' | 'falling'
  primaryGauge: GaugeData | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 55) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Thunderstorm'
}

function weatherIcon(code: number, isDay = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code <= 3) return isDay ? '⛅' : '🌥'
  if (code <= 48) return '🌫'
  if (code <= 55) return '🌦'
  if (code <= 67) return '🌧'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦'
  return '⛈'
}

function windDir(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

function fmt12h(timeStr: string): string {
  const h = parseInt(timeStr.split('T')[1]?.split(':')[0] ?? '0', 10)
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h > 12 ? `${h - 12} PM` : `${h} AM`
}

function pressureHpa(hpa: number): string {
  return `${(hpa * 0.02953).toFixed(2)} inHg`
}

// ── Tab: Flows ─────────────────────────────────────────────────────────────────

function FlowsTab({ gaugeCards, siteNos }: { gaugeCards: GaugeData[]; siteNos: string[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">Real-time USGS river gauge data</p>
        <GaugeSearch existingSiteNos={siteNos} />
      </div>
      {gaugeCards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-4">
            <path d="M3 18c0-2 2-4 4-4s4 2 6 2 4-2 6-2" />
            <path d="M3 12c0-2 2-4 4-4s4 2 6 2 4-2 6-2" />
          </svg>
          <p className="text-slate-500 font-medium mb-1">No gauges saved yet</p>
          <p className="text-slate-400 text-sm">Search for a river or stream above to get started.</p>
        </div>
      ) : (
        gaugeCards.map(g => <GaugeCard key={g.gaugeId} gauge={g} />)
      )}
    </div>
  )
}

// ── Tab: Weather ───────────────────────────────────────────────────────────────

function WeatherTab({ weather, loading }: { weather: WeatherPayload | null; loading: boolean }) {
  if (loading) return <LoadingSpinner label="Fetching weather…" />
  if (!weather) return <NoLocation />

  const { current, hourly, daily } = weather
  const now = new Date()
  const currentHourIdx = hourly.time.findIndex(t => {
    const d = new Date(t)
    return d.getHours() === now.getHours() && d.toDateString() === now.toDateString()
  })
  const nextHours = hourly.time.slice(currentHourIdx, currentHourIdx + 12)
  const nextTemps = hourly.temperature_2m.slice(currentHourIdx, currentHourIdx + 12)
  const nextPrecip = hourly.precipitation_probability.slice(currentHourIdx, currentHourIdx + 12)
  const nextCodes = hourly.weathercode.slice(currentHourIdx, currentHourIdx + 12)

  return (
    <div className="space-y-4">
      <p className="text-slate-500 text-sm">{weather.location}</p>

      {/* Current conditions */}
      <div className="bg-[#0f1f35] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-6xl font-black">{Math.round(current.temperature_2m)}°</p>
            <p className="text-slate-300 text-lg mt-1">{weatherLabel(current.weathercode)}</p>
            <p className="text-slate-400 text-sm mt-0.5">Feels like {Math.round(current.apparent_temperature)}°</p>
          </div>
          <span className="text-6xl">{weatherIcon(current.weathercode, current.is_day === 1)}</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Humidity</p>
            <p className="text-white font-bold">{current.relative_humidity_2m}%</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Wind</p>
            <p className="text-white font-bold">{Math.round(current.windspeed_10m)} mph {windDir(current.winddirection_10m)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Pressure</p>
            <p className="text-white font-bold">{pressureHpa(current.surface_pressure)}</p>
          </div>
        </div>
      </div>

      {/* Hourly scroll */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Next 12 Hours</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {nextHours.map((t, i) => (
            <div key={t} className="flex flex-col items-center gap-1.5 min-w-fit">
              <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{i === 0 ? 'Now' : fmt12h(t)}</p>
              <span className="text-xl">{weatherIcon(nextCodes[i] ?? 0, true)}</span>
              <p className="text-sm font-bold text-slate-800">{Math.round(nextTemps[i] ?? 0)}°</p>
              {(nextPrecip[i] ?? 0) > 20 && <p className="text-xs text-sky-500 font-medium">{nextPrecip[i]}%</p>}
            </div>
          ))}
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">7-Day Forecast</p>
        {daily.time.map((d, i) => {
          const date = new Date(d + 'T12:00:00')
          const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          return (
            <div key={d} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-slate-700 w-28">{dayLabel}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{weatherIcon(daily.weathercode[i] ?? 0)}</span>
                <p className="text-xs text-slate-500 w-20">{weatherLabel(daily.weathercode[i] ?? 0)}</p>
              </div>
              {(daily.precipitation_sum[i] ?? 0) > 0 && (
                <p className="text-xs text-sky-500 font-medium w-12 text-center">{daily.precipitation_sum[i].toFixed(1)}"</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-slate-800">{Math.round(daily.temperature_2m_max[i] ?? 0)}°</span>
                <span className="text-slate-400">{Math.round(daily.temperature_2m_min[i] ?? 0)}°</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Trip Outlook ──────────────────────────────────────────────────────────

function TripOutlookTab({ outlook, loading }: { outlook: OutlookPayload | null; loading: boolean }) {
  if (loading) return <LoadingSpinner label="Building your trip outlook…" />
  if (!outlook) return <NoLocation />

  const { current, daily, moonPhase, moonIllumination, sunrise, sunset, yesterdayHigh, yesterdayLow, yesterdayWeather, pressureTrend, primaryGauge } = outlook

  const today = daily.time[0]
  const todayHigh = daily.temperature_2m_max[0]
  const todayLow = daily.temperature_2m_min[0]
  const todayWind = daily.windspeed_10m_max[0]
  const todayRain = daily.precipitation_sum[0]
  const todayCode = daily.weathercode[0]

  const pressureColor = pressureTrend === 'rising' ? 'text-emerald-500' : pressureTrend === 'falling' ? 'text-red-500' : 'text-amber-500'
  const pressureLabel = pressureTrend === 'rising' ? '↑ Rising' : pressureTrend === 'falling' ? '↓ Falling' : '→ Steady'
  const pressureNote = pressureTrend === 'rising' ? 'Fish tend to be more active with rising pressure' : pressureTrend === 'falling' ? 'Fish may be sluggish — pre-front activity possible' : 'Stable conditions — consistent bite expected'

  const moonNote = moonPhase === 'Full Moon' || moonPhase === 'New Moon'
    ? 'Major moon phase — solunar activity peaks, expect strong feeding windows'
    : moonPhase.includes('Quarter')
    ? 'Quarter moon — moderate solunar activity'
    : 'Minor moon phase — consistent low-light feeding expected'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">{outlook.location} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Conditions summary banner */}
      <div className="bg-[#0f1f35] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{weatherIcon(current.weathercode, current.is_day === 1)}</span>
          <div>
            <p className="text-xl font-black">{weatherLabel(todayCode ?? current.weathercode)}</p>
            <p className="text-slate-400 text-sm">{Math.round(todayHigh ?? current.temperature_2m)}° high · {Math.round(todayLow ?? current.temperature_2m - 15)}° low · {Math.round(todayWind ?? current.windspeed_10m)} mph wind</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sunrise / Sunset</p>
            <p className="text-white font-semibold text-sm">{sunrise} → {sunset}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Precipitation</p>
            <p className="text-white font-semibold text-sm">{(todayRain ?? 0) > 0 ? `${(todayRain ?? 0).toFixed(2)}" expected` : 'None expected'}</p>
          </div>
        </div>
      </div>

      {/* Yesterday vs Today */}
      {yesterdayHigh !== null && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Yesterday vs Today</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium mb-2">Yesterday</p>
              <p className="text-2xl font-black text-slate-700">{yesterdayHigh}°</p>
              <p className="text-xs text-slate-500 mt-0.5">Low {yesterdayLow}° · {yesterdayWeather}</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
              <p className="text-xs text-sky-600 font-medium mb-2">Today</p>
              <p className="text-2xl font-black text-slate-800">{Math.round(todayHigh ?? 0)}°</p>
              <p className="text-xs text-slate-500 mt-0.5">Low {Math.round(todayLow ?? 0)}° · {weatherLabel(todayCode ?? 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Barometric pressure */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Barometric Pressure</p>
        <div className="flex items-center justify-between mb-2">
          <p className="text-2xl font-black text-slate-800">{pressureHpa(current.surface_pressure)}</p>
          <span className={`text-sm font-bold ${pressureColor}`}>{pressureLabel}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{pressureNote}</p>
      </div>

      {/* Moon & Solunar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Moon & Solunar</p>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-bold text-slate-800">{moonPhase}</p>
            <p className="text-xs text-slate-500">{moonIllumination}% illumination</p>
          </div>
          <span className="text-4xl">{moonIllumination > 75 ? '🌕' : moonIllumination > 50 ? '🌔' : moonIllumination > 25 ? '🌓' : moonIllumination > 5 ? '🌒' : '🌑'}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mt-2">{moonNote}</p>
      </div>

      {/* River gauge */}
      {primaryGauge && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">River Conditions · {primaryGauge.displayName}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Current Flow</p>
              <p className="text-2xl font-black text-slate-800">{primaryGauge.cfs !== null ? `${primaryGauge.cfs.toLocaleString()}` : '—'}</p>
              <p className="text-xs text-slate-400">CFS</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Gage Height</p>
              <p className="text-2xl font-black text-slate-800">{primaryGauge.gageHeight !== null ? primaryGauge.gageHeight.toFixed(2) : '—'}</p>
              <p className="text-xs text-slate-400">feet</p>
            </div>
          </div>
          {primaryGauge.trend && (
            <p className={`text-xs font-semibold mt-3 ${primaryGauge.trend === 'rising' ? 'text-red-500' : primaryGauge.trend === 'falling' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {primaryGauge.trend === 'rising' ? '↑ Rising' : primaryGauge.trend === 'falling' ? '↓ Falling' : '→ Steady'} flow
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
  )
}

function NoLocation() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
      <p className="text-slate-500 font-medium mb-1">No default location set</p>
      <p className="text-slate-400 text-sm">Add your location in <a href="/settings" className="text-sky-500 underline">Settings → Profile</a> to enable weather and outlook.</p>
    </div>
  )
}

// ── Main exported component ────────────────────────────────────────────────────

const TABS = ['Flows', 'Weather', 'Trip Outlook'] as const
type TabName = typeof TABS[number]

export function ConditionsTabs({
  gaugeCards,
  siteNos,
  weather,
  outlook,
}: {
  gaugeCards: GaugeData[]
  siteNos: string[]
  weather: WeatherPayload | null
  outlook: OutlookPayload | null
}) {
  const [tab, setTab] = useState<TabName>('Flows')

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Flows'        && <FlowsTab gaugeCards={gaugeCards} siteNos={siteNos} />}
      {tab === 'Weather'      && <WeatherTab weather={weather} loading={false} />}
      {tab === 'Trip Outlook' && <TripOutlookTab outlook={outlook} loading={false} />}
    </div>
  )
}
