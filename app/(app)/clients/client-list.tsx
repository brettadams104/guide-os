'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  tripCount: number
}

export function ClientList({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : clients

  const dropdownResults = query.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div ref={ref} className="relative">
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search clients by name..."
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white shadow-sm"
          />
          {query && (
            <button onClick={() => { setQuery(''); setShowDropdown(false) }}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 text-sm">✕</button>
          )}
        </div>

        {/* Dropdown suggestions */}
        {showDropdown && dropdownResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {dropdownResults.map(c => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                onClick={() => { setQuery(c.name); setShowDropdown(false) }}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{c.phone ?? c.email ?? 'No contact info'}</p>
                </div>
                <p className="text-xs text-slate-400">{c.tripCount} trips</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Full list */}
      {!clients.length ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No clients yet.</p>
          <Link href="/clients/new" className="text-sky-500 text-sm mt-2 inline-block hover:text-sky-400">Add your first client →</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">No clients match "{query}"</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {filtered.map(client => (
              <li key={client.id}>
                <Link href={`/clients/${client.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{client.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{client.phone ?? client.email ?? 'No contact info'}</p>
                  </div>
                  <p className="text-xs text-slate-400">{client.tripCount} trips</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
