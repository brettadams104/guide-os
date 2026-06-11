'use client'

import { useState, useEffect, useRef } from 'react'
import SunCalc from 'suncalc'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ComposedChart } from 'recharts'

interface HourlyWeather {
  hour: number
  label: string
  temp: number
  weatherCode: number
  windSpeed: number
  windDir: number
  pressure: number     // hPa from API
  precipitation: number // inches
  cloudCover: number
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function fmt12(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}${ampm}`
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

// Arrows show where wind is blowing TO (windDir = FROM, so +180 = TO)
function WindArrowStrip({ data, chartWidth }: { data: HourlyWeather[]; chartWidth: number }) {
  const plotLeft = 86   // margin.left(44) + yAxis.width(42)
  const plotRight = chartWidth - 98  // chartWidth - margin.right(52) - rightAxis.width(46)
  const plotWidth = plotRight - plotLeft
  const n = data.length

  return (
    <svg width={chartWidth} height={48} style={{ display: 'block' }}>
      {data.map((h, i) => {
        const cx = plotLeft + (i + 0.5) * (plotWidth / n)
        const cy = 24
        const rotation = (h.windDir + 180) % 360
        const color = windArrowColor(h.windSpeed)
        return (
          <g key={i} transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
            <line x1="0" y1="8" x2="0" y2="-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="0,-9 -3.5,-2 3.5,-2" fill={color} />
          </g>
        )
      })}
    </svg>
  )
}

const CHART_WIDTH = 900

export function WeatherTab({ defaultLocation }: { defaultLocation?: string }) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [manualLocation, setManualLocation] = useState('')
  const [activeLocationLabel, setActiveLocationLabel] = useState('')
  const [weather, setWeather] = useState<HourlyWeather[]>([])
  const [moonPhase, setMoonPhase] = useState('')
  const [sunrise, setSunrise] = useState('')
  const [sunset, setSunset] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Track whether GPS has already provided a location so default doesn't overwrite it
  const gpsWonRef = useRef(false)

  const currentHour = new Date().getHours()
  const currentData = weather.find(w => w.hour === currentHour)

  async function geocodeLocation(name: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`)
      const data = await res.json()
      if (data.results?.[0]) {
        return { lat: data.results[0].latitude, lon: data.results[0].longitude }
      }
    } catch {}
    return null
  }

  useEffect(() => {
    // Fire default location and GPS in parallel — whoever responds first wins.
    // GPS overrides default if it comes in later (more accurate).

    // 1. Start default location geocoding immediately (no waiting)
    if (defaultLocation) {
      setManualLocation(defaultLocation)
      geocodeLocation(defaultLocation).then(coords => {
        if (coords && !gpsWonRef.current) {
          setLocation(coords)
          setActiveLocationLabel(defaultLocation)
        } else if (!coords && !gpsWonRef.current) {
          setLoading(false)
        }
      })
    }

    // 2. Try GPS in parallel — overrides default if it responds
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          gpsWonRef.current = true
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
          setActiveLocationLabel('Current Location')
        },
        () => {
          // GPS denied or failed — default location handles it
          if (!defaultLocation) setLoading(false)
        },
        { timeout: 8000, maximumAge: 300000 }
      )
    } else if (!defaultLocation) {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!location) return
    fetchWeather(location.lat, location.lon)
  }, [location])

  useEffect(() => {
    if (weather.length === 0 || !scrollRef.current) return
    const pxPerHour = CHART_WIDTH / 24
    scrollRef.current.scrollLeft = Math.max(0, (currentHour - 3) * pxPerHour)
  }, [weather, currentHour])

  async function fetchWeather(lat: number, lon: number) {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,windspeed_10m,winddirection_10m,surface_pressure,precipitation,cloudcover&timezone=auto&start_date=${today}&end_date=${today}&temperature_unit=fahrenheit&windspeed_unit=mph`
      const res = await fetch(url)
      const data = await res.json()

      const hours: HourlyWeather[] = data.hourly.time.map((t: string, i: number) => {
        const h = new Date(t).getHours()
        return {
          hour: h,
          label: h === currentHour ? 'Now' : fmt12(h),
          temp: Math.round(data.hourly.temperature_2m[i]),
          weatherCode: data.hourly.weathercode[i],
          windSpeed: Math.round(data.hourly.windspeed_10m[i]),
          windDir: Math.round(data.hourly.winddirection_10m[i]),
          pressure: data.hourly.surface_pressure[i],
          precipitation: parseFloat((data.hourly.precipitation[i] * 0.0394).toFixed(2)),
          cloudCover: Math.round(data.hourly.cloudcover[i]),
        }
      })
      setWeather(hours)

      const now = new Date()
      const illum = SunCalc.getMoonIllumination(now)
      const phase = illum.phase
      let phaseName = 'New Moon'
      if (phase < 0.0625) phaseName = 'New Moon'
      else if (phase < 0.1875) phaseName = 'Waxing Crescent'
      else if (phase < 0.3125) phaseName = 'First Quarter'
      else if (phase < 0.4375) phaseName = 'Waxing Gibbous'
      else if (phase < 0.5625) phaseName = 'Full Moon'
      else if (phase < 0.6875) phaseName = 'Waning Gibbous'
      else if (phase < 0.8125) phaseName = 'Last Quarter'
      else phaseName = 'Waning Crescent'
      setMoonPhase(phaseName)

      const sunTimes = SunCalc.getTimes(now, lat, lon)
      setSunrise(sunTimes.sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      setSunset(sunTimes.sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setError('Could not load weather')
    } finally {
      setLoading(false)
    }
  }

  const [geoResults, setGeoResults] = useState<{ id: number; name: string; admin1: string | null; country: string; latitude: number; longitude: number }[]>([])
  const [geoOpen, setGeoOpen] = useState(false)
  const geoDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setGeoOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLocationInput(val: string) {
    setManualLocation(val)
    if (geoDebounce.current) clearTimeout(geoDebounce.current)
    if (val.trim().length < 2) { setGeoResults([]); setGeoOpen(false); return }
    geoDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=6&language=en&format=json`)
        const data = await res.json()
        setGeoResults(data.results ?? [])
        setGeoOpen(true)
      } catch { setGeoResults([]) }
    }, 300)
  }

  function handleGeoSelect(r: { name: string; admin1: string | null; country: string; latitude: number; longitude: number }) {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setManualLocation(label)
    setActiveLocationLabel(label)
    setLocation({ lat: r.latitude, lon: r.longitude })
    setGeoResults([])
    setGeoOpen(false)
  }

  async function handleManualSearch() {
    const raw = manualLocation.trim()
    if (!raw) return
    setLoading(true)
    setError(null)

    try {
      if (/^\d{5}$/.test(raw)) {
        const res = await fetch(`https://api.zippopotam.us/us/${raw}`)
        if (res.ok) {
          const data = await res.json()
          const place = data.places?.[0]
          if (place) {
            const label = `${place['place name']}, ${place['state abbreviation']}`
            setLocation({ lat: parseFloat(place.latitude), lon: parseFloat(place.longitude) })
            setActiveLocationLabel(label)
            setManualLocation(label)
            return
          }
        }
        setError('Zip code not found')
        setLoading(false)
        return
      }

      const cityName = raw.includes(',') ? raw.split(',')[0].trim() : raw
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`)
      const data = await res.json()
      if (data.results?.[0]) {
        const { latitude, longitude, name, admin1, country_code } = data.results[0]
        setLocation({ lat: latitude, lon: longitude })
        setActiveLocationLabel([name, admin1, country_code].filter(Boolean).join(', '))
      } else {
        setError('Location not found')
        setLoading(false)
      }
    } catch {
      setError('Could not find location')
      setLoading(false)
    }
  }

  const pressureMin = weather.length ? Math.min(...weather.map(w => w.pressure)) - 1 : 1010
  const pressureMax = weather.length ? Math.max(...weather.map(w => w.pressure)) + 1 : 1016
  const avgHigh = weather.length ? Math.max(...weather.map(w => w.temp)) : 0

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Location search */}
      <div className="p-4" ref={searchRef}>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualLocation}
              onChange={e => handleLocationInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleManualSearch(); setGeoOpen(false) } }}
              placeholder="Search by city or zip code…"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
            {geoOpen && geoResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {geoResults.map(r => (
                  <button key={r.id} type="button" onClick={() => handleGeoSelect(r)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 border-b border-slate-100 last:border-0 transition-colors">
                    <span className="font-medium text-slate-900">{r.name}</span>
                    {(r.admin1 || r.country) && (
                      <span className="text-slate-400 ml-1">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { handleManualSearch(); setGeoOpen(false) }}
            className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            Search
          </button>
        </div>
        {activeLocationLabel && (
          <p className="text-xs text-slate-500 mt-1.5 px-0.5">
            Showing weather for <span className="text-slate-700 font-semibold">{activeLocationLabel}</span>
          </p>
        )}
      </div>

      {/* Moon + Sun — no emojis */}
      {moonPhase && (
        <div className="mx-4 mb-3 bg-white rounded-2xl border border-slate-200 p-4 flex justify-between">
          <div className="text-center">
            <p className="text-xs text-slate-500">Moon</p>
            <p className="font-semibold text-sm mt-0.5">{moonPhase}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Sunrise</p>
            <p className="font-semibold text-sm mt-0.5">{sunrise}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Sunset</p>
            <p className="font-semibold text-sm mt-0.5">{sunset}</p>
          </div>
        </div>
      )}

      {/* Chart key — always visible, not scrollable */}
      {weather.length > 0 && (
        <div className="mx-4 mb-3 bg-white rounded-2xl border border-slate-200 p-3.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Chart Key</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-5 h-px bg-green-500 block shrink-0 border-t-2 border-green-500" />
              <span>Barometric Pressure (inHg)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-px bg-orange-500 block shrink-0 border-t-2 border-orange-500" />
              <span>Temperature (°F)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 shrink-0 border-t-2 border-dashed border-blue-400 block" />
              <span>Wind Speed (mph)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-px h-4 bg-orange-500 block shrink-0 mx-2" />
              <span>Current Time (Now)</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <span className="flex gap-1 shrink-0">
                {['#cbd5e1', '#7dd3fc', '#3b82f6', '#1d4ed8'].map(c => (
                  <span key={c} className="w-3 h-3 rounded-full block" style={{ backgroundColor: c }} />
                ))}
              </span>
              <span>Wind arrows — direction wind is blowing. Light gray = calm, dark blue = strong</span>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-slate-400 text-sm text-center py-8">Loading weather...</p>}
      {error && <p className="text-red-500 text-sm text-center px-4">{error}</p>}

      {!loading && weather.length > 0 && (
        <div
          ref={scrollRef}
          className="overflow-x-auto border-t border-slate-200"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <div style={{ width: CHART_WIDTH, minWidth: CHART_WIDTH }}>

            {/* Pressure stats bar */}
            {currentData && (
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex gap-5 text-xs font-medium text-slate-500">
                <span>Bar: <span className="text-slate-800 font-bold">{hpaToInHg(currentData.pressure).toFixed(2)}&quot;</span></span>
                <span>Rain: <span className="text-slate-800 font-bold">{currentData.precipitation}&quot;</span></span>
                <span>Clouds: <span className="text-slate-800 font-bold">{currentData.cloudCover}%</span></span>
              </div>
            )}

            {/* Pressure chart */}
            <div className="bg-white pt-2">
              <LineChart width={CHART_WIDTH} height={110} data={weather} margin={{ top: 4, right: 12, bottom: 0, left: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  domain={[pressureMin, pressureMax]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => hpaToInHg(v).toFixed(2)}
                  width={42}
                />
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

            {/* Temperature + Wind combo chart */}
            <div className="bg-white pt-2">
              <ComposedChart width={CHART_WIDTH} height={130} data={weather} margin={{ top: 4, right: 52, bottom: 8, left: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  yAxisId="temp"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}°`}
                  width={42}
                />
                <YAxis
                  yAxisId="wind"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}mph`}
                  width={46}
                />
                <ReferenceLine yAxisId="temp" x="Now" stroke="#f97316" strokeWidth={2} />
                <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} activeDot={false} />
                <Line yAxisId="wind" type="monotone" dataKey="windSpeed" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={false} />
              </ComposedChart>
            </div>

            {/* Wind direction arrows */}
            <div className="bg-white border-t border-slate-100 pb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 pt-2 pb-1">Wind Direction</p>
              <WindArrowStrip data={weather} chartWidth={CHART_WIDTH} />
            </div>

          </div>
        </div>
      )}

      {!loading && !location && !error && (
        <div className="mx-4 bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">Enter a location above to see the forecast.</p>
        </div>
      )}
    </div>
  )
}
