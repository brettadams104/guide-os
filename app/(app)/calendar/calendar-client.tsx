'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TripEvent {
  id: string
  trip_date: string
  client_name: string | null
  location: string | null
}

export function CalendarClient({ events }: { events: TripEvent[] }) {
  const [current, setCurrent] = useState(() => new Date())

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' })

  const eventsByDate: Record<string, TripEvent[]> = {}
  events.forEach(e => {
    if (!eventsByDate[e.trip_date]) eventsByDate[e.trip_date] = []
    eventsByDate[e.trip_date].push(e)
  })

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const today = new Date()

  function dateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="text-slate-400 hover:text-slate-700 px-2 text-xl">‹</button>
        <h2 className="font-semibold text-slate-900">{monthLabel}</h2>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="text-slate-400 hover:text-slate-700 px-2 text-xl">›</button>
      </div>
      <div className="grid grid-cols-7 text-center border-b border-slate-100">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-xs text-slate-400 font-medium py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const key = day ? dateKey(day) : null
          const dayEvents = key ? (eventsByDate[key] ?? []) : []
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          return (
            <div key={i} className={`min-h-16 p-2 border-b border-r border-slate-100 ${isToday ? 'bg-sky-50' : ''}`}>
              {day && (
                <>
                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-sky-500 font-bold' : 'text-slate-600'}`}>{day}</p>
                  {dayEvents.map(e => (
                    <Link key={e.id} href={`/trips/${e.id}`} className="block bg-sky-500 text-white text-xs rounded px-1.5 py-0.5 mb-0.5 truncate hover:bg-sky-400 transition-colors">
                      {e.client_name ?? 'Trip'}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
