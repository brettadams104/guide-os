import SunCalc from 'suncalc'
import type { PressureTrend } from './types'
import { fmtApiTime } from './date-utils'

export function getMoonPhase(date: Date): string {
  const illum = SunCalc.getMoonIllumination(date)
  const phase = illum.phase

  if (phase < 0.0625) return 'New Moon'
  if (phase < 0.1875) return 'Waxing Crescent'
  if (phase < 0.3125) return 'First Quarter'
  if (phase < 0.4375) return 'Waxing Gibbous'
  if (phase < 0.5625) return 'Full Moon'
  if (phase < 0.6875) return 'Waning Gibbous'
  if (phase < 0.8125) return 'Last Quarter'
  if (phase < 0.9375) return 'Waning Crescent'
  return 'New Moon'
}

export function getMoonIllumination(date: Date): number {
  return Math.round(SunCalc.getMoonIllumination(date).fraction * 100)
}

export function getPressureTrend(current: number, previous: number): PressureTrend {
  const diff = current - previous
  if (diff > 1) return 'rising'
  if (diff < -1) return 'falling'
  return 'steady'
}

export interface WeatherData {
  temp_high: number
  temp_low: number
  weather: string
  wind_speed: number
  wind_direction: string
  pressure: number
  pressure_trend: PressureTrend
  sunrise: string
  sunset: string
  moon_phase: string
  moon_illumination: number
}

function windDegToDir(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Thunderstorm'
}

export async function fetchWeatherForTrip(
  date: string,
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,winddirection_10m_dominant,surface_pressure_mean,sunrise,sunset&timezone=auto&start_date=${date}&end_date=${date}&temperature_unit=fahrenheit&windspeed_unit=mph`

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()

    const daily = data.daily
    const idx = 0

    const tripDate = new Date(date)
    const moonPhase = getMoonPhase(tripDate)
    const moonIllum = getMoonIllumination(tripDate)

    // Pressure trend: compare to yesterday
    const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0]
    const yesterdayUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=surface_pressure_mean&timezone=auto&start_date=${yesterday}&end_date=${date}&temperature_unit=fahrenheit`
    const yRes = await fetch(yesterdayUrl, { next: { revalidate: 3600 } })
    let pressureTrend: PressureTrend = 'steady'
    if (yRes.ok) {
      const yData = await yRes.json()
      if (yData.daily?.surface_pressure_mean?.length >= 2) {
        pressureTrend = getPressureTrend(
          yData.daily.surface_pressure_mean[1],
          yData.daily.surface_pressure_mean[0]
        )
      }
    }

    // Sunrise/sunset — read from API response (already in local timezone via timezone=auto)
    const sunrise = fmtApiTime(daily.sunrise?.[idx] ?? '')
    const sunset  = fmtApiTime(daily.sunset?.[idx] ?? '')

    return {
      temp_high: Math.round(daily.temperature_2m_max[idx]),
      temp_low: Math.round(daily.temperature_2m_min[idx]),
      weather: weatherCodeToLabel(daily.weathercode[idx]),
      wind_speed: Math.round(daily.windspeed_10m_max[idx]),
      wind_direction: windDegToDir(daily.winddirection_10m_dominant[idx]),
      pressure: Math.round(daily.surface_pressure_mean[idx] * 100) / 100,
      pressure_trend: pressureTrend,
      moon_phase: moonPhase,
      moon_illumination: moonIllum,
      sunrise,
      sunset,
    }
  } catch {
    return null
  }
}
