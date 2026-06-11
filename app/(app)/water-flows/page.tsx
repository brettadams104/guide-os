import { createClient } from '@/lib/supabase/server'
import type { GaugeData } from './gauge-card'
import { getMoonPhase, getMoonIllumination, getPressureTrend } from '@/lib/weather'
import { ConditionsTabs, type WeatherPayload, type OutlookPayload } from './conditions-tabs'
import { safeToday, safeDateOffset, fmtApiTime } from '@/lib/date-utils'

interface USGSValue { value: string; dateTime: string }
interface USGSTimeSeries {
  sourceInfo: { siteName: string; siteCode: { value: string }[] }
  variable: { variableCode: { value: string }[]; noDataValue: number }
  values: { value: USGSValue[] }[]
}

function parseUSGS(timeSeries: USGSTimeSeries[]): Record<string, Omit<GaugeData, 'gaugeId' | 'siteNo' | 'displayName'>> {
  const result: Record<string, Omit<GaugeData, 'gaugeId' | 'siteNo' | 'displayName'>> = {}
  for (const ts of timeSeries) {
    const siteNo = ts.sourceInfo?.siteCode?.[0]?.value
    const siteName = ts.sourceInfo?.siteName ?? ''
    const paramCode = ts.variable?.variableCode?.[0]?.value
    const noDataVal = ts.variable?.noDataValue ?? -999999
    const rawValues: USGSValue[] = ts.values?.[0]?.value ?? []
    if (!siteNo) continue
    if (!result[siteNo]) result[siteNo] = { siteName, cfs: null, gageHeight: null, lastUpdated: null, trend: null, history: [] }
    const valid = rawValues.filter(v => parseFloat(v.value) !== noDataVal && parseFloat(v.value) >= 0)
    if (paramCode === '00060') {
      const latest = valid[valid.length - 1]
      result[siteNo].cfs = latest ? parseFloat(latest.value) : null
      result[siteNo].lastUpdated = latest?.dateTime ?? null
      const sixHoursAgo = valid[Math.max(0, valid.length - 7)]
      if (latest && sixHoursAgo && latest !== sixHoursAgo) {
        const diff = parseFloat(latest.value) - parseFloat(sixHoursAgo.value)
        const pct = Math.abs(diff) / parseFloat(sixHoursAgo.value)
        result[siteNo].trend = pct < 0.05 ? 'steady' : diff > 0 ? 'rising' : 'falling'
      }
      const step = Math.max(1, Math.floor(valid.length / 24))
      result[siteNo].history = valid.filter((_, i) => i % step === 0).map(v => ({
        label: new Date(v.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cfs: parseFloat(v.value),
      }))
    } else if (paramCode === '00065') {
      const latest = valid[valid.length - 1]
      result[siteNo].gageHeight = latest ? parseFloat(latest.value) : null
    }
  }
  return result
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 55) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Thunderstorm'
}

