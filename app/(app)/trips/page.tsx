'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { scheduleTrip, logTripDetails } from '@/lib/actions/trips'
import { createClientRecord } from '@/lib/actions/clients'
import { createClient } from '@/lib/supabase/client'
import { ClientSearch } from '@/components/client-search'

const TABS = ['Schedule', 'Upcoming', 'Log Details', 'Completed'] as const
type Tab = typeof TABS[number]

export default function TripsPage() {
  const [tab, setTab] = useState<Tab>('Upcoming')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Trips</h1>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Schedule' && <ScheduleTab />}
      {tab === 'Upcoming' && <UpcomingTab />}
      {tab === 'Log Details' && <LogDetailsTab />}
      {tab === 'Completed' && <CompletedTab />}
    </div>
  )
}

function ScheduleTab() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string; phone: string | null; email: string | null }[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [newClientName, setNewClientName] = useState<string | null>(null)
  const isNewClient = !!newClientName && !selectedClientId

  useEffect(() => {
    createClient()
      .from('clients')
      .select('id, name, phone, email')
      .order('name')
      .then(({ data }) => setClients(data ?? []))
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

      await scheduleTrip({
        client_id: clientId,
        trip_date: form.get('trip_date') as string,
        location: (form.get('location') as string) || null,
        notes: (form.get('notes') as string) || null,
        price: form.get('price') ? Number(form.get('price')) : null,
        deposit_paid: Number(form.get('deposit_paid') || 0),
        payment_method: (form.get('payment_method') as any) || null,
      })
      setSuccess(true)
      setSelectedClientId(null)
      setNewClientName(null)
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
          Trip scheduled! It will appear in Upcoming.
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Schedule a Trip</h2>

        {/* Client search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Client <span className="text-slate-400 font-normal">(optional)</span></label>
          <ClientSearch
            clients={clients}
            onSelect={(id, name) => { setSelectedClientId(id); setNewClientName(name) }}
          />
        </div>

        {/* New client fields — expands automatically */}
        {isNewClient && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">New Client Details</p>
            {[
              { name: 'new_phone', label: 'Phone', type: 'tel', placeholder: '(555) 000-0000' },
              { name: 'new_email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
              { name: 'new_address', label: 'Address', type: 'text', placeholder: 'City, State' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label} <span className="text-slate-400">(optional)</span></label>
                <input name={f.name} type={f.type} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
              </div>
            ))}
          </div>
        )}

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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea name="notes" rows={2} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" placeholder="Meeting spot, special requests..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Trip Price <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative"><span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
              <input name="price" type="number" min="0" step="0.01" placeholder="0.00" className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit <span className="text-slate-400 font-normal">(optional)</span></label>
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

function UpcomingTab() {
  const [trips, setTrips] = useState<any[] | null>(null)

  if (trips === null) {
    Promise.resolve().then(() => {
      createClient()
        .from('trips')
        .select('*, clients(name)')
        .eq('status', 'scheduled')
        .gte('trip_date', new Date().toISOString().split('T')[0])
        .order('trip_date', { ascending: true })
        .then(({ data }) => setTrips(data ?? []))
    })
    return <p className="text-slate-400 text-sm py-8 text-center">Loading...</p>
  }

  return (
    <div className="space-y-4">
      {!trips.length ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No upcoming trips scheduled.</p>
          <p className="text-slate-400 text-xs mt-1">Use the Schedule tab to book your next trip.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {trips.map((trip: any) => (
              <li key={trip.id}>
                <Link href={`/trips/${trip.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">{trip.clients?.name ?? 'No client'}{trip.location ? ` · ${trip.location}` : ''}</p>
                  </div>
                  <span className="text-xs bg-sky-100 text-sky-700 font-medium px-2.5 py-1 rounded-full">Scheduled</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
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
        payment_method: (form.get('payment_method') as any) || null,
        notes: (form.get('notes') as string) || null,
        trip_date: selected.trip_date,
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
            <input value={c.species} onChange={e => updateCatch(i, 'species', e.target.value)} placeholder="Species" className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            <input type="number" min="1" value={c.count} onChange={e => updateCatch(i, 'count', Number(e.target.value))} className="w-20 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-center" />
            {catches.length > 1 && <button type="button" onClick={() => removeCatch(i)} className="text-slate-400 hover:text-red-400 text-lg">✕</button>}
          </div>
        ))}
        <button type="button" onClick={addCatch} className="text-sky-500 text-sm hover:text-sky-400">+ Add species</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Payment</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount Collected</label>
            <div className="relative"><span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
              <input name="amount_collected" type="number" min="0" step="0.01" defaultValue={selected.price ?? ''} placeholder="0.00" className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
            <select name="payment_method" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Select...</option>
              {['cash','card','venmo','zelle','check','other'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea name="notes" rows={3} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" placeholder="How'd it go?" />
        <p className="text-xs text-slate-400 mt-2">🌤 Weather, moon phase, and pressure fetched automatically.</p>
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
