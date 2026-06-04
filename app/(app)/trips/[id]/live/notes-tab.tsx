'use client'

import { useState, useEffect, useCallback } from 'react'
import { saveLiveNotes } from '@/lib/actions/trip-mode'

export function NotesTab({ tripId, initialNotes }: { tripId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(true)

  const save = useCallback(async (text: string) => {
    await saveLiveNotes(tripId, text)
    setSaved(true)
  }, [tripId])

  useEffect(() => {
    if (saved) return
    const timer = setTimeout(() => save(notes), 10000)
    return () => clearTimeout(timer)
  }, [notes, saved, save])

  return (
    <div className="flex-1 flex flex-col p-4 gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trip Notes</p>
        <p className={`text-xs ${saved ? 'text-green-500' : 'text-slate-400'}`}>
          {saved ? '✓ Saved' : 'Unsaved...'}
        </p>
      </div>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        onBlur={() => !saved && save(notes)}
        placeholder="Observations, conditions, memorable moments..."
        className="flex-1 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-white min-h-64"
      />
      <button onClick={() => save(notes)} className="w-full bg-slate-800 text-white font-semibold py-3 rounded-xl text-sm hover:bg-slate-700 transition-colors">
        Save Notes
      </button>
    </div>
  )
}
