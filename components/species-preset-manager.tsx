'use client'

import { useState } from 'react'
import { addSpeciesPreset, removeSpeciesPreset } from '@/lib/actions/trip-mode'

export function SpeciesPresetManager({ presets }: { presets: string[] }) {
  const [list, setList] = useState<string[]>(presets)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const val = input.trim()
    if (!val || list.some(s => s.toLowerCase() === val.toLowerCase())) return
    setAdding(true)
    await addSpeciesPreset(val)
    setList(prev => [...prev, val])
    setInput('')
    setAdding(false)
  }

  async function handleRemove(species: string) {
    await removeSpeciesPreset(species)
    setList(prev => prev.filter(s => s !== species))
  }

  return (
    <div className="space-y-3">
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.map(s => (
            <span key={s} className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-800 text-sm font-medium px-3 py-1.5 rounded-full">
              {s}
              <button
                type="button"
                onClick={() => handleRemove(s)}
                className="text-sky-400 hover:text-red-400 transition-colors leading-none"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No species added yet. Add the fish you commonly catch.</p>
      )}

      <div className="flex gap-3 pt-1">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="e.g. Largemouth Bass"
          className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !input.trim()}
          className="border border-sky-300 text-sky-600 hover:bg-sky-50 font-medium px-4 py-2 rounded-xl transition-colors text-sm whitespace-nowrap disabled:opacity-50"
        >
          + Add
        </button>
      </div>
    </div>
  )
}