async function geocodeLocation(location: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, { next: { revalidate: 86400 } })
    const data = await res.json()
    const r = data.results?.[0]
    if (!r) return null
    return { lat: r.latitude, lon: r.longitude, name: `${r.name}, ${r.admin1 ?? r.country}` }
  } catch { return null }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherPayload | null> {
  try {
    const today = safeToday()
    const sevenDays = safeDateOffset(6)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,windspeed_10m,winddirection_10m,surface_pressure,weathercode,is_day&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m,winddirection_10m,surface_pressure,precipitation,cloudcover&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_sum,surface_pressure_mean,sunrise,sunset&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto&start_date=${today}&end_date=${sevenDays}`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export default async function WaterFlowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: guide }, { data: gauges }, { data: weatherLocations }] = await Promise.all([
    supabase.from('guides').select('location, location_lat, location_lon').eq('id', user!.id).single(),
    supabase.from('guide_water_gauges').select('*').eq('guide_id', user!.id).order('created_at'),
    supabase.from('guide_weather_locations').select('*').eq('guide_id', user!.id).order('created_at'),
  ])

  const savedGauges = gauges ?? []
  const siteNos = savedGauges.map(g => g.site_no)

  // Fetch USGS flow data
  let usgsData: Record<string, Omit<GaugeData, 'gaugeId' | 'siteNo' | 'displayName'>> = {}
  if (siteNos.length > 0) {
    try {
      const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteNos.join(',')}&parameterCd=00060,00065&period=P7D&siteStatus=all`
      const res = await fetch(url, { next: { revalidate: 300 } })
      const data = await res.json()
      usgsData = parseUSGS(data.value?.timeSeries ?? [])
    } catch {}
  }

  const gaugeCards: GaugeData[] = savedGauges.map(g => ({
    gaugeId: g.id,
    siteNo: g.site_no,
    displayName: g.display_name,
    ...(usgsData[g.site_no] ?? { siteName: '', cfs: null, gageHeight: null, lastUpdated: null, trend: null, history: [] }),
  }))

  // Use stored lat/lon if available, otherwise fall back to geocoding the location string
  let weather: WeatherPayload | null = null
  let outlook: OutlookPayload | null = null

  const storedLat = (guide as any)?.location_lat as number | null
  const storedLon = (guide as any)?.location_lon as number | null

  if (guide?.location) {
    const geo = (storedLat && storedLon)
      ? { lat: storedLat, lon: storedLon, name: guide.location }
      : await geocodeLocation(guide.location)

    if (geo) {
      const raw = await fetchWeather(geo.lat, geo.lon)
      if (raw) {
        weather = { ...raw, location: geo.name }

        // Build outlook extras
        const now = new Date()
        const moonPhase = getMoonPhase(now)
        const moonIllumination = getMoonIllumination(now)

        const sunrise = fmtApiTime(raw.daily?.sunrise?.[0] ?? '')
        const sunset  = fmtApiTime(raw.daily?.sunset?.[0] ?? '')

        // Yesterday's weather
        const yesterday = safeDateOffset(-1)
        let yesterdayHigh: number | null = null
        let yesterdayLow: number | null = null
        let yesterdayWeather: string | null = null
        let pressureTrend: 'rising' | 'steady' | 'falling' = 'steady'
        try {
          const yUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,surface_pressure_mean&temperature_unit=fahrenheit&timezone=auto&start_date=${yesterday}&end_date=${yesterday}`
          const yRes = await fetch(yUrl, { next: { revalidate: 3600 } })
          if (yRes.ok) {
            const yData = await yRes.json()
            yesterdayHigh = Math.round(yData.daily?.temperature_2m_max?.[0] ?? 0)
            yesterdayLow = Math.round(yData.daily?.temperature_2m_min?.[0] ?? 0)
            yesterdayWeather = weatherCodeToLabel(yData.daily?.weathercode?.[0] ?? 0)
            const yPressure = yData.daily?.surface_pressure_mean?.[0]
            const todayPressure = raw.daily?.surface_pressure_mean?.[0]
            if (yPressure && todayPressure) {
              pressureTrend = getPressureTrend(todayPressure, yPressure)
            }
          }
        } catch {}

        outlook = {
          ...weather,
          moonPhase,
          moonIllumination,
          sunrise,
          sunset,
          yesterdayHigh,
          yesterdayLow,
          yesterdayWeather,
          pressureTrend,
          primaryGauge: gaugeCards[0] ?? null,
        }
      }
    }
  }

  return (
    <div data-tour="water-flows-content" className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conditions</h1>
      </div>
      <ConditionsTabs gaugeCards={gaugeCards} siteNos={siteNos} weather={weather} outlook={outlook} savedWeatherLocations={weatherLocations ?? []} />
      <p className="text-xs text-slate-400 text-center">
        River data: <a href="https://waterservices.usgs.gov" target="_blank" rel="noopener noreferrer" className="underline">USGS</a> · Weather: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a>
      </p>
    </div>
  )
}
