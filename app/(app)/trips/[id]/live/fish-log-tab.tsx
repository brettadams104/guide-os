'use client'

import { useState, useRef } from 'react'
import { logCatch, deleteCatch, addSpeciesPreset, addLurePreset } from '@/lib/actions/trip-mode'

interface Catch {
  id: string
  species: string
  count: number
  logged_at: string
  size_inches?: number | null
  weight_lbs?: number | null
  caught_on?: string | null
}

interface Props {
  tripId: string
  initialCatches: Catch[]
  speciesPresets: string[]
  lurePresets: string[]
}

export function FishLogTab({ tripId, initialCatches, speciesPresets: initialSpecies, lurePresets: initialLures }: Props) {
  const [catches, setCatches] = useState<Catch[]>(initialCatches)
  const [speciesPresets, setSpeciesPresets] = useState<string[]>(initialSpecies)
  const [lurePresets, setLurePresets] = useState<string[]>(initialLures)

  const [species, setSpecies] = useState('')
  const [caughtOn, setCaughtOn] = useState('')
  const [count, setCount] = useState('1')
  const [sizeInches, setSizeInches] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [saving, setSaving] = useState(false)

  const countRef = useRef<HTMLInputElement>(null)
  const caughtOnRef = useRef<HTMLInputElement>(null)

  const totalFish = catches.reduce((s, c) => s + c.count, 0)

  async function handleLog() {
    if (!species.trim()) return
    setSaving(true)

    const opts = {
      sizeInches: sizeInches ? parseFloat(sizeInches) : undefined,
      weightLbs: weightLbs ? parseFloat(weightLbs) : undefined,
      caughtOn: caughtOn.trim() || undefined,
    }

    const result = await logCatch(tripId, species.trim(), parseInt(count) || 1, opts)

    if (!result.error && result.id) {
      setCatches(prev => [{
        id: result.id!,
        species: species.trim(),
        count: parseInt(count) || 1,
        logged_at: new Date().toISOString(),
        size_inches: opts.sizeInches ?? null,
        weight_lbs: opts.weightLbs ?? null,
        caught_on: opts.caughtOn ?? null,
      }, ...prev])

      // Auto-add to presets if new
      const s = species.trim()
      if (!speciesPresets.some(p => p.toLowerCase() === s.toLowerCase())) {
        addSpeciesPreset(s)
        setSpeciesPresets(prev => [...prev, s])
      }
      if (opts.caughtOn && !lurePresets.some(p => p.toLowerCase() === opts.caughtOn!.toLowerCase())) {
        addLurePreset(opts.caughtOn)
        setLurePresets(prev => [...prev, opts.caughtOn!])
      }

      setSpecies('')
      setCaughtOn('')
      setCount('1')
      setSizeInches('')
      setWeightLbs('')
    }
    setSaving(false)
  }

  async function handleDelete(catchId: string) {
    await deleteCatch(catchId)
    setCatches(prev => prev.filter(c => c.id !== catchId))
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Total */}
      <div className="bg-sky-500 rounded-2xl p-5 text-center">
        <p className="text-sky-100 text-xs uppercase tracking-widest font-semibold">Total Fish</p>
        <p className="text-5xl font-black text-white mt-1">{totalFish}</p>
      </div>

      {/* Log entry form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">

        {/* Species */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Species</p>
          {speciesPresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {speciesPresets.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSpecies(s); countRef.current?.focus() }}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    species === s
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={species}
            onChange={e => setSpecies(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') caughtOnRef.current?.focus() }}
            placeholder={speciesPresets.length > 0 ? 'Or type a different species…' : 'Species (e.g. Largemouth Bass)'}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Caught On */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Caught On</p>
          {lurePresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lurePresets.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setCaughtOn(s); countRef.current?.focus() }}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    caughtOn === s
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <input
            ref={caughtOnRef}
            type="text"
            value={caughtOn}
            onChange={e => setCaughtOn(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') countRef.current?.focus() }}
            placeholder={lurePresets.length > 0 ? 'Or type a lure / bait…' : 'Lure or bait (optional)'}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Count, Size, Weight */}
        <div className="pt-1 border-t border-slate-100 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Count</label>
              <input
                ref={countRef}
                type="number"
                min="1"
                value={count}
                onChange={e => setCount(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLog() }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Size (in) <span className="text-slate-300">optional</span></label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={sizeInches}
                onChange={e => setSizeInches(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLog() }}
                placeholder="—"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Weight (lb) <span className="text-slate-300">optional</span></label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={weightLbs}
                onChange={e => setWeightLbs(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLog() }}
                placeholder="—"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <button
            onClick={handleLog}
            disabled={saving || !species.trim()}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {saving ? 'Logging…' : '+ Log Catch'}
          </button>
        </div>
      </div>

      {/* Catch log */}
      {catches.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">Today's Catches</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {catches.map(c => (
              <li key={c.id} className="flex items-start justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{c.species}</p>
                  {c.caught_on && (
                    <p className="text-xs text-slate-500 mt-0.5">on {c.caught_on}</p>
                  )}
                  <div className="flex gap-3 mt-0.5">
                    {c.size_inches && (
                      <p className="text-xs text-slate-400">{c.size_inches}&quot;</p>
                    )}
                    {c.weight_lbs && (
                      <p className="text-xs text-slate-400">{c.weight_lbs} lb</p>
                    )}
                    <p className="text-xs text-slate-400">{new Date(c.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
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
