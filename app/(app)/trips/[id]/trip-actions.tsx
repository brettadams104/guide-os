'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteTrip } from '@/lib/actions/trips'
import { createClient } from '@/lib/supabase/client'

export function TripActions({ tripId, currentStatus }: { tripId: string; currentStatus: string }) {
  const router = useRouter()
  const [confirming,   setConfirming]   = useState(false)
  const [completing,   setCompleting]   = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const isCompleted = currentStatus === 'completed'

  async function handleDelete() {
    setSaving(true)
    try {
      await deleteTrip(tripId)
      router.push('/trips')
    } catch { setError('Something went wrong'); setSaving(false) }
  }

  async function handleComplete() {
    setCompleting(true)
    try {
      const newStatus = isCompleted ? 'scheduled' : 'completed'
      await createClient().from('trips').update({ status: newStatus }).eq('id', tripId)
      router.refresh()
    } catch { setError('Something went wrong') }
    finally { setCompleting(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <h2 className="font-semibold text-slate-900">Manage Trip</h2>

      {!confirming ? (
        <div className="space-y-2">
          <Link href={`/trips/${tripId}/edit`}
            className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <span>Reschedule / Edit Trip</span><span className="text-slate-400">→</span>
          </Link>
          <button onClick={handleComplete} disabled={completing}
            className={`w-full flex items-center justify-between border rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
              isCompleted
                ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}>
            <span>{completing ? '...' : isCompleted ? 'Unmark as Completed' : 'Mark Trip as Completed'}</span>
            <span className={isCompleted ? 'text-slate-400' : 'text-emerald-400'}>{isCompleted ? '↩' : '✓'}</span>
          </button>
          <button onClick={() => setConfirming(true)}
            className="w-full flex items-center justify-between border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <span>Delete Trip</span><span className="text-red-400">→</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Permanently delete this trip? This cannot be undone.</p>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={saving}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {saving ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setConfirming(false)}
              className="flex-1 border font-medium py-2.5 rounded-xl text-sm hover:bg-slate-50">
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
