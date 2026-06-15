'use client'

import { useState, useEffect } from 'react'
import { TimeSelect } from '@/components/time-select'
import { TripLocationInput, saveLocation } from '@/components/trip-location-input'

function localDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { scheduleTrip, logTripDetails } from '@/lib/actions/trips'
import { createClientRecord } from '@/lib/actions/clients'
import { createClient } from '@/lib/supabase/client'
import { ClientSearch } from '@/components/client-search'
import { CategoryCombobox } from '@/components/category-combobox'
import { PhoneInput } from '@/components/phone-input'

const TABS = ['Current Trips', 'Schedule', 'Completed'] as const
type Tab = typeof TABS[number]

const TAB_PARAM: Record<string, Tab> = {
  'current': 'Current Trips',
  'schedule': 'Schedule',
  'completed': 'Completed',
}

export default function TripsPage() {
  const searchParams = useSearchParams()
  const initialTab = TAB_PARAM[searchParams.get('tab') ?? ''] ?? 'Current Trips'
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Trips</h1>

      <div className="flex bg-slate-100 p-1 rounded-xl w-full">
        {TABS.map(t => (
          <button
            key={t}
            data-tour={t === 'Schedule' ? 'schedule-tab' : undefined}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Current Trips' && <div data-tour="current-trips"><UpcomingTab /></div>}
      {tab === 'Schedule' && <ScheduleTab />}
      {tab === 'Completed' && <CompletedTab />}
    </div>
  )
}

function UpcomingTab() {
  const [trips, setTrips] = useState<any[] | null>(null)
  const today = localDateStr()

  if (trips === null) {
    Promise.resolve().then(() => {
      createClient()
        .from('trips')
        .select('*, clients(name)')
        .eq('status', 'scheduled')
        .gte('trip_date', today)
        .order('trip_date', { ascending: true })
        .then(({ data }) => setTrips(data ?? []))
    })
    return <p className="text-slate-400 text-sm py-8 text-center">Loading...</p>
  }

  if (!trips.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <p className="text-slate-400 text-sm">No upcoming trips scheduled.</p>
        <p className="text-slate-400 text-xs mt-1">Use the Schedule tab to book your next trip.</p>
      </div>
    )
  }

  // Group trips by date
  const grouped: Record<string, any[]> = {}
  trips.forEach((trip: any) => {
    if (!grouped[trip.trip_date]) grouped[trip.trip_date] = []
    grouped[trip.trip_date].push(trip)
  })

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayTrips]) => {
        const isToday = date === today
        const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        return (
          <div key={date} className="space-y-3">
            <p className="font-bold text-slate-900 text-base">
              {isToday ? `Today · ${dateLabel}` : dateLabel}
            </p>
            {dayTrips.map((trip: any) => (
              <div key={trip.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Link href={`/trips/${trip.id}`} className="block p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-base">{trip.clients?.name ?? 'No client'}</p>
                      {trip.location && <p className="text-slate-500 text-sm mt-0.5">{trip.location}</p>}
                      {trip.price != null && (
                        <p className="text-sm text-slate-500 mt-1">
                          ${trip.price.toFixed(0)}{trip.deposit_paid > 0 ? ` · Deposit: $${trip.deposit_paid.toFixed(0)}` : ''}
                        </p>
                      )}
                      {trip.notes && <p className="mt-1 text-xs text-slate-400 italic">{trip.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                      <span className="text-xs bg-sky-100 text-sky-700 font-medium px-2.5 py-1 rounded-full">Scheduled</span>
                      {trip.price != null && (() => {
                        const owed = Math.max(0, (trip.price ?? 0) - (trip.amount_collected ?? 0))
                        return owed > 0
                          ? <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">Owes ${owed.toFixed(0)}</span>
                          : <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">Paid in Full</span>
                      })()}
                    </div>
                  </div>
                </Link>
                <div className="border-t border-slate-100 px-5 py-2.5 flex gap-3">
                  <Link href={`/trips/${trip.id}`}
                    className="flex-1 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 py-1 transition-colors">
                    View Trip
                  </Link>
                  <div className="w-px bg-slate-100" />
                  <Link href={`/trips/${trip.id}/edit`}
                    className="flex-1 text-center text-xs font-semibold text-sky-600 hover:text-sky-700 py-1 transition-colors">
                    Reschedule / Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function ScheduleTab() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string; phone: string | null; email: string | null }[]>([])
  const [timeSlots, setTimeSlots] = useState<{ id: string; label: string; start_time: string | null; end_time: string | null; price: number | null }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; guide_trip_options: { id: string; label: string }[] }[]>([])
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [newClientName, setNewClientName] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [autoPrice, setAutoPrice] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [categorySelections, setCategorySelections] = useState<Record<string, string>>({})
  const isNewClient = !!newClientName && !selectedClientId

  useEffect(() => {
    const db = createClient()
    Promise.all([
      db.from('clients').select('id, name, phone, email').order('name'),
      db.from('guide_time_slots').select('id, label, start_time, end_time, price').order('sort_order').order('created_at'),
      db.from('guide_trip_categories').select('id, name, guide_trip_options(id, label)').order('sort_order').order('created_at'),
      db.from('guide_staff').select('id, name').order('name'),
    ]).then(([c, ts, cats, st]) => {
      setClients(c.data ?? [])
      setTimeSlots(ts.data ?? [])
      setCategories((cats.data ?? []) as any)
      setStaff(st.data ?? [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    const form = new FormData(e.currentTarget)
    try {
      let clientId = selectedClientId

      // Create new client if needed
      if (isNewClient && newClientName) {
        await createClientRecord({
          name: newClientName,
          email: (form.get('new_email') as string) || null,
          phone: (form.get('new_phone') as string) || null,
          address: (form.get('new_address') as string) || null,
          notes: null,
        })
        // Get the newly created client's ID
        const { data } = await createClient()
          .from('clients')
          .select('id')
          .eq('name', newClientName)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        clientId = data?.id ?? null
      }

      const tripId = await scheduleTrip({
        client_id: clientId,
        trip_date: form.get('trip_date') as string,
        location: (form.get('location') as string) || null,
        notes: (form.get('notes') as string) || null,
        price: form.get('price') ? Number(form.get('price')) : null,
        deposit_paid: Number(form.get('deposit_paid') || 0),
        payment_method: (form.get('payment_method') as any) || null,
        time_slot_id: (form.get('time_slot_id') as string) || null,
        trip_type_id: null,
        assigned_staff_id: selectedStaffId,
        start_time: startTime || null,
        end_time: endTime || null,
      })
      const loc = form.get('location') as string
      if (loc?.trim()) saveLocation(loc.trim())
      router.push(`/trips/${tripId}`)
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Schedule a Trip</h2>

        {/* Client search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Client</label>
          <ClientSearch
            clients={clients}
            onSelect={(id, name) => { setSelectedClientId(id); setNewClientName(name) }}
          />
        </div>

        {/* New client fields — expands automatically */}
        {isNewClient && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">New Client Details</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <PhoneInput name="new_phone" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
            </div>
            {[
              { name: 'new_email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
              { name: 'new_address', label: 'Address', type: 'text', placeholder: 'City, State' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                <input name={f.name} type={f.type} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
              </div>
            ))}
          </div>
        )}

        {/* Time slot */}
        {timeSlots.length > 0 && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Package</label>
              <select
                name="time_slot_id"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                onChange={e => {
                  const slot = timeSlots.find(s => s.id === e.target.value)
                  if (slot?.price) setAutoPrice(String(slot.price))
                  else setAutoPrice('')
                  setStartTime(slot?.start_time ?? '')
                  setEndTime(slot?.end_time ?? '')
                }}
              >
                <option value="">Select a package...</option>
                {timeSlots.map(s => (
                  <option key={s.id} value={s.id}>{s.label}{s.price ? ` — $${s.price.toFixed(0)}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Start Time</label>
                <TimeSelect value={startTime} onChange={setStartTime} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">End Time</label>
                <TimeSelect value={endTime} onChange={setEndTime} />
              </div>
            </div>
          </div>
        )}

        {/* Trip detail categories — combobox with inline add */}
        {categories.map(cat => (
          <div key={cat.id}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{cat.name}</label>
            <CategoryCombobox
              categoryId={cat.id}
              categoryName={cat.name}
              options={cat.guide_trip_options}
              value={categorySelections[cat.id] ?? ''}
              onChange={optId => setCategorySelections(prev => ({ ...prev, [cat.id]: optId }))}
            />
          </div>
        ))}

        {/* Assign guide */}
        {staff.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign Guide</label>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input name="trip_date" type="date" required defaultValue={localDateStr()} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <TripLocationInput name="location" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea name="notes" rows={2} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" placeholder="Meeting spot, special requests..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Trip Price</label>
            <div className="relative"><span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
              <input name="price" type="number" min="0" step="0.01" placeholder="0.00" value={autoPrice} onChange={e => setAutoPrice(e.target.value)} className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit</label>
            <div className="relative"><span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
              <input name="deposit_paid" type="number" min="0" step="0.01" placeholder="0.00" className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
          {loading ? 'Scheduling...' : 'Schedule Trip'}
        </button>
      </form>
    </div>
  )
}


function LogDetailsTab() {
  const [trips, setTrips] = useState<any[] | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [catches, setCatches] = useState([{ species: '', count: 1 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (trips === null) {
    Promise.resolve().then(() => {
      createClient()
        .from('trips')
        .select('*, clients(name)')
        .eq('status', 'scheduled')
        .order('trip_date', { ascending: false })
        .then(({ data }) => setTrips(data ?? []))
    })
    return <p className="text-slate-400 text-sm py-8 text-center">Loading...</p>
  }

  function addCatch() { setCatches(p => [...p, { species: '', count: 1 }]) }
  function updateCatch(i: number, f: string, v: string | number) {
    setCatches(p => p.map((c, idx) => idx === i ? { ...c, [f]: v } : c))
  }
  function removeCatch(i: number) { setCatches(p => p.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      await logTripDetails(selected.id, {
        catches: catches.filter(c => c.species.trim()),
        amount_collected: Number(form.get('amount_collected') || 0),
        tip_amount: Number(form.get('tip_amount') || 0),
        payment_method: (form.get('payment_method') as any) || null,
        notes: (form.get('notes') as string) || null,
        trip_date: selected.trip_date,
        complete: true,
      })
      setSuccess(true)
      setSelected(null)
      setTrips(p => p?.filter(t => t.id !== selected.id) ?? [])
      setCatches([{ species: '', count: 1 }])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (success && !selected) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
        Trip details logged! Check Analytics to see your updated stats.
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="space-y-4 max-w-xl">
        <p className="text-sm text-slate-500">Select a completed trip to log catches, payment, and conditions.</p>
        {!trips.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm">No scheduled trips to log yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {trips.map((trip: any) => (
                <li key={trip.id}>
                  <button onClick={() => setSelected(trip)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{trip.clients?.name ?? 'No client'}{trip.location ? ` · ${trip.location}` : ''}</p>
                    </div>
                    <span className="text-sky-500 text-sm font-medium">Log Details →</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-sm">← Back</button>
        <div>
          <p className="font-semibold text-slate-900">{new Date(selected.trip_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p className="text-slate-500 text-xs">{selected.clients?.name ?? 'No client'}{selected.location ? ` · ${selected.location}` : ''}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Fish Caught</h2>
        {catches.map((c, i) => (
          <div key={i} className="flex gap-3 items-center">
            <input
              value={c.species}
              onChange={e => updateCatch(i, 'species', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (c.species.trim()) addCatch()
                }
              }}
              placeholder="Species (press Enter to add another)"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input type="number" min="1" value={c.count} onChange={e => updateCatch(i, 'count', Number(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} className="w-20 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-center" />
            {catches.length > 1 && <button type="button" onClick={() => removeCatch(i)} className="text-slate-400 hover:text-red-400 text-lg">✕</button>}
          </div>
        ))}
        <button type="button" onClick={addCatch} className="text-sky-500 text-sm hover:text-sky-400">+ Add species</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Payment</h2>

        {/* Breakdown */}
        {selected.price != null && (
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Trip Price</span>
              <span className="font-medium text-slate-800">${Number(selected.price).toFixed(2)}</span>
            </div>
            {Number(selected.deposit_paid ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Deposit Received</span>
                <span className="font-medium text-slate-600">${Number(selected.deposit_paid).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-100">
              <span className="text-slate-700">Balance Due</span>
              <span className="text-amber-600">${Math.max(0, Number(selected.price) - Number(selected.amount_collected ?? 0)).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Amount Collected */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount Collected</label>
          <div className="relative"><span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
            <input name="amount_collected" type="number" min="0" step="0.01"
              defaultValue={selected.price != null ? Math.max(0, Number(selected.price) - Number(selected.amount_collected ?? 0)) : ''}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
          <select name="payment_method" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Select...</option>
            {['cash','card','venmo','zelle','check','other'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
        </div>

        {/* Tip */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tip <span className="text-slate-400 font-normal">(optional)</span></label>
          <div className="relative"><span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
            <input name="tip_amount" type="number" min="0" step="0.01" placeholder="0.00"
              className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
        <textarea name="notes" rows={3} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" placeholder="How'd it go?" />
        <p className="text-xs text-slate-400 mt-2">Weather, moon phase, and pressure are fetched automatically.</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
        {loading ? 'Saving & fetching conditions...' : 'Save Trip Details'}
      </button>
    </form>
  )
}

function CompletedTab() {
  const [trips, setTrips] = useState<any[] | null>(null)

  if (trips === null) {
    Promise.resolve().then(() => {
      createClient()
        .from('trips')
        .select('*, clients(name), trip_catches(species, count)')
        .eq('status', 'completed')
        .order('trip_date', { ascending: false })
        .then(({ data }) => setTrips(data ?? []))
    })
    return <p className="text-slate-400 text-sm py-8 text-center">Loading...</p>
  }

  return (
    <div className="space-y-4">
      {!trips.length ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No completed trips yet.</p>
          <p className="text-slate-400 text-xs mt-1">Use Log Details to mark a trip as complete.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {trips.map((trip: any) => {
              const totalFish = (trip.trip_catches as { count: number }[])?.reduce((s: number, c: { count: number }) => s + c.count, 0) ?? 0
              return (
                <li key={trip.id}>
                  <Link href={`/trips/${trip.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {trip.clients?.name ?? 'No client'}{trip.location ? ` · ${trip.location}` : ''} · {totalFish} fish
                      </p>
                    </div>
                    <div className="text-right">
                      {trip.amount_collected > 0 && (
                        <p className="text-sm font-semibold text-slate-900">${trip.amount_collected.toFixed(0)}</p>
                      )}
                      <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">Completed</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
