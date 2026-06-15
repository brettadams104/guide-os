'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logTripDetails } from '@/lib/actions/trips'

interface Props {
  tripId: string
  tripDate: string
  defaultPrice?: number | null
  depositPaid?: number
  amountCollected?: number
}

export function LogDetailsForm({ tripId, tripDate, defaultPrice, depositPaid = 0, amountCollected = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [catches, setCatches] = useState([{ species: '', count: 1 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function addCatch() { setCatches(p => [...p, { species: '', count: 1 }]) }
  function updateCatch(i: number, f: string, v: string | number) {
    setCatches(p => p.map((c, idx) => idx === i ? { ...c, [f]: v } : c))
  }
  function removeCatch(i: number) { setCatches(p => p.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, complete = false) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      await logTripDetails(tripId, {
        catches: catches.filter(c => c.species.trim()),
        amount_collected: Number(form.get('amount_collected') || 0),
        tip_amount: Number(form.get('tip_amount') || 0),
        payment_method: (form.get('payment_method') as any) || null,
        notes: (form.get('notes') as string) || null,
        trip_date: tripDate,
        complete,
      })
      router.refresh()
      setOpen(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-2xl text-sm transition-colors"
      >
        Log Trip Details
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-lg">Log Trip Details</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
      </div>

      {/* Fish caught */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Fish Caught</h3>
        {catches.map((c, i) => (
          <div key={i} className="flex gap-3 items-center">
            <input
              value={c.species}
              onChange={e => updateCatch(i, 'species', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (c.species.trim()) addCatch() } }}
              placeholder="Species (Enter to add another)"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="number" min="1" value={c.count}
              onChange={e => updateCatch(i, 'count', Number(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
              className="w-20 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-center"
            />
            {catches.length > 1 && (
              <button type="button" onClick={() => removeCatch(i)} className="text-slate-400 hover:text-red-400 text-lg">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addCatch} className="text-sky-500 text-sm hover:text-sky-400">+ Add species</button>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Payment</h3>

        {/* Breakdown */}
        {defaultPrice != null && (
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Trip Price</span>
              <span className="font-medium text-slate-800">${defaultPrice.toFixed(2)}</span>
            </div>
            {depositPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Deposit Received</span>
                <span className="font-medium text-emerald-600">− ${depositPaid.toFixed(2)}</span>
              </div>
            )}
            {amountCollected > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Previously Collected</span>
                <span className="font-medium text-emerald-600">− ${amountCollected.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-100">
              <span className="text-slate-700">Balance Due</span>
              <span className="text-slate-900">${Math.max(0, defaultPrice - depositPaid - amountCollected).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Amount Collected */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount Collected</label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
            <input name="amount_collected" type="number" min="0" step="0.01"
              defaultValue={defaultPrice != null ? Math.max(0, defaultPrice - depositPaid - amountCollected) : ''}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
          <select name="payment_method" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Select...</option>
            {['cash', 'card', 'venmo', 'zelle', 'check', 'other'].map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Tip */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tip <span className="text-slate-400 font-normal">(optional)</span></label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
            <input name="tip_amount" type="number" min="0" step="0.01"
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea name="notes" rows={3}
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          placeholder="How'd it go?" />
        <p className="text-xs text-slate-400 mt-2">Weather, moon phase, and pressure are fetched automatically.</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-50">
        {loading ? 'Saving…' : 'Save Trip Details'}
      </button>

      <button type="button" disabled={loading}
        onClick={e => handleSubmit(e as any, true)}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-50">
        {loading ? 'Saving…' : 'Save & Complete Trip'}
      </button>
      <p className="text-xs text-slate-400 text-center -mt-1">Marks the trip as completed and moves it to your history</p>
    </form>
  )
}
