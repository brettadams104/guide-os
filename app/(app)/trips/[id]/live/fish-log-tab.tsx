'use client'

import { useState, useRef } from 'react'
import { logCatch, deleteCatch } from '@/lib/actions/trip-mode'

interface Catch {
  id: string
  species: string
  count: number
  logged_at: string
}

interface Props {
  tripId: string
  initialCatches: Catch[]
  recentSpecies: string[]
}

export function FishLogTab({ tripId, initialCatches, recentSpecies }: Props) {
  const [catches, setCatches] = useState<Catch[]>(initialCatches)
  const [species, setSpecies] = useState('')
  const [count, setCount] = useState('1')
  const [saving, setSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const countRef = useRef<HTMLInputElement>(null)

  const suggestions = species.length > 0
    ? recentSpecies.filter(s => s.toLowerCase().includes(species.toLowerCase())).slice(0, 4)
    : []

  const totalFish = catches.reduce((s, c) => s + c.count, 0)

  async function handleLog() {
    if (!species.trim() || !count) return
    setSaving(true)
    const result = await logCatch(tripId, species.trim(), parseInt(count) || 1)
    if (!result.error && result.id) {
      setCatches(prev => [{
        id: result.id!,
        species: species.trim(),
        count: parseInt(count) || 1,
        logged_at: new Date().toISOString(),
      }, ...prev])
      setSpecies('')
      setCount('1')
      setShowSuggestions(false)
    }
    setSaving(false)
  }

  async function handleDelete(catchId: string) {
    await deleteCatch(catchId)
    setCatches(prev => prev.filter(c => c.id !== catchId))
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="bg-sky-500 rounded-2xl p-5 text-center">
        <p className="text-sky-100 text-xs uppercase tracking-widest font-semibold">Total Fish</p>
        <p className="text-5xl font-black text-white mt-1">{totalFish}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Log a Catch</p>
        <div className="relative">
          <input
            type="text"
            value={species}
            onChange={e => { setSpecies(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); countRef.current?.focus() } }}
            placeholder="Species (e.g. Largemouth Bass)"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {suggestions.map(s => (
                <button key={s} type="button" onClick={() => { setSpecies(s); setShowSuggestions(false); countRef.current?.focus() }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <input
            ref={countRef}
            type="number"
            min="1"
            value={count}
            onChange={e => setCount(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLog() }}
            className="w-24 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button onClick={handleLog} disabled={saving || !species.trim()}
            className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
            {saving ? '…' : '+ Log'}
          </button>
        </div>
      </div>

      {catches.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">Today's Catches</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {catches.map(c => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{c.species}</p>
                  <p className="text-xs text-slate-400">{new Date(c.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 text-lg">{c.count}</span>
                  <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-400 text-sm transition-colors">✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
