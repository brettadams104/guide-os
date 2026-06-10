'use client'

import { useState, useRef, useCallback } from 'react'
import { saveGuideLocation } from '@/lib/actions/guide-location'
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

// ── Location switcher ─────────────────────────────────────────────────────────

interface GeoResult { id: number; name: string; admin1: string | null; country: string; latitude: number; longitude: number }

function LocationSwitcher({ currentLocation, onLocationChange }: {
  currentLocation: string
  onLocationChange: (weather: WeatherPayload, outlook: OutlookPayload | null, name: string, lat: number, lon: number) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [query,   setQuery]     = useState('')
  const [results, setResults]   = useState<GeoResult[]>([])
  const [fetching, setFetching] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [pendingGeo, setPendingGeo] = useState<{ name: string; lat: number; lon: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=6&language=en&format=json`)
        const data = await res.json()
        setResults(data.results ?? [])
      } catch { setResults([]) }
    }, 300)
  }

  async function handleSelect(r: GeoResult) {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setResults([])
    setEditing(false)
    setQuery('')
    setFetching(true)
    setPendingGeo({ name, lat: r.latitude, lon: r.longitude })
    try {
      const today = new Date().toISOString().split('T')[0]
      const end   = new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]
      const url   = `https://api.open-meteo.com/v1/forecast?latitude=${r.latitude}&longitude=${r.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,windspeed_10m,winddirection_10m,surface_pressure,weathercode,is_day&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_sum,surface_pressure_mean&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto&start_date=${today}&end_date=${end}`
      const res   = await fetch(url)
      const data  = await res.json()
      const w: WeatherPayload = { ...data, location: name }
      onLocationChange(w, null, name, r.latitude, r.longitude)
    } catch {}
    finally { setFetching(false) }
  }

  async function handleSaveDefault() {
    if (!pendingGeo) return
    setSaving(true)
    await saveGuideLocation({ name: pendingGeo.name, lat: pendingGeo.lat, lon: pendingGeo.lon })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-2">
      {!editing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {fetching
              ? <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            }
            <p className="text-slate-500 text-sm">{pendingGeo?.name ?? currentLocation}</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-sky-500 hover:text-sky-400 font-medium transition-colors">
            Change location
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search city or town…"
            className="w-full border border-sky-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button onClick={() => { setEditing(false); setQuery(''); setResults([]) }} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          {results.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {results.map(r => {
                const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
                return (
                  <button key={r.id} type="button" onClick={() => handleSelect(r)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 border-b border-slate-100 last:border-0 transition-colors">
                    <span className="font-medium text-slate-900">{r.name}</span>
                    {(r.admin1 || r.country) && <span className="text-slate-400 ml-1">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
      {pendingGeo && !editing && (
        <div className="flex items-center gap-2">
          {saved
            ? <p className="text-xs text-emerald-600 font-medium">✓ Saved as default location</p>
            : <button onClick={handleSaveDefault} disabled={saving} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                {saving ? 'Saving…' : 'Save as default location'}
              </button>
          }
        </div>
      )}
    </div>
  )
}

// ── Tab: Weather ───────────────────────────────────────────────────────────────

function WeatherTab({ weather: initialWeather, outlook: initialOutlook, loading }: { weather: WeatherPayload | null; outlook: OutlookPayload | null; loading: boolean }) {
  const [weather, setWeather]   = useState(initialWeather)
  const [outlook, setOutlook]   = useState(initialOutlook)

  const handleLocationChange = useCallback((w: WeatherPayload, o: OutlookPayload | null) => {
    setWeather(w)
    setOutlook(o)
  }, [])

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
      <LocationSwitcher
        currentLocation={weather.location}
        onLocationChange={(w, o, _name, _lat, _lon) => handleLocationChange(w, o)}
      />

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
            <div key={d} className="flex items-center px-4 py-3 gap-3">
              <p className="text-sm font-medium text-slate-700 w-24 shrink-0">{dayLabel}</p>
              <span className="text-lg shrink-0">{weatherIcon(daily.weathercode[i] ?? 0)}</span>
              <p className="text-xs text-slate-500 flex-1">{weatherLabel(daily.weathercode[i] ?? 0)}</p>
              <p className="text-xs text-sky-500 font-medium w-14 text-right shrink-0">
                {(daily.precipitation_sum[i] ?? 0) >= 0.05 ? `${daily.precipitation_sum[i].toFixed(2)}"` : ''}
              </p>
              <div className="flex items-center gap-2 text-sm shrink-0">
                <span className="font-bold text-slate-800 w-8 text-right">{Math.round(daily.temperature_2m_max[i] ?? 0)}°</span>
                <span className="text-slate-400 w-8 text-right">{Math.round(daily.temperature_2m_min[i] ?? 0)}°</span>
              </div>
            </div>
          )
        })}
      </div>
      {/* Outlook sections appended below forecast */}
      {outlook && <OutlookSections outlook={outlook} />}
    </div>
  )
}

// ── Outlook sections (merged into Weather tab) ─────────────────────────────────

function OutlookSections({ outlook }: { outlook: OutlookPayload }) {
  const { current, moonPhase, moonIllumination, sunrise, sunset, pressureTrend, primaryGauge } = outlook

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

      {/* Sunrise / Sunset */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Sunrise & Sunset</p>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Sunrise</p>
            <p className="font-bold text-slate-800">{sunrise}</p>
          </div>
          <div className="text-slate-200 text-lg">→</div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Sunset</p>
            <p className="font-bold text-slate-800">{sunset}</p>
          </div>
        </div>
      </div>

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

const TABS = ['Weather', 'Flows'] as const
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
  const [tab, setTab] = useState<TabName>('Weather')

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

      {tab === 'Flows'   && <FlowsTab gaugeCards={gaugeCards} siteNos={siteNos} />}
      {tab === 'Weather' && <WeatherTab weather={weather} outlook={outlook} loading={false} />}
    </div>
  )
}
