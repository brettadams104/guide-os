'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTimeSlot, updateTimeSlot, deleteTimeSlot } from '@/lib/actions/trip-options'

interface Slot {
  id: string
  label: string
  start_time: string | null
  end_time: string | null
  duration_days: number | null
  base_slot_id: string | null
  price: number | null
}

const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts = [{ label: '—', value: '' }]
  for (let h = 4; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      opts.push({ label: `${h12}:${mm} ${ampm}`, value: `${hh}:${mm}` })
    }
  }
  return opts
})()

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
      {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function normalizeTime(t: string | null) {
  if (!t) return ''
  const parts = t.trim().split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1] ?? '0', 10)
  if (isNaN(h)) return ''
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function displaySlot(slot: Slot) {
  if (slot.duration_days && slot.duration_days > 1) return `${slot.duration_days} Days`
  const s = normalizeTime(slot.start_time)
  const e = normalizeTime(slot.end_time)
  const sLabel = TIME_OPTIONS.find(o => o.value === s)?.label
  const eLabel = TIME_OPTIONS.find(o => o.value === e)?.label
  if (sLabel && eLabel) return `${sLabel} – ${eLabel}`
  if (sLabel) return sLabel
  return ''
}

type PackageType = 'single' | 'multi'

interface FormState {
  label: string
  packageType: PackageType
  startTime: string
  endTime: string
  durationDays: string
  baseSlotId: string
  price: string
}

function PackageForm({ initial, onSave, onCancel, saving, error, singleDaySlots }:
  { initial: FormState; onSave: (s: FormState) => void; onCancel: () => void; saving: boolean; error: string | null; singleDaySlots: Slot[] }) {
  const [state, setState] = useState(initial)
  const set = (k: keyof FormState, v: string) => setState(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-3">
      <input type="text" value={state.label} onChange={e => set('label', e.target.value)}
        placeholder='Package name (e.g. "Half Day", "3-Day Float")'
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
      <div>
        <label className="block text-xs text-slate-500 mb-1">Default Price <span className="text-slate-300">(optional)</span></label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
          <input type="number" min="0" step="0.01" value={state.price} onChange={e => set('price', e.target.value)}
            placeholder="0.00"
            className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
      </div>

      {/* Package type toggle */}
      <div className="flex gap-2">
        {(['single', 'multi'] as PackageType[]).map(t => (
          <button key={t} type="button" onClick={() => set('packageType', t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
              state.packageType === t ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {t === 'single' ? 'Single Day' : 'Multi Day'}
          </button>
        ))}
      </div>

      {state.packageType === 'single' ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Start Time</label>
            <TimeSelect value={state.startTime} onChange={v => set('startTime', v)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">End Time</label>
            <TimeSelect value={state.endTime} onChange={v => set('endTime', v)} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Number of Days</label>
            <input type="number" min="2" max="30" value={state.durationDays}
              onChange={e => set('durationDays', e.target.value)}
              placeholder="e.g. 3"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          {singleDaySlots.length > 0 && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Base Package (repeated each day)</label>
              <select value={state.baseSlotId} onChange={e => set('baseSlotId', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                <option value="">No base package</option>
                {singleDaySlots.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}{displaySlot(s) ? ` (${displaySlot(s)})` : ''}
                  </option>
                ))}
              </select>
              {state.baseSlotId && state.durationDays && (
                <p className="text-xs text-sky-600 mt-1.5">
                  📅 {state.durationDays} consecutive days of {singleDaySlots.find(s => s.id === state.baseSlotId)?.label}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => onSave(state)} disabled={saving}
          className="flex-1 bg-sky-500 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="flex-1 border text-xs font-medium py-2 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function TimeSlotManager({ slots }: { slots: Slot[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only single-day packages can be used as a base
  const singleDaySlots = slots.filter(s => !s.duration_days || s.duration_days <= 1)

  const emptyForm: FormState = { label: '', packageType: 'single', startTime: '', endTime: '', durationDays: '', baseSlotId: '', price: '' }

  function slotToForm(slot: Slot): FormState {
    return {
      label: slot.label,
      packageType: (slot.duration_days && slot.duration_days > 1) ? 'multi' : 'single',
      startTime: normalizeTime(slot.start_time),
      endTime: normalizeTime(slot.end_time),
      durationDays: slot.duration_days ? String(slot.duration_days) : '',
      baseSlotId: slot.base_slot_id ?? '',
      price: slot.price ? String(slot.price) : '',
    }
  }

  async function handleAdd(state: FormState) {
    if (!state.label.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    try {
      const days = state.packageType === 'multi' ? parseInt(state.durationDays) || null : null
      const price = state.price ? parseFloat(state.price) || null : null
      await addTimeSlot(
        state.label.trim(),
        state.packageType === 'single' ? state.startTime || null : null,
        state.packageType === 'single' ? state.endTime || null : null,
        days,
        state.packageType === 'multi' ? state.baseSlotId || null : null,
        price,
      )
      setShowAdd(false)
      router.refresh()
    } catch { setError('Could not save') } finally { setSaving(false) }
  }

  async function handleUpdate(id: string, state: FormState) {
    if (!state.label.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    try {
      const days = state.packageType === 'multi' ? parseInt(state.durationDays) || null : null
      const price = state.price ? parseFloat(state.price) || null : null
      const result = await updateTimeSlot(
        id, state.label,
        state.packageType === 'single' ? state.startTime || null : null,
        state.packageType === 'single' ? state.endTime || null : null,
        days,
        state.packageType === 'multi' ? state.baseSlotId || null : null,
        price,
      )
      if (result?.error) { setError(result.error); return }
      setEditingId(null)
      router.refresh()
    } catch { setError('Could not save') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await deleteTimeSlot(id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {slots.length > 0 && (
        <ul className="space-y-2">
          {slots.map(slot => (
            <li key={slot.id}>
              {editingId === slot.id ? (
                <div className="bg-white border border-sky-200 rounded-xl p-3">
                  <PackageForm
                    initial={slotToForm(slot)}
                    onSave={s => handleUpdate(slot.id, s)}
                    onCancel={() => { setEditingId(null); setError(null) }}
                    saving={saving}
                    error={editingId === slot.id ? error : null}
                    singleDaySlots={singleDaySlots.filter(s => s.id !== slot.id)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{slot.label}</p>
                    <p className="text-xs text-slate-400">
                      {[displaySlot(slot), slot.price ? `$${slot.price.toFixed(0)}` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditingId(slot.id); setError(null) }}
                      className="text-xs text-sky-500 hover:text-sky-600 font-medium">Edit</button>
                    <button onClick={() => handleDelete(slot.id)}
                      className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showAdd ? (
        <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-medium text-slate-600">New Package</p>
          <PackageForm
            initial={emptyForm}
            onSave={handleAdd}
            onCancel={() => { setShowAdd(false); setError(null) }}
            saving={saving}
            error={!editingId ? error : null}
            singleDaySlots={singleDaySlots}
          />
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100">
          <button onClick={() => setShowAdd(true)}
            className="w-full border border-sky-300 text-sky-600 hover:bg-sky-50 font-medium py-2 rounded-xl transition-colors text-sm">
            + Add Package
          </button>
        </div>
      )}
    </div>
  )
}
