'use client'

import { useState, useRef, useEffect } from 'react'
import { createTripOptionInline } from '@/lib/actions/trip-options'

interface Option { id: string; label: string }

interface Props {
  categoryId: string
  categoryName: string
  options: Option[]
  value: string
  onChange: (optionId: string) => void
}

export function CategoryCombobox({ categoryId, categoryName, options, value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localOptions, setLocalOptions] = useState<Option[]>(options)
  const ref = useRef<HTMLDivElement>(null)

  const selectedOption = localOptions.find(o => o.id === value)
  const displayValue = selectedOption?.label ?? ''

  const filtered = query
    ? localOptions.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : localOptions

  const exactMatch = localOptions.find(o => o.label.toLowerCase() === query.toLowerCase())

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        if (!selectedOption) setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selectedOption])

  function handleSelect(opt: Option) {
    onChange(opt.id)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!query.trim()) return

      if (exactMatch) {
        handleSelect(exactMatch)
        return
      }

      // Create new option
      setSaving(true)
      try {
        const newId = await createTripOptionInline(categoryId, query.trim())
        const newOpt = { id: newId, label: query.trim() }
        setLocalOptions(prev => [...prev, newOpt])
        handleSelect(newOpt)
      } finally {
        setSaving(false)
      }
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        {selectedOption && !open ? (
          <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white cursor-pointer" onClick={() => { setOpen(true); setQuery('') }}>
            <span className="text-sm text-slate-900">{selectedOption.label}</span>
            <button type="button" onClick={e => { e.stopPropagation(); handleClear() }} className="text-slate-400 hover:text-slate-600 text-sm ml-2">✕</button>
          </div>
        ) : (
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={saving ? 'Saving...' : `Select or type ${categoryName.toLowerCase()}...`}
            disabled={saving}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            autoComplete="off"
          />
        )}
      </div>

      {open && !selectedOption && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-48 overflow-y-auto">
          {filtered.length > 0 ? (
            <ul>
              {filtered.map(opt => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {query && !exactMatch && (
            <div className="px-4 py-2.5 text-xs text-slate-500 border-t border-slate-100 bg-sky-50">
              Press <kbd className="bg-white border border-slate-200 rounded px-1 py-0.5 font-mono text-xs">Enter</kbd> to add <span className="font-semibold text-slate-700">"{query}"</span> and save for next time
            </div>
          )}
          {!query && filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">Type to add a new option</div>
          )}
        </div>
      )}
    </div>
  )
}
