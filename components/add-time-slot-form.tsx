'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTimeSlot } from '@/lib/actions/trip-options'

export function AddTimeSlotForm() {
  const [label, setLabel] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!label.trim()) { setError('Label is required'); return }
    setSaving(true)
    setError(null)
    try {
      await addTimeSlot(label.trim(), startTime || null, endTime || null)
      setLabel('')
      setStartTime('')
      setEndTime('')
      router.refresh()
    } catch {
      setError('Could not save — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
      <p className="text-xs font-medium text-slate-600">Add Time Slot</p>
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder='e.g. "Half Day", "Full Day"'
        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Start Time <span className="text-slate-300">(optional)</span></label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">End Time <span className="text-slate-300">(optional)</span></label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full border border-sky-300 text-sky-600 hover:bg-sky-50 font-medium py-2 rounded-xl transition-colors text-sm disabled:opacity-50"
      >
        {saving ? 'Saving...' : '+ Add Time Slot'}
      </button>
    </form>
  )
}
