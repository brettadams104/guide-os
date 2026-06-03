'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TripEvent {
  id: string
  trip_date: string
  client_name: string | null
  location: string | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarClient({ events }: { events: TripEvent[] }) {
  const [current, setCurrent] = useState(() => new Date())

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const today = new Date()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

  const eventsByDate: Record<string, TripEvent[]> = {}
  events.forEach(e => {
    if (!eventsByDate[e.trip_date]) eventsByDate[e.trip_date] = []
    eventsByDate[e.trip_date].push(e)
  })

  // Build full 6-week grid (42 cells) like Apple Calendar / Outlook
  const cells: { day: number; currentMonth: boolean }[] = []

  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, currentMonth: false })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true })
  }
  // Next month leading days
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false })
  }

  function dateKey(day: number, cm: boolean) {
    if (cm) {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    // prev/next month keys (for event lookup — unlikely to match but consistent)
    if (cells.indexOf(cells.find(c => c.day === day && !c.currentMonth)!) < firstDay) {
      const pm = month === 0 ? 12 : month
      const py = month === 0 ? year - 1 : year
      return `${py}-${String(pm).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    const nm = month === 11 ? 1 : month + 2
    const ny = month === 11 ? year + 1 : year
    return `${ny}-${String(nm).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function isToday(day: number, cm: boolean) {
    return cm && isCurrentMonth && day === today.getDate()
  }

  function goToday() {
    setCurrent(new Date())
  }

  const monthLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header — Apple/Outlook style */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900 min-w-48">{monthLabel}</h2>
          <button
            onClick={goToday}
            className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors text-lg font-light"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors text-lg font-light"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAYS.map((day, i) => (
          <div key={day} className="py-2.5 text-center">
            <span className="hidden md:inline text-xs font-semibold text-slate-400 uppercase tracking-wider">{day}</span>
            <span className="md:hidden text-xs font-semibold text-slate-400 uppercase tracking-wider">{DAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {cells.map((cell, i) => {
          const key = dateKey(cell.day, cell.currentMonth)
          const dayEvents = eventsByDate[key] ?? []
          const today = isToday(cell.day, cell.currentMonth)
          const isWeekend = i % 7 === 0 || i % 7 === 6

          return (
            <div
              key={i}
              className={`min-h-28 p-2 border-b border-slate-100 flex flex-col ${
                !cell.currentMonth ? 'bg-slate-50/50' : isWeekend ? 'bg-slate-50/30' : 'bg-white'
              } ${today ? 'bg-sky-50/50' : ''}`}
            >
              {/* Date number */}
              <div className="flex items-center justify-end mb-1">
                {today ? (
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">
                    {cell.day}
                  </span>
                ) : (
                  <span className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    cell.currentMonth ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {cell.day}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="flex-1 space-y-0.5 min-w-0">
                {dayEvents.slice(0, 3).map(e => (
                  <Link
                    key={e.id}
                    href={`/trips/${e.id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-white rounded-md px-1.5 py-0.5 transition-colors">
                      <span className="w-1 h-1 rounded-full bg-sky-200 shrink-0" />
                      <span className="text-xs truncate font-medium leading-tight">
                        {e.client_name ?? 'Trip'}{e.location ? ` · ${e.location}` : ''}
                      </span>
                    </div>
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-slate-400 pl-1 font-medium">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
