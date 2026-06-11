'use client'

import { useState, useRef } from 'react'
import { addGuideEvent } from '@/lib/actions/guide-events'
import { TimeSelect } from './time-select'

export function AddEventModal() {
  const [open,      setOpen]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime,   setEndTime]   = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formRef.current) return
    setLoading(true)
    const fd = new FormData(formRef.current)
    fd.set('start_time', startTime)
    fd.set('end_time', endTime)
    await addGuideEvent(fd)
    formRef.current.reset()
    setStartTime('')
    setEndTime('')
    setLoading(false)
    setOpen(false)
  }

  function handleClose() {
    setOpen(false)
    setStartTime('')
    setEndTime('')
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
  const labelClass = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5'

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sky-500 hover:text-sky-400 text-sm font-medium transition-colors">
        + Add Event
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add Event</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Event Title</label>
                <input name="title" type="text" required placeholder="e.g. Doctor appointment, Meeting" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input name="event_date" type="date" required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start Time</label>
                  <TimeSelect value={startTime} onChange={setStartTime} />
                </div>
                <div>
                  <label className={labelClass}>End Time</label>
                  <TimeSelect value={endTime} onChange={setEndTime} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea name="notes" rows={2} placeholder="Any details..." className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleClose} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                  {loading ? 'Saving…' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
