'use client'

import { useState, useEffect } from 'react'
import SunCalc from 'suncalc'

interface HourlyWeather {
  time: string
  temp: number
  weatherCode: number
  windSpeed: number
  pressure: number
}

function weatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

function fmt12(isoTime: string): string {
  const d = new Date(isoTime)
  const h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12} ${ampm}`
}

export function WeatherTab() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [manualLocation, setManualLocation] = useState('')
  const [weather, setWeather] = useState<HourlyWeather[]>([])
  const [moonPhase, setMoonPhase] = useState('')
  const [sunrise, setSunrise] = useState('')
  const [sunset, setSunset] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLoading(false)
      )
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!location) return
    fetchWeather(location.lat, location.lon)
  }, [location])

  async function fetchWeather(lat: number, lon: number) {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,windspeed_10m,surface_pressure&timezone=auto&start_date=${today}&end_date=${today}&temperature_unit=fahrenheit&windspeed_unit=mph`
      const res = await fetch(url)
      const data = await res.json()

      const hours: HourlyWeather[] = data.hourly.time.map((t: string, i: number) => ({
        time: t,
        temp: Math.round(data.hourly.temperature_2m[i]),
        weatherCode: data.hourly.weathercode[i],
        windSpeed: Math.round(data.hourly.windspeed_10m[i]),
        pressure: Math.round(data.hourly.surface_pressure[i]),
      }))
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

  async function handleManualSearch() {
    if (!manualLocation.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLocation)}&count=1`)
      const data = await res.json()
      if (data.results?.[0]) {
        const { latitude, longitude } = data.results[0]
        setLocation({ lat: latitude, lon: longitude })
      } else {
        setError('Location not found')
        setLoading(false)
      }
    } catch {
      setError('Could not find location')
      setLoading(false)
    }
  }

  const now = new Date()
  const currentHour = now.getHours()

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={manualLocation}
          onChange={e => setManualLocation(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleManualSearch() }}
          placeholder="Search location..."
          className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
        />
        <button onClick={handleManualSearch} className="bg-sky-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-400">
          Search
        </button>
      </div>

      {moonPhase && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex justify-between">
          <div className="text-center">
            <p className="text-xs text-slate-500">Moon</p>
            <p className="font-semibold text-sm mt-0.5">{moonPhase}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Sunrise</p>
            <p className="font-semibold text-sm mt-0.5">🌅 {sunrise}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Sunset</p>
            <p className="font-semibold text-sm mt-0.5">🌇 {sunset}</p>
          </div>
        </div>
      )}

      {loading && <p className="text-slate-400 text-sm text-center py-8">Loading weather...</p>}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {!loading && weather.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">Hourly Forecast</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {weather.map((h, i) => {
              const hourNum = new Date(h.time).getHours()
              const isCurrent = hourNum === currentHour
              return (
                <li key={i} className={`flex items-center justify-between px-4 py-3 ${isCurrent ? 'bg-sky-50' : ''}`}>
                  <span className={`text-sm font-medium w-14 ${isCurrent ? 'text-sky-600 font-bold' : 'text-slate-600'}`}>
                    {isCurrent ? 'Now' : fmt12(h.time)}
                  </span>
                  <span className="text-lg">{weatherIcon(h.weatherCode)}</span>
                  <span className="text-sm font-semibold text-slate-900 w-12 text-right">{h.temp}°F</span>
                  <span className="text-xs text-slate-500 w-16 text-right">💨 {h.windSpeed}mph</span>
                  <span className="text-xs text-slate-400 w-16 text-right">{h.pressure} hPa</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {!loading && !location && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">Enter a location above to see the forecast.</p>
        </div>
      )}
    </div>
  )
}
