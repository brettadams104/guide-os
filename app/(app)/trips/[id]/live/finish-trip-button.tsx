'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { finishTrip } from '@/lib/actions/trip-mode'

export function FinishTripButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleConfirm() {
    setLoading(true)
    await finishTrip(tripId)
    router.push(`/trips/${tripId}/summary`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-400 transition-colors"
      >
        Finish
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-5">
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">Complete this trip?</h2>
              <p className="text-slate-500 text-sm">
                The trip will be marked complete and you'll be taken to the summary.
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {loading ? 'Completing…' : 'Yes, Complete Trip'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-full border border-slate-200 text-slate-600 font-medium py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                Keep Fishing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
