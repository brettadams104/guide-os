'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collectTripPayment } from '@/lib/actions/trip-mode'

const METHODS = ['Cash', 'Card', 'Venmo', 'Zelle', 'Check']

interface Props {
  tripId: string
  price: number
  alreadyCollected: number
}

export function CollectPayment({ tripId, price, alreadyCollected }: Props) {
  const remaining = Math.max(0, price - alreadyCollected)
  const [amount, setAmount] = useState(remaining.toFixed(2))
  const [method, setMethod] = useState('Cash')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-1">
        <p className="font-bold text-green-800">Payment Collected</p>
        <p className="text-green-600 text-sm">${parseFloat(amount).toFixed(2)} via {method}</p>
      </div>
    )
  }

  async function handleCollect() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const result = await collectTripPayment(tripId, amt, method.toLowerCase())
    if (!result.error) {
      setDone(true)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div>
        <h2 className="font-bold text-slate-900">Collect Payment</h2>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-sm text-slate-500">Total billed</span>
          <span className="font-semibold text-slate-900">${price.toFixed(2)}</span>
        </div>
        {alreadyCollected > 0 && (
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm text-slate-500">Already collected</span>
            <span className="font-semibold text-green-600">–${alreadyCollected.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between mt-1 pt-2 border-t border-slate-100">
          <span className="text-sm font-semibold text-slate-700">Remaining balance</span>
          <span className="text-xl font-black text-slate-900">${remaining.toFixed(2)}</span>
        </div>
      </div>

      {remaining > 0 ? (
        <>
          {/* Payment method */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {METHODS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    method === m
                      ? 'bg-[#0f1f35] text-white border-[#0f1f35]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 italic">Payment processing coming soon</p>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm font-medium">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={handleCollect}
            disabled={saving || !parseFloat(amount)}
            className="w-full bg-[#0f1f35] hover:bg-[#1a3254] text-white font-bold py-4 rounded-2xl text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : `Collect $${parseFloat(amount || '0').toFixed(2)} via ${method}`}
          </button>
        </>
      ) : (
        <div className="text-center py-2">
          <p className="text-green-600 font-semibold text-sm">Paid in full</p>
        </div>
      )}
    </div>
  )
}
