'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTimeSlot, updateTimeSlot, deleteTimeSlot } from '@/lib/actions/trip-options'

interface Slot {
  id: string
  label: string
  start_time: string | null
  end_time: string | null
}

// Generate time options from 4am to 9pm in 30-min increments
const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts = [{ label: '—', value: '' }]
  for (let h = 4; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const value = `${hh}:${mm}`
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      const label = `${h12}:${mm} ${ampm}`
      opts.push({ label, value })
    }
  }
  return opts
})()

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
    >
      {TIME_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export function TimeSlotManager({ slots }: { slots: Slot[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(slot: Slot) {
    setEditingId(slot.id)
    setEditLabel(slot.label)
    // Normalize stored time to match dropdown values (HH:MM)
    setEditStart(normalizeTime(slot.start_time))
    setEditEnd(normalizeTime(slot.end_time))
    setError(null)
  }

  function normalizeTime(t: string | null): string {
    if (!t) return ''
    const parts = t.trim().split(':')
    if (parts.length < 2) return ''
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (isNaN(h) || isNaN(m)) return ''
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  async function handleUpdate(id: string) {
    if (!editLabel.trim()) { setError('Label is required'); return }
    setSaving(true)
    setError(null)
    try {
      const result = await updateTimeSlot(id, editLabel, editStart || null, editEnd || null)
      if (result?.error) { setError(result.error); return }
      setEditingId(null)
      router.refresh()
    } catch { setError('Could not save') } finally { setSaving(false) }
  }

  async function handleAdd() {
    if (!newLabel.trim()) { setError('Label is required'); return }
    setSaving(true)
    setError(null)
    try {
      await addTimeSlot(newLabel.trim(), newStart || null, newEnd || null)
      setNewLabel('')
      setNewStart('')
      setNewEnd('')
      router.refresh()
    } catch { setError('Could not save') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await deleteTimeSlot(id)
    router.refresh()
  }

  function displayTime(t: string | null) {
    const norm = normalizeTime(t)
    const found = TIME_OPTIONS.find(o => o.value === norm)
    return found?.label ?? t ?? ''
  }

  return (
    <div className="space-y-3">
      {slots.length > 0 && (
        <ul className="space-y-2">
          {slots.map(slot => (
            <li key={slot.id}>
              {editingId === slot.id ? (
                <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-2">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    placeholder="Label"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                      <TimeSelect value={editStart} onChange={setEditStart} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">End Time</label>
                      <TimeSelect value={editEnd} onChange={setEditEnd} />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(slot.id)} disabled={saving}
                      className="flex-1 bg-sky-500 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="flex-1 border text-xs font-medium py-2 rounded-lg hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{slot.label}</p>
                    {(slot.start_time || slot.end_time) && (
                      <p className="text-xs text-slate-400">
                        {displayTime(slot.start_time)}{slot.start_time && slot.end_time ? ' – ' : ''}{displayTime(slot.end_time)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(slot)} className="text-xs text-sky-500 hover:text-sky-600 font-medium">Edit</button>
                    <button onClick={() => handleDelete(slot.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-600">Add Time Slot</p>
        <input
          type="text"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder='e.g. "Half Day", "Full Day"'
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Start Time</label>
            <TimeSelect value={newStart} onChange={setNewStart} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">End Time</label>
            <TimeSelect value={newEnd} onChange={setNewEnd} />
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button onClick={handleAdd} disabled={saving}
          className="w-full border border-sky-300 text-sky-600 hover:bg-sky-50 font-medium py-2 rounded-xl transition-colors text-sm disabled:opacity-50">
          {saving ? 'Saving...' : '+ Add Time Slot'}
        </button>
      </div>
    </div>
  )
}
