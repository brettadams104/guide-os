'use client'

import { useState } from 'react'
import { addWaterGauge } from '@/lib/actions/water-gauges'

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
]

interface Site { siteNo: string; name: string }

export function GaugeSearch({ existingSiteNos }: { existingSiteNos: string[] }) {
  const [mode, setMode] = useState<'state' | 'siteNo'>('state')
  const [state, setState] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [siteNoInput, setSiteNoInput] = useState('')
  const [results, setResults] = useState<Site[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [customName, setCustomName] = useState<Record<string, string>>({})
  const [added, setAdded] = useState<Set<string>>(new Set(existingSiteNos))

  async function handleSearch() {
    setSearching(true)
    setResults([])
    setError(null)
    try {
      const params = new URLSearchParams()
      if (mode === 'siteNo') params.set('siteNo', siteNoInput)
      else { params.set('state', state); params.set('name', nameFilter) }
      const res = await fetch(`/api/usgs/search?${params}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      if (data.length === 0) setError('No gauges found. Try a different state or name.')
      setResults(data)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(site: Site) {
    const name = customName[site.siteNo] || toTitleCase(site.name)
    setAdding(site.siteNo)
    await addWaterGauge(site.siteNo, name)
    setAdded(prev => new Set([...prev, site.siteNo]))
    setAdding(null)
  }

  function toTitleCase(str: string) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <h2 className="font-bold text-slate-900">Add a River</h2>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['state', 'siteNo'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResults([]); setError(null) }}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
              mode === m ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
            {m === 'state' ? 'Search by Name' : 'Site Number'}
          </button>
        ))}
      </div>

      {mode === 'state' ? (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <select value={state} onChange={e => setState(e.target.value)}
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Select state…</option>
              {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <input type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && state && handleSearch()}
              placeholder="Filter by name…"
              className="flex-1 min-w-32 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <button onClick={handleSearch} disabled={!state || searching}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input type="text" value={siteNoInput} onChange={e => setSiteNoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && siteNoInput && handleSearch()}
            placeholder="USGS site number (e.g. 05427718)"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <button onClick={handleSearch} disabled={!siteNoInput || searching}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
            {searching ? 'Looking up…' : 'Look Up'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {results.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {results.map(site => (
            <li key={site.siteNo} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {toTitleCase(site.name)}
                  </p>
                  <p className="text-xs text-slate-400">Site #{site.siteNo}</p>
                </div>
                {added.has(site.siteNo) ? (
                  <span className="shrink-0 text-xs text-green-500 font-semibold pt-0.5">Added ✓</span>
                ) : (
                  <button onClick={() => handleAdd(site)} disabled={adding === site.siteNo}
                    className="shrink-0 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    {adding === site.siteNo ? '…' : '+ Add'}
                  </button>
                )}
              </div>
              {!added.has(site.siteNo) && (
                <input type="text" value={customName[site.siteNo] ?? ''}
                  onChange={e => setCustomName(prev => ({ ...prev, [site.siteNo]: e.target.value }))}
                  placeholder={`Custom name (default: ${toTitleCase(site.name).split(',')[0]})`}
                  className="w-full border border-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 text-slate-600" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
