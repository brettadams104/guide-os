'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tripId: string
  price: number | null
  depositPaid: number
  amountCollected: number
  tipAmount?: number
  venmoHandle?: string | null
  cashappHandle?: string | null
  zelleContact?: string | null
  paypalHandle?: string | null
}

export function TripCostCard({ tripId, price, depositPaid, amountCollected, tipAmount = 0, venmoHandle, cashappHandle, zelleContact, paypalHandle }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(amountCollected))
  const [saving, setSaving] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [payingSaving, setPayingSaving] = useState(false)
  const [tipAmount2, setTipAmount2] = useState('')
  const [tipSaving, setTipSaving] = useState(false)

  const outstanding = Math.max(0, (price ?? 0) - amountCollected)
  const isPaid = price != null && outstanding === 0

  async function handlePayment() {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) return
    setPayingSaving(true)
    const db = createClient()
    const newCollected = Math.min(amountCollected + amount, price ?? amountCollected + amount)
    await db.from('trips').update({ amount_collected: newCollected }).eq('id', tripId)
    setPaymentAmount('')
    setPayingSaving(false)
    router.refresh()
  }

  async function handleTip() {
    const amount = parseFloat(tipAmount2)
    if (!amount || amount <= 0) return
    setTipSaving(true)
    const db = createClient()
    const newTip = (tipAmount ?? 0) + amount
    await db.from('trips').update({ tip_amount: newTip }).eq('id', tripId)
    setTipAmount2('')
    setTipSaving(false)
    router.refresh()
  }

  async function handleSave() {
    setSaving(true)
    const db = createClient()
    await db.from('trips').update({ amount_collected: parseFloat(value) || 0 }).eq('id', tripId)
    setEditing(false)
    setSaving(false)
    router.refresh()
  }

  return (
    <div
      className={`rounded-2xl border p-5 space-y-3 ${isPaid ? 'bg-green-50 border-green-200' : outstanding > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
      style={{ gridColumn: 'span 1' }}
    >
      <p className="text-xs text-slate-500 uppercase tracking-wide">Trip Cost</p>

      {price != null ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total</span>
            <span className="font-semibold text-slate-900">${price.toFixed(0)}</span>
          </div>
          {depositPaid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Deposit</span>
              <span className="font-medium text-slate-700">${depositPaid.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5">
            <span className="text-slate-600">Collected</span>
            {editing ? (
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
                  autoFocus
                  className="w-20 text-right border border-sky-400 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button onClick={handleSave} disabled={saving} className="text-xs bg-sky-500 text-white px-2 py-1 rounded-lg hover:bg-sky-400 disabled:opacity-50">
                  {saving ? '…' : '✓'}
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setValue(String(amountCollected)); setEditing(true) }}
                className="font-medium text-slate-900 hover:text-sky-600 transition-colors group flex items-center gap-1"
                title="Tap to edit"
              >
                ${amountCollected.toFixed(0)}
                <span className="text-slate-300 group-hover:text-sky-400 text-xs">✎</span>
              </button>
            )}
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tip</span>
              <span className="font-medium text-emerald-600">${tipAmount.toFixed(0)}</span>
            </div>
          )}
          {outstanding > 0 && (
            <>
              <div className="flex justify-between text-sm font-semibold pt-0.5">
                <span className="text-amber-600">Outstanding</span>
                <span className="text-amber-600">${outstanding.toFixed(0)}</span>
              </div>
              <div className="pt-2 border-t border-amber-100 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs text-slate-500">Log Payment</p>
                  <p className="text-xs text-slate-400 italic">Payment processing coming soon</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={outstanding}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handlePayment() }}
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={payingSaving || !paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {payingSaving ? '…' : 'Record'}
                  </button>
                </div>
              </div>
            </>
          )}
          {/* Tip section — always visible */}
          <div className="pt-2 border-t border-amber-100 space-y-2">
            <p className="text-xs text-slate-500">Add a Tip</p>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tipAmount2}
                  onChange={e => setTipAmount2(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleTip() }}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <button
                onClick={handleTip}
                disabled={tipSaving || !tipAmount2 || parseFloat(tipAmount2) <= 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {tipSaving ? '…' : 'Record'}
              </button>
            </div>
          </div>

          {isPaid && (
            <p className="text-xs text-green-600 font-medium">Paid in full ✓</p>
          )}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">No price set</p>
      )}
    </div>
  )
}
