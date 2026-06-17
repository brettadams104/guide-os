'use client'

import { useEffect, useState } from 'react'
import { GaugeCard, type GaugeData } from './gauge-card'

interface BaseGauge { gaugeId: string; siteNo: string; displayName: string }

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

export function GaugeList({ gauges }: { gauges: BaseGauge[] }) {
  const [usgsData, setUsgsData] = useState<Record<string, Omit<GaugeData, 'gaugeId' | 'siteNo' | 'displayName'>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (gauges.length === 0) { setLoading(false); return }
    const siteNos = gauges.map(g => g.siteNo).join(',')
    fetch(`https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteNos}&parameterCd=00060,00065&period=P7D&siteStatus=all`)
      .then(r => r.json())
      .then(data => setUsgsData(parseUSGS(data.value?.timeSeries ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gauges.map(g => g.siteNo).join(',')])

  if (gauges.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-4">
          <path d="M3 18c0-2 2-4 4-4s4 2 6 2 4-2 6-2" />
          <path d="M3 12c0-2 2-4 4-4s4 2 6 2 4-2 6-2" />
        </svg>
        <p className="text-slate-500 font-medium mb-1">No gauges saved yet</p>
        <p className="text-slate-400 text-sm">Search for a river or stream above to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm animate-pulse">Loading flow data…</p>
        </div>
      )}
      {gauges.map(g => (
        <GaugeCard
          key={g.gaugeId}
          gauge={{
            ...g,
            ...(usgsData[g.siteNo] ?? { siteName: '', cfs: null, gageHeight: null, lastUpdated: null, trend: null, history: [] }),
          }}
        />
      ))}
    </div>
  )
}
