'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TripEvent {
  id: string
  trip_date: string
  client_name: string | null
  location: string | null
  status: string
  notes: string | null
  time_label: string | null
  start_time: string | null
  end_time: string | null
  guide_name: string | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function CalendarClient({ events }: { events: TripEvent[] }) {
  const [current, setCurrent] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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

  const cells: { day: number; currentMonth: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, currentMonth: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, currentMonth: true })
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, currentMonth: false })

  function dateKey(day: number, cm: boolean) {
    if (cm) return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return ''
  }

  function isToday(day: number, cm: boolean) {
    return cm && isCurrentMonth && day === today.getDate()
  }

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []
  const selectedLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null

  // Sort events by start_time
  const sortedSelected = [...selectedEvents].sort((a, b) => {
    if (!a.start_time && !b.start_time) return 0
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900 min-w-48">
              {current.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCurrent(new Date())}
              className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors text-lg">‹</button>
            <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors text-lg">›</button>
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

        {/* Grid */}
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {cells.map((cell, i) => {
            const key = dateKey(cell.day, cell.currentMonth)
            const dayEvents = key ? (eventsByDate[key] ?? []) : []
            const todayCell = isToday(cell.day, cell.currentMonth)
            const isWeekend = i % 7 === 0 || i % 7 === 6
            const isSelected = key === selectedDate

            return (
              <div
                key={i}
                onClick={() => cell.currentMonth && key && setSelectedDate(isSelected ? null : key)}
                className={`min-h-28 p-2 border-b border-slate-100 flex flex-col transition-colors ${
                  cell.currentMonth ? 'cursor-pointer' : ''
                } ${isSelected ? 'bg-sky-50 ring-2 ring-inset ring-sky-400' : todayCell ? 'bg-sky-50/50' : isWeekend && cell.currentMonth ? 'bg-slate-50/30' : 'bg-white'} ${cell.currentMonth && !isSelected ? 'hover:bg-slate-50' : ''}`}
              >
                <div className="flex items-center justify-end mb-1">
                  {todayCell ? (
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">{cell.day}</span>
                  ) : (
                    <span className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full ${cell.currentMonth ? 'text-slate-700' : 'text-slate-300'}`}>{cell.day}</span>
                  )}
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id} className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${e.status === 'scheduled' ? 'bg-sky-500' : 'bg-emerald-500'}`}>
                      <span className="w-1 h-1 rounded-full bg-white/60 shrink-0" />
                      <span className="text-xs truncate font-medium leading-tight text-white">
                        {e.start_time ? fmt12(e.start_time) + ' · ' : ''}{e.client_name ?? 'Trip'}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && <p className="text-xs text-slate-400 pl-1">+{dayEvents.length - 3} more</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day schedule modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0f1f35] rounded-t-2xl">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Daily Schedule</p>
                <p className="text-white font-bold mt-0.5">{selectedLabel}</p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Timeline body */}
            <div className="overflow-y-auto flex-1">
              {!sortedSelected.length ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-slate-400 text-sm">No trips scheduled for this day.</p>
                </div>
              ) : (
                <DayTimeline events={sortedSelected} onClose={() => setSelectedDate(null)} />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <Link
                href="/trips"
                onClick={() => setSelectedDate(null)}
                className="block text-center text-sm text-sky-500 hover:text-sky-400 font-medium"
              >
                + Schedule a trip for this day
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Hour-by-hour timeline ─────────────────────────────────────────────────────

const HOUR_HEIGHT = 56  // px per hour
const DAY_START = 4     // 4am
const DAY_END = 21      // 9pm

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number): number {
  return ((minutes - DAY_START * 60) / 60) * HOUR_HEIGHT
}

function DayTimeline({ events, onClose }: { events: TripEvent[]; onClose: () => void }) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
  const totalHeight = hours.length * HOUR_HEIGHT

  // Split: timed events vs untimed
  const timed = events.filter(e => e.start_time)
  const untimed = events.filter(e => !e.start_time)

  return (
    <div>
      {/* Untimed trips at top */}
      {untimed.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 space-y-2">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium px-1">No time set</p>
          {untimed.map(e => (
            <Link key={e.id} href={`/trips/${e.id}`} onClick={onClose}
              className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 hover:bg-slate-100 transition-colors">
              <div>
                <p className="text-sm font-semibold text-slate-900">{e.client_name ?? 'No client'}</p>
                {e.location && <p className="text-xs text-slate-500">{e.location}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.status === 'scheduled' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {e.status === 'scheduled' ? 'Scheduled' : 'Done'}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Hour timeline */}
      <div className="relative" style={{ height: totalHeight }}>
        {/* Hour rows */}
        {hours.map(h => (
          <div key={h} className="absolute w-full flex items-start border-t border-slate-100"
            style={{ top: (h - DAY_START) * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
            <span className="text-xs text-slate-300 w-14 pl-3 pt-1 shrink-0 select-none">
              {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </span>
          </div>
        ))}

        {/* Trip blocks */}
        {timed.map(e => {
          const startMin = timeToMinutes(e.start_time!)
          const endMin = e.end_time ? timeToMinutes(e.end_time) : startMin + 120
          const clampedStart = Math.max(startMin, DAY_START * 60)
          const clampedEnd = Math.min(endMin, DAY_END * 60)
          const top = minutesToPx(clampedStart)
          const height = Math.max(minutesToPx(clampedEnd) - minutesToPx(clampedStart), HOUR_HEIGHT)
          const isScheduled = e.status === 'scheduled'

          return (
            <Link
              key={e.id}
              href={`/trips/${e.id}`}
              onClick={onClose}
              className={`absolute left-14 right-3 rounded-xl px-3 py-2 flex flex-col justify-between overflow-hidden hover:opacity-90 transition-opacity ${isScheduled ? 'bg-sky-500' : 'bg-emerald-500'}`}
              style={{ top, height: Math.max(height, 40) }}
            >
              <div>
                <p className="text-white font-bold text-sm leading-tight truncate">{e.client_name ?? 'No client'}</p>
                {e.time_label && <p className="text-white/80 text-xs truncate">{e.time_label}</p>}
                {e.location && <p className="text-white/70 text-xs truncate">{e.location}</p>}
              </div>
              {height >= HOUR_HEIGHT && e.start_time && (
                <p className="text-white/60 text-xs mt-1">
                  {fmt12(e.start_time)}{e.end_time ? ` – ${fmt12(e.end_time)}` : ''}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
