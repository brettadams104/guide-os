'use client'

import { useState, useRef, useEffect } from 'react'
import { saveGuideLocation } from '@/lib/actions/guide-location'

interface GeoResult {
  id: number
  name: string
  admin1: string | null
  country: string
  latitude: number
  longitude: number
}

export function LocationPicker({ currentLocation }: { currentLocation: string | null }) {
  const [query,    setQuery]    = useState(currentLocation ?? '')
  const [results,  setResults]  = useState<GeoResult[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    setSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setResults([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=8&language=en&format=json`)
        const data = await res.json()
        setResults(data.results ?? [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  async function handleSelect(r: GeoResult) {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setQuery(label)
    setOpen(false)
    setResults([])
    await saveGuideLocation({ name: label, lat: r.latitude, lon: r.longitude })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search city or town…"
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {saved && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.map(r => {
            const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-sky-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <span className="font-medium text-slate-900">{r.name}</span>
                {(r.admin1 || r.country) && (
                  <span className="text-slate-400 ml-1">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {saved && (
        <p className="text-xs text-emerald-600 font-medium mt-1.5">Location saved — weather will use this for forecasts.</p>
      )}
    </div>
  )
}
