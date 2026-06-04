'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTrip } from '@/lib/actions/trips'
import Link from 'next/link'

interface Props {
  trip: any
  timeSlots: { id: string; label: string; start_time: string | null; end_time: string | null }[]
  staff: { id: string; name: string }[]
}

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
]

export function EditTripForm({ trip, timeSlots, staff }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(trip.assigned_staff_id ?? null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const result = await updateTrip(trip.id, {
        trip_date: form.get('trip_date') as string,
        location: (form.get('location') as string) || null,
        notes: (form.get('notes') as string) || null,
        price: form.get('price') ? Number(form.get('price')) : null,
        deposit_paid: Number(form.get('deposit_paid') || 0),
        amount_collected: Number(form.get('amount_collected') || 0),
        payment_method: (form.get('payment_method') as any) || null,
        time_slot_id: (form.get('time_slot_id') as string) || null,
        assigned_staff_id: selectedStaffId,
      })
      if (result.error) { setError(result.error); return }
      router.push(`/trips/${trip.id}`)
      router.refresh()
    } catch { setError('Something went wrong') } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href={`/trips/${trip.id}`} className="text-slate-400 hover:text-slate-600 text-sm inline-block">← Back to Trip</Link>

      {/* Date & Location */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide text-slate-500">Trip Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input name="trip_date" type="date" required defaultValue={trip.trip_date}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input name="location" type="text" defaultValue={trip.location ?? ''}
              placeholder="Lake, river, bay..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        {timeSlots.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Time Slot</label>
            <select name="time_slot_id" defaultValue={trip.time_slot_id ?? ''}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">No time slot</option>
              {timeSlots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}{s.start_time && s.end_time ? ` (${s.start_time} – ${s.end_time})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {staff.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Guide</label>
            <div className="space-y-2">
              {staff.map(s => (
                <label key={s.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStaffId === s.id}
                    onChange={() => setSelectedStaffId(selectedStaffId === s.id ? null : s.id)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide text-slate-500">Notes</h2>
        <textarea name="notes" rows={4} defaultValue={trip.notes ?? ''}
          placeholder="Trip notes..."
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide text-slate-500">Payment</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Trip Price</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
              <input name="price" type="number" min="0" step="0.01" defaultValue={trip.price ?? ''}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit Paid</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
              <input name="deposit_paid" type="number" min="0" step="0.01" defaultValue={trip.deposit_paid ?? 0}
                className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount Collected</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
              <input name="amount_collected" type="number" min="0" step="0.01" defaultValue={trip.amount_collected ?? 0}
                className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
            <select name="payment_method" defaultValue={trip.payment_method ?? ''}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Select...</option>
              {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={saving}
        className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
