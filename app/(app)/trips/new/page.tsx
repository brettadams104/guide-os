'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTrip } from '@/lib/actions/trips'
import Link from 'next/link'

interface Catch { species: string; count: number }

export default function NewTripPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catches, setCatches] = useState<Catch[]>([{ species: '', count: 1 }])

  function addCatch() { setCatches(prev => [...prev, { species: '', count: 1 }]) }
  function updateCatch(i: number, field: keyof Catch, value: string | number) {
    setCatches(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }
  function removeCatch(i: number) { setCatches(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const tripId = await createTrip({
        client_id: (form.get('client_id') as string) || null,
        trip_date: form.get('trip_date') as string,
        location: (form.get('location') as string) || null,
        notes: (form.get('notes') as string) || null,
        price: form.get('price') ? Number(form.get('price')) : null,
        deposit_paid: Number(form.get('deposit_paid') || 0),
        amount_collected: Number(form.get('amount_collected') || 0),
        payment_method: (form.get('payment_method') as any) || null,
        catches: catches.filter(c => c.species.trim()),
      })
      router.push(`/trips/${tripId}`)
    } catch (err) { setError((err as Error).message); setLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trips" className="text-slate-400 hover:text-slate-600 text-sm">← Trips</Link>
        <h1 className="text-2xl font-bold text-slate-900">Log Trip</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="font-semibold text-slate-900">Trip Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input name="trip_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input name="location" type="text" placeholder="Lake, river, bay..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea name="notes" rows={3} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" placeholder="How'd it go?" />
          </div>
          <p className="text-xs text-slate-400">Weather, moon phase, and barometric pressure are fetched automatically when you save.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Fish Caught</h2>
          {catches.map((c, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input
                value={c.species}
                onChange={e => updateCatch(i, 'species', e.target.value)}
                placeholder="Species (e.g. Largemouth Bass)"
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="number"
                min="1"
                value={c.count}
                onChange={e => updateCatch(i, 'count', Number(e.target.value))}
                className="w-20 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-center"
              />
              {catches.length > 1 && (
                <button type="button" onClick={() => removeCatch(i)} className="text-slate-400 hover:text-red-400 text-lg">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addCatch} className="text-sky-500 text-sm hover:text-sky-400">+ Add species</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Payment</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'price', label: 'Trip Price' },
              { name: 'deposit_paid', label: 'Deposit Paid' },
              { name: 'amount_collected', label: 'Collected Today' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
                  <input name={f.name} type="number" min="0" step="0.01" placeholder="0.00" className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
              <select name="payment_method" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">Select...</option>
                {['cash','card','venmo','zelle','check','other'].map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {loading ? 'Saving & fetching conditions...' : 'Log Trip'}
        </button>
      </form>
    </div>
  )
}
