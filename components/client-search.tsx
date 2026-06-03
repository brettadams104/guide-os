'use client'

import { useState, useRef, useEffect } from 'react'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface Props {
  clients: Client[]
  onSelect: (clientId: string | null, newClientName: string | null) => void
}

export function ClientSearch({ clients, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const [isNew, setIsNew] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : clients

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        // If query doesn't match any client and isn't empty, mark as new
        if (query && !selected) {
          const exact = clients.find(c => c.name.toLowerCase() === query.toLowerCase())
          if (!exact) {
            setIsNew(true)
            onSelect(null, query)
          }
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [query, selected, clients, onSelect])

  function handleSelect(client: Client) {
    setSelected(client)
    setQuery(client.name)
    setIsNew(false)
    setOpen(false)
    onSelect(client.id, null)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setIsNew(false)
    setOpen(false)
    onSelect(null, null)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setSelected(null)
    setIsNew(false)
    onSelect(null, null)
    setOpen(val.length > 0)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Search or type client name..."
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 pr-8"
        />
        {(query || selected) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Existing client badge */}
      {selected && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-green-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Existing client selected
          {selected.phone && <span className="text-slate-400 font-normal">· {selected.phone}</span>}
        </div>
      )}

      {/* New client badge */}
      {isNew && !selected && query && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-sky-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          New client — fill in details below
        </div>
      )}

      {/* Dropdown */}
      {open && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-48 overflow-y-auto">
          {filtered.length > 0 ? (
            <ul>
              {filtered.map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <p className="font-medium text-slate-900">{c.name}</p>
                    {(c.phone || c.email) && (
                      <p className="text-xs text-slate-400 mt-0.5">{c.phone ?? c.email}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              No client found — fill in details below to add <span className="font-medium text-slate-700">"{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
