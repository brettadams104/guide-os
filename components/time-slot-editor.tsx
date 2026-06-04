'use client'

import { useState } from 'react'
import { updateTimeSlot } from '@/lib/actions/trip-options'

interface Props {
  id: string
  label: string
  startTime: string | null
  endTime: string | null
  onDelete: () => void
}

export function TimeSlotEditor({ id, label, startTime, endTime, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      await updateTimeSlot(
        id,
        form.get('label') as string,
        (form.get('start_time') as string) || null,
        (form.get('end_time') as string) || null,
      )
      setEditing(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <li className="bg-white border border-sky-200 rounded-xl p-3 space-y-3">
        <form onSubmit={handleSave} className="space-y-3">
          <input
            name="label"
            type="text"
            defaultValue={label}
            required
            placeholder="Label"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Time</label>
              <input name="start_time" type="time" defaultValue={startTime ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Time</label>
              <input name="end_time" type="time" defaultValue={endTime ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => { setEditing(false); setError(null) }} className="flex-1 border border-slate-200 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {(startTime || endTime) && (
          <p className="text-xs text-slate-400">{startTime}{startTime && endTime ? ' – ' : ''}{endTime}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setEditing(true)} className="text-xs text-sky-500 hover:text-sky-600 font-medium">Edit</button>
        <form action={onDelete as any}>
          <button type="submit" className="text-xs text-red-400 hover:text-red-600">Remove</button>
        </form>
      </div>
    </li>
  )
}
