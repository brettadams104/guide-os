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
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : clients

  const isNew = query.length > 0 && !selected && filtered.length === 0

  // Notify parent in real-time as user types
  useEffect(() => {
    if (selected) {
      onSelect(selected.id, null)
    } else if (isNew) {
      onSelect(null, query)
    } else {
      onSelect(null, null)
    }
  }, [selected, isNew, query])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(client: Client) {
    setSelected(client)
    setQuery(client.name)
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setOpen(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setSelected(null)
    setOpen(val.length > 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Prevent Enter from submitting the form — it just closes the dropdown
    if (e.key === 'Enter') {
      e.preventDefault()
      setOpen(false)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(query.length > 0)}
          onKeyDown={handleKeyDown}
          placeholder="Search or type a new client name..."
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 pr-8"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status badge */}
      {selected && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-green-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Existing client selected
          {selected.phone && <span className="text-slate-400 font-normal">· {selected.phone}</span>}
        </div>
      )}
      {isNew && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-sky-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          New client — add their details below
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
              No match — <span className="font-medium text-slate-700">"{query}"</span> will be added as a new client
            </div>
          )}
        </div>
      )}
    </div>
  )
}
