'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PhoneInput } from '@/components/phone-input'
import { updateClientRecord, deleteClientRecord } from '@/lib/actions/clients'
import { createClient } from '@/lib/supabase/client'

interface Trip {
  id: string
  trip_date: string
  price: number | null
  amount_collected: number
  status: string
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

interface Props {
  client: Client
  trips: Trip[]
  outstanding: number
}

export function EditClientForm({ client, trips, outstanding }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [payingSaving, setPayingSaving] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      await updateClientRecord(client.id, {
        name: form.get('name') as string,
        email: (form.get('email') as string) || null,
        phone: (form.get('phone') as string) || null,
        address: (form.get('address') as string) || null,
        notes: (form.get('notes') as string) || null,
      })
      router.push(`/clients/${client.id}`)
      router.refresh()
    } catch (err) { setError((err as Error).message); setLoading(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteClientRecord(client.id)
    router.push('/clients')
  }

  async function handlePayment() {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) return
    setPayingSaving(true)

    // Apply payment to trips with outstanding balances oldest-first
    const db = createClient()
    let remaining = amount
    const unpaid = [...trips]
      .filter(t => (t.price ?? 0) > (t.amount_collected ?? 0))
      .sort((a, b) => a.trip_date.localeCompare(b.trip_date))

    for (const trip of unpaid) {
      if (remaining <= 0) break
      const owed = (trip.price ?? 0) - (trip.amount_collected ?? 0)
      const apply = Math.min(remaining, owed)
      await db.from('trips').update({ amount_collected: trip.amount_collected + apply }).eq('id', trip.id)
      remaining -= apply
    }

    setPaymentAmount('')
    setPaymentNote('')
    setPaymentSuccess(true)
    setPayingSaving(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href={`/clients/${client.id}`} className="text-slate-400 hover:text-slate-600 text-sm">← Client</Link>
      </div>

      {/* Client details */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Client Details</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <input name="name" type="text" required defaultValue={client.name} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
          <PhoneInput defaultValue={client.phone ?? ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input name="email" type="email" defaultValue={client.email ?? ''} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
          <input name="address" type="text" defaultValue={client.address ?? ''} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={client.notes ?? ''}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Outstanding balance */}
      <div className={`bg-white rounded-2xl border p-6 space-y-4 ${outstanding > 0 ? 'border-amber-200' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Outstanding Balance</h2>
          <span className={`text-xl font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            ${outstanding.toFixed(2)}
          </span>
        </div>

        {outstanding > 0 && (
          <>
            {/* Breakdown by trip */}
            <ul className="space-y-1.5">
              {trips.filter(t => (t.price ?? 0) > (t.amount_collected ?? 0)).map(t => (
                <li key={t.id} className="flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(t.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="font-medium text-amber-600">
                    ${((t.price ?? 0) - (t.amount_collected ?? 0)).toFixed(2)} owed
                  </span>
                </li>
              ))}
            </ul>

            {/* Log payment */}
            {paymentSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
                Payment recorded successfully.
              </div>
            ) : (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-600">Log a Payment</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={outstanding}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="Amount received"
                    className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <button
                  onClick={handlePayment}
                  disabled={payingSaving || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {payingSaving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            )}
          </>
        )}

        {outstanding === 0 && (
          <p className="text-sm text-green-600 font-medium">All trips paid in full ✓</p>
        )}
      </div>

      {/* Delete */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-3">
        <p className="text-sm font-medium text-red-600">Delete Client</p>
        <p className="text-xs text-slate-500">Permanently deletes the client and all trip history.</p>
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setConfirming(false)}
              className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium hover:bg-slate-50">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)}
            className="w-full border border-red-200 text-red-500 rounded-xl py-2 text-sm font-semibold hover:bg-red-50">
            Delete Client
          </button>
        )}
      </div>
    </>
  )
}
