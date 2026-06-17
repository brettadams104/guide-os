'use client'

import { useState, useRef, useCallback } from 'react'
import { saveGuideLocation } from '@/lib/actions/guide-location'
import { addWeatherLocation, deleteWeatherLocation } from '@/lib/actions/weather-locations'
import dynamic from 'next/dynamic'
import type { HourlyChartPoint } from '@/components/hourly-weather-chart'
const HourlyWeatherChart = dynamic(
  () => import('@/components/hourly-weather-chart').then(m => ({ default: m.HourlyWeatherChart })),
  { ssr: false }
)
import type { GaugeData } from './gauge-card'
import { GaugeSearch } from './gauge-search'
import { GaugeList } from './gauge-list'

// ── Types ──────────────────────────────────────────────────────────────────────

interface HourlyWeather {
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  weathercode: number[]
  windspeed_10m: number[]
  winddirection_10m: number[]
  pressure_msl: number[]
  precipitation: number[]
  cloudcover: number[]
}

interface DailyWeather {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  weathercode: number[]
  windspeed_10m_max: number[]
  precipitation_sum: number[]
  pressure_msl_mean: number[]
  sunrise?: string[]
  sunset?: string[]
}

export interface WeatherPayload {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    windspeed_10m: number
    winddirection_10m: number
    pressure_msl: number
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
  primaryGauge: { gaugeId: string; siteNo: string; displayName: string } | null
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

function FlowsTab({ gaugeCards, siteNos }: { gaugeCards: { gaugeId: string; siteNo: string; displayName: string }[]; siteNos: string[] }) {
  return (
    <div className="space-y-4">
      <GaugeSearch existingSiteNos={siteNos} />
      <GaugeList gauges={gaugeCards} />

      <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5 pt-2">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Real-time USGS river gauge data
      </p>
    </div>
  )
}

// ── Location switcher ─────────────────────────────────────────────────────────

interface GeoResult { id: number; name: string; admin1: string | null; country: string; latitude: number; longitude: number }

export interface SavedWeatherLocation { id: string; name: string; lat: number; lon: number }

function localDateStr(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchWeatherForLocation(lat: number, lon: number, name: string): Promise<WeatherPayload | null> {
  try {
    const today = localDateStr()
    const end   = localDateStr(6)
    const url   = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,windspeed_10m,winddirection_10m,pressure_msl,weathercode,is_day&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m,winddirection_10m,pressure_msl,precipitation,cloudcover&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_sum,pressure_msl_mean,sunrise,sunset&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto&start_date=${today}&end_date=${end}`
    const res   = await fetch(url)
    const data  = await res.json()
    return { ...data, location: name }
  } catch { return null }
}

function LocationSwitcher({ currentLocation, savedLocations, onLocationChange }: {
  currentLocation: string
  savedLocations: SavedWeatherLocation[]
  onLocationChange: (weather: WeatherPayload, name: string, lat: number, lon: number) => void
}) {
  const [editing,    setEditing]    = useState(false)
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<GeoResult[]>([])
  const [fetching,   setFetching]   = useState(false)
  const [activeId,   setActiveId]   = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [pendingGeo, setPendingGeo] = useState<{ name: string; lat: number; lon: number } | null>(null)
  const [localSaved, setLocalSaved] = useState<SavedWeatherLocation[]>(savedLocations)
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

  async function loadLocation(lat: number, lon: number, name: string, id?: string) {
    setFetching(true)
    setActiveId(id ?? null)
    setEditing(false)
    setQuery('')
    setResults([])
    const w = await fetchWeatherForLocation(lat, lon, name)
    if (w) {
      onLocationChange(w, name, lat, lon)
      setPendingGeo({ name, lat, lon })
    }
    setFetching(false)
  }

  async function handleSearchSelect(r: GeoResult) {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    await loadLocation(r.latitude, r.longitude, name)
  }

  async function handleSaveLocation() {
    if (!pendingGeo) return
    setSaving(true)
    await addWeatherLocation({ name: pendingGeo.name, lat: pendingGeo.lat, lon: pendingGeo.lon })
    setLocalSaved(prev => [...prev, { id: Date.now().toString(), ...pendingGeo }])
    setSaving(false)
    setPendingGeo(null)
  }

  async function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await deleteWeatherLocation(id)
    setLocalSaved(prev => prev.filter(l => l.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const isAlreadySaved = pendingGeo && localSaved.some(l => l.name === pendingGeo.name)

  return (
    <div className="space-y-3">
      {/* Current location row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {fetching
            ? <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          }
          <p className="text-slate-500 text-sm truncate">{pendingGeo?.name ?? currentLocation}</p>
        </div>
        <button onClick={() => setEditing(e => !e)} className="text-xs text-sky-500 hover:text-sky-400 font-medium shrink-0 ml-2 transition-colors">
          {editing ? 'Cancel' : 'Change'}
        </button>
      </div>

      {/* Search box */}
      {editing && (
        <div className="relative">
          <input autoFocus type="text" value={query} onChange={e => handleInput(e.target.value)}
            placeholder="Search city or town…"
            className="w-full border border-sky-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          {results.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {results.map(r => (
                <button key={r.id} type="button" onClick={() => handleSearchSelect(r)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 border-b border-slate-100 last:border-0 transition-colors">
                  <span className="font-medium text-slate-900">{r.name}</span>
                  {(r.admin1 || r.country) && <span className="text-slate-400 ml-1">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save current location link */}
      {pendingGeo && !editing && !isAlreadySaved && (
        <button onClick={handleSaveLocation} disabled={saving}
          className="flex items-center gap-1.5 text-xs text-sky-500 hover:text-sky-400 font-medium transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {saving ? 'Saving…' : 'Save this location'}
        </button>
      )}

      {/* Saved locations chips */}
      {localSaved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {localSaved.map(loc => (
            <button
              key={loc.id}
              onClick={() => loadLocation(loc.lat, loc.lon, loc.name, loc.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeId === loc.id
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {loc.name.split(',')[0]}
              <span
                onClick={e => handleRemove(loc.id, e)}
                className={`ml-0.5 transition-colors ${activeId === loc.id ? 'text-white/70 hover:text-white' : 'text-slate-300 hover:text-red-400'}`}
              >×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Chart data builder ─────────────────────────────────────────────────────────

function buildChartData(hourly: HourlyWeather, nowHour: number): HourlyChartPoint[] {
  const fmt = (h: number) => { const a = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}${a}` }
  // API uses start_date=today so indices 0-23 are always today's 24 hours
  return hourly.time.slice(0, 24).map((t, i) => {
    const hour = parseInt(t.split('T')[1]?.split(':')[0] ?? '0', 10)
    return {
      label:         hour === nowHour ? 'Now' : fmt(hour),
      isNow:         hour === nowHour,
      temp:          Math.round(hourly.temperature_2m[i] ?? 0),
      windSpeed:     Math.round(hourly.windspeed_10m[i] ?? 0),
      windDir:       Math.round((hourly as any).winddirection_10m?.[i] ?? 0),
      pressure:      (hourly as any).pressure_msl?.[i] ?? 1013,
      precipitation: parseFloat(((hourly as any).precipitation?.[i] ?? 0).toFixed(2)),
      cloudCover:    Math.round((hourly as any).cloudcover?.[i] ?? 0),
    }
  })
}

// ── Tab: Weather ───────────────────────────────────────────────────────────────

function WeatherTab({ weather: initialWeather, outlook: initialOutlook, savedLocations, loading }: { weather: WeatherPayload | null; outlook: OutlookPayload | null; savedLocations: SavedWeatherLocation[]; loading: boolean }) {
  const [weather, setWeather] = useState(initialWeather)
  const [outlook, setOutlook] = useState(initialOutlook)

  const handleLocationChange = useCallback((w: WeatherPayload) => {
    setWeather(w)
    setOutlook(null)
  }, [])

  if (loading) return <LoadingSpinner label="Fetching weather…" />
  if (!weather) return <NoLocation />

  const { current, hourly, daily } = weather
  const now = new Date()
  const nowHour = now.getHours()
  const nowDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Parse directly from the string (e.g. "2026-06-10T14:00") to avoid timezone ambiguity
  let currentHourIdx = hourly.time.findIndex(t => {
    const [datePart, timePart] = t.split('T')
    const hour = parseInt(timePart?.split(':')[0] ?? '-1', 10)
    return datePart === nowDate && hour === nowHour
  })
  if (currentHourIdx === -1) currentHourIdx = 0

  const nextHours = hourly.time.slice(currentHourIdx, currentHourIdx + 12)
  const nextTemps = hourly.temperature_2m.slice(currentHourIdx, currentHourIdx + 12)
  const nextPrecip = hourly.precipitation_probability.slice(currentHourIdx, currentHourIdx + 12)
  const nextCodes = hourly.weathercode.slice(currentHourIdx, currentHourIdx + 12)

  return (
    <div className="space-y-4">
      <LocationSwitcher
        currentLocation={weather.location}
        savedLocations={savedLocations}
        onLocationChange={(w, _name, _lat, _lon) => handleLocationChange(w)}
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
            <p className="text-white font-bold">{pressureHpa(current.pressure_msl)}</p>
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
          const [yr, mo, dy] = d.split('-').map(Number)
          const dayNames  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
          const monNames  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          const dow       = new Date(Date.UTC(yr, mo - 1, dy)).getUTCDay()
          const dayLabel  = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${dayNames[dow]}, ${monNames[mo - 1]} ${dy}`
          return (
            <div key={d} className="flex items-center px-4 py-3 gap-2">
              <p className="text-sm font-medium text-slate-700 w-20 shrink-0">{dayLabel}</p>
              <span className="text-lg shrink-0">{weatherIcon(daily.weathercode[i] ?? 0)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 truncate">{weatherLabel(daily.weathercode[i] ?? 0)}</p>
                {(daily.precipitation_sum[i] ?? 0) >= 0.05 && (
                  <p className="text-xs text-sky-500 font-medium">{daily.precipitation_sum[i].toFixed(2)}"</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm shrink-0">
                <span className="font-bold text-slate-800">{Math.round(daily.temperature_2m_max[i] ?? 0)}°</span>
                <span className="text-slate-400">{Math.round(daily.temperature_2m_min[i] ?? 0)}°</span>
              </div>
            </div>
          )
        })}
      </div>
      {/* Outlook sections appended below forecast */}
      {outlook && <OutlookSections outlook={outlook} />}

      {/* Hourly detail chart */}
      <HourlyWeatherChart data={buildChartData(hourly, nowHour)} />
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
        <div className="mb-2">
          <p className="text-2xl font-black text-slate-800">{pressureHpa(current.pressure_msl)}</p>
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
  savedWeatherLocations,
}: {
  gaugeCards: { gaugeId: string; siteNo: string; displayName: string }[]
  siteNos: string[]
  weather: WeatherPayload | null
  outlook: OutlookPayload | null
  savedWeatherLocations: SavedWeatherLocation[]
}) {
  const [tab, setTab] = useState<TabName>('Weather')

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-tour-tab={t.toLowerCase()}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Flows'   && <FlowsTab gaugeCards={gaugeCards} siteNos={siteNos} />}
      {tab === 'Weather' && <WeatherTab weather={weather} outlook={outlook} savedLocations={savedWeatherLocations} loading={false} />}
    </div>
  )
}
