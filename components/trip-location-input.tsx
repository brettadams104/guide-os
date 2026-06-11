'use client'

import { useState, useRef, useEffect } from 'react'

const STORAGE_KEY = 'gs_trip_locations'
const MAX_SAVED   = 10

function getSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export function saveLocation(location: string) {
  if (!location.trim()) return
  const existing = getSaved().filter(l => l.toLowerCase() !== location.toLowerCase())
  localStorage.setItem(STORAGE_KEY, JSON.stringify([location, ...existing].slice(0, MAX_SAVED)))
}

export function TripLocationInput({ defaultValue, name, className }: {
  defaultValue?: string
  name: string
  className?: string
}) {
  const [value,     setValue]     = useState(defaultValue ?? '')
  const [open,      setOpen]      = useState(false)
  const [saved,     setSaved]     = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSaved(getSaved())
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const suggestions = value.trim().length > 0
    ? saved.filter(l => l.toLowerCase().includes(value.toLowerCase()) && l.toLowerCase() !== value.toLowerCase())
    : saved

  return (
    <div ref={containerRef} className="relative">
      <input
        name={name}
        type="text"
        value={value}
        onChange={e => { setValue(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Hayward, WI"
        className={className ?? 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(loc => (
            <button
              key={loc}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setValue(loc); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 border-b border-slate-100 last:border-0 transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
