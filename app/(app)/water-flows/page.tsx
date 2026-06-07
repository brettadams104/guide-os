import { createClient } from '@/lib/supabase/server'
import { GaugeCard, type GaugeData } from './gauge-card'
import { GaugeSearch } from './gauge-search'

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

      // Trend: compare latest to reading ~6h ago
      const sixHoursAgo = valid[Math.max(0, valid.length - 7)]
      if (latest && sixHoursAgo && latest !== sixHoursAgo) {
        const diff = parseFloat(latest.value) - parseFloat(sixHoursAgo.value)
        const pct = Math.abs(diff) / parseFloat(sixHoursAgo.value)
        result[siteNo].trend = pct < 0.05 ? 'steady' : diff > 0 ? 'rising' : 'falling'
      }

      // Downsample to ~24 points for the sparkline
      const step = Math.max(1, Math.floor(valid.length / 24))
      result[siteNo].history = valid
        .filter((_, i) => i % step === 0)
        .map(v => ({
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

export default async function WaterFlowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gauges } = await supabase
    .from('guide_water_gauges')
    .select('*')
    .eq('guide_id', user!.id)
    .order('created_at')

  const savedGauges = gauges ?? []
  const siteNos = savedGauges.map(g => g.site_no)

  // Fetch 7-day flow data from USGS for all saved gauges in one call
  let usgsData: Record<string, Omit<GaugeData, 'gaugeId' | 'siteNo' | 'displayName'>> = {}
  if (siteNos.length > 0) {
    try {
      const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteNos.join(',')}&parameterCd=00060,00065&period=P7D&siteStatus=all`
      const res = await fetch(url, { next: { revalidate: 300 } })
      const data = await res.json()
      usgsData = parseUSGS(data.value?.timeSeries ?? [])
    } catch {
      // USGS unavailable — show saved gauges with no data
    }
  }

  const gaugeCards: GaugeData[] = savedGauges.map(g => ({
    gaugeId: g.id,
    siteNo: g.site_no,
    displayName: g.display_name,
    ...(usgsData[g.site_no] ?? { siteName: '', cfs: null, gageHeight: null, lastUpdated: null, trend: null, history: [] }),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Water Flows</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time river data from USGS</p>
        </div>
        <GaugeSearch existingSiteNos={siteNos} />
      </div>

      {gaugeCards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-4">
            <path d="M3 18c0-2 2-4 4-4s4 2 6 2 4-2 6-2" />
            <path d="M3 12c0-2 2-4 4-4s4 2 6 2 4-2 6-2" />
            <path d="M3 6c0-2 2-4 4-4s4 2 6 2 4-2 6-2" />
          </svg>
          <p className="text-slate-600 font-semibold">No rivers saved yet</p>
          <p className="text-slate-400 text-sm mt-1">Tap "Add River" to save the gauges you fish most.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {gaugeCards.map(gauge => (
            <GaugeCard key={gauge.siteNo} gauge={gauge} />
          ))}
        </div>
      )}

      <div className="text-xs text-slate-400 text-center">
        Data provided by the{' '}
        <a href="https://waterservices.usgs.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
          USGS National Water Information System
        </a>
        {' '}· Updates every 5 minutes
      </div>
    </div>
  )
}
