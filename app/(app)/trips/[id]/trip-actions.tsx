'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelTrip, rescheduleTrip, deleteTrip } from '@/lib/actions/trips'

export function TripActions({ tripId, currentStatus }: { tripId: string; currentStatus: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'reschedule' | 'delete' | 'cancel'>('idle')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setSaving(true)
    setError(null)
    try {
      const result = await cancelTrip(tripId)
      if (result.error) { setError(result.error); return }
      setMode('idle')
      router.refresh()
    } catch { setError('Something went wrong') } finally { setSaving(false) }
  }

  async function handleReschedule() {
    if (!newDate) { setError('Please select a new date'); return }
    setSaving(true)
    setError(null)
    try {
      const result = await rescheduleTrip(tripId, newDate)
      if (result.error) { setError(result.error); return }
      setMode('idle')
      router.refresh()
    } catch { setError('Something went wrong') } finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    setError(null)
    try {
      await deleteTrip(tripId)
      router.push('/trips')
    } catch { setError('Something went wrong'); setSaving(false) }
  }

  const isCancelled = currentStatus === 'cancelled'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <h2 className="font-semibold text-slate-900">Manage Trip</h2>

      {mode === 'idle' && (
        <div className="space-y-2">
          {!isCancelled && (
            <>
              <button
                onClick={() => { setMode('reschedule'); setError(null) }}
                className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Reschedule Trip</span>
                <span className="text-slate-400">→</span>
              </button>
              <button
                onClick={() => { setMode('cancel'); setError(null) }}
                className="w-full flex items-center justify-between border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <span>Cancel Trip</span>
                <span className="text-amber-400">→</span>
              </button>
            </>
          )}
          {isCancelled && (
            <button
              onClick={() => { setMode('reschedule'); setError(null) }}
              className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Reschedule (Reactivate)</span>
              <span className="text-slate-400">→</span>
            </button>
          )}
          <button
            onClick={() => { setMode('delete'); setError(null) }}
            className="w-full flex items-center justify-between border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span>Delete Trip</span>
            <span className="text-red-400">→</span>
          </button>
        </div>
      )}

      {mode === 'reschedule' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Pick a new date for this trip:</p>
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleReschedule} disabled={saving}
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Reschedule'}
            </button>
            <button onClick={() => setMode('idle')}
              className="flex-1 border border-slate-200 font-medium py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'cancel' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Mark this trip as cancelled? It will stay in your records.</p>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleCancel} disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Yes, Cancel Trip'}
            </button>
            <button onClick={() => setMode('idle')}
              className="flex-1 border border-slate-200 font-medium py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              Go Back
            </button>
          </div>
        </div>
      )}

      {mode === 'delete' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Permanently delete this trip? This cannot be undone.</p>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={saving}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
              {saving ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setMode('idle')}
              className="flex-1 border border-slate-200 font-medium py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
