'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const DONE_KEY = 'gs_tour_done'
const STEP_KEY = 'gs_tour_step'
const STARTED_KEY = 'gs_tour_started'

export const TOUR_STEPS = [
  { path: '/settings',    selector: '[data-tour="packages"]',           title: 'Add Your Trip Packages',   description: 'Start here. Add the packages you offer — Half Day, Full Day, Trophy Trip. These auto-fill your prices every time you schedule a trip.',                                                                                         position: 'bottom' },
  { path: '/settings',    selector: '[data-tour="species"]',            title: 'Species Presets',           description: 'Add the fish species you target most. These become one-tap options when logging catches in Trip Mode — no typing on the water.',                                                                                              position: 'bottom' },
  { path: '/settings',    selector: '[data-tour="lures"]',              title: 'Lure & Bait Presets',       description: 'Save your go-to lures and baits. Quick-select during a live trip so you can log and get back to fishing fast.',                                                                                                               position: 'bottom' },
  { path: '/dashboard',   selector: '[data-tour="dashboard-stats"]',    title: 'Your Stats at a Glance',    description: 'These four cards are your daily snapshot — trips completed this year, trips this month, revenue, and any outstanding balances you still need to collect.',                                                                    position: 'bottom' },
  { path: '/dashboard',   selector: '[data-tour="upcoming-trips"]',     title: 'Upcoming Trips',            description: "Every scheduled trip shows here sorted by date. Tap any trip to view details, start it in Trip Mode when you're on the water, or collect payment when it's done.",                                                           position: 'top'    },
  { path: '/calendar',    selector: '[data-tour="calendar-content"]',   title: 'Trip Calendar',             description: "A full calendar view of every trip you've scheduled. Great for planning around open dates and making sure you're never double-booked.",                                                                                        position: 'bottom' },
  { path: '/trips',       selector: '[data-tour="schedule-tab"]',       title: 'Schedule a Trip',           description: 'Tap the Schedule tab to book a new trip. Add your client, date, location, and package. It lands on the dashboard and calendar automatically.',                                                                               position: 'bottom' },
  { path: '/trips',       selector: '[data-tour="current-trips"]',      title: 'Current Trips',             description: "All your upcoming and active trips live here. Tap one to open it and hit Start Trip when you're heading out — that launches Trip Mode on your phone.",                                                                        position: 'bottom' },
  { path: '/clients',     selector: '[data-tour="clients-content"]',    title: 'Client Management',         description: "Every client's contact info, full trip history, and outstanding balance — always with you. Tap any client to call, email, or view their full record.",                                                                        position: 'bottom' },
  { path: '/analytics',   selector: '[data-tour="analytics-tabs"]',     title: 'Analytics',                 description: 'Switch between Fishing and Financials. Fishing shows avg fish per trip, best day, and top spots. Financials tracks your revenue, collection rate, and year-over-year growth.',                                               position: 'bottom' },
  { path: '/water-flows', selector: '[data-tour="water-flows-content"]',title: 'Water Flows',               description: 'Live USGS river data for any gauge in the US. Search for your local rivers, save favorites, and check conditions before every trip. Never show up to blown-out water again.',                                                position: 'bottom' },
]

interface SpotlightRect { top: number; left: number; width: number; height: number }

function getTooltipStyle(rect: SpotlightRect, position: string, wH: number, wW: number) {
  const PAD    = 12
  const tW     = Math.min(310, wW - PAD * 2)
  const tH     = 240   // generous estimate

  // On narrow screens always anchor to bottom so it's never clipped
  if (wW < 500) {
    return {
      style: { position: 'fixed' as const, bottom: PAD, left: PAD, right: PAD, top: 'auto', width: 'auto', maxWidth: wW - PAD * 2 },
      arrow: null,
    }
  }

  const spaceBelow = wH - rect.top - rect.height
  const spaceAbove = rect.top
  const pos = position === 'top'
    ? (spaceAbove >= tH + PAD ? 'top' : 'bottom')
    : (spaceBelow >= tH + PAD ? 'bottom' : 'top')

  let top  = pos === 'bottom' ? rect.top + rect.height + PAD : rect.top - tH - PAD
  let left = rect.left + rect.width / 2 - tW / 2

  // Clamp so it's always inside the viewport
  top  = Math.max(PAD, Math.min(top,  wH - tH - PAD))
  left = Math.max(PAD, Math.min(left, wW - tW - PAD))

  return {
    style: { position: 'absolute' as const, top, left, width: tW },
    arrow: pos === 'bottom' ? 'top' : 'bottom',
  }
}

function WelcomeCard({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#0f1f35] px-8 pt-10 pb-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight mb-3">Welcome to GuideStride</h2>
          <p className="text-slate-400 text-sm leading-relaxed">Before you dive in, let us show you around. This quick tour highlights the key features and walks you through exactly how the app works — takes about 2 minutes.</p>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={onStart} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors">Show Me Around →</button>
          <button onClick={onSkip} className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium py-2 transition-colors">Skip — I'll figure it out</button>
        </div>
      </div>
    </div>
  )
}

// Exported as default so dynamic() import works
export function SpotlightTour({ onDone }: { onDone: () => void }) {
  const router   = useRouter()
  const pathname = usePathname()
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Safe to read storage synchronously here — this component is always client-only (loaded via dynamic ssr:false)
  const [active,      setActive]      = useState(() => localStorage.getItem(DONE_KEY) !== '1')
  const [showWelcome, setShowWelcome] = useState(() => sessionStorage.getItem(STARTED_KEY) !== '1')
  const [step,        setStep]        = useState(() => parseInt(sessionStorage.getItem(STEP_KEY) ?? '0', 10))
  const [rect,        setRect]        = useState<SpotlightRect | null>(null)
  const [ready,       setReady]       = useState(false)

  const current = TOUR_STEPS[step]
  const isLast  = step === TOUR_STEPS.length - 1

  useEffect(() => { sessionStorage.setItem(STEP_KEY, String(step)) }, [step])

  function finish() {
    localStorage.setItem(DONE_KEY, '1')
    sessionStorage.removeItem(STEP_KEY)
    sessionStorage.removeItem(STARTED_KEY)
    setActive(false)
    onDone()
  }

  const findElement = useCallback((stepIdx: number, currentPath: string) => {
    const s = TOUR_STEPS[stepIdx]
    if (!s) return
    if (s.path !== currentPath) { router.push(s.path); return }
    let tries = 0
    function attempt() {
      const el = document.querySelector(s.selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const r = el.getBoundingClientRect()
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          setReady(true)
        }, 350)
      } else if (tries < 20) {
        tries++
        retryRef.current = setTimeout(attempt, 150)
      }
    }
    setReady(false)
    setRect(null)
    attempt()
  }, [router])

  useEffect(() => {
    if (!active || showWelcome) return
    findElement(step, pathname)
    return () => { if (retryRef.current) clearTimeout(retryRef.current) }
  }, [active, showWelcome, step, pathname, findElement])

  useEffect(() => {
    if (!active || !current) return
    function reposition() {
      const el = document.querySelector(current.selector)
      if (el) { const r = el.getBoundingClientRect(); setRect({ top: r.top, left: r.left, width: r.width, height: r.height }) }
    }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => { window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true) }
  }, [active, current])

  if (!active) return null
  if (showWelcome) return <WelcomeCard onStart={() => { sessionStorage.setItem(STARTED_KEY, '1'); setShowWelcome(false) }} onSkip={finish} />

  const wW = window.innerWidth
  const wH = window.innerHeight
  const PAD = 10
  const hl  = rect ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null

  if (!ready || !rect || !hl) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-xl p-4 pointer-events-auto flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-600 font-medium">Loading...</span>
          <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-600 ml-2">Skip</button>
        </div>
      </div>
    )
  }

  const { style: tooltipStyle, arrow } = getTooltipStyle(hl, current.position ?? 'bottom', wH, wW)

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-auto" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)' }} onClick={finish} />

      {/* Spotlight ring */}
      <div className="absolute pointer-events-none" style={{ top: hl.top, left: hl.left, width: hl.width, height: hl.height, boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px #0ea5e9', borderRadius: 12, zIndex: 51 }} />

      {/* Tooltip — never clips off screen */}
      <div className="bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden" style={{ ...tooltipStyle, zIndex: 52 }} onClick={e => e.stopPropagation()}>
        {arrow === 'top'    && <div className="absolute -top-2    left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />}
        {arrow === 'bottom' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />}

        <div className="h-1 bg-slate-100">
          <div className="h-1 bg-sky-500 transition-all duration-300" style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-500 uppercase tracking-widest">{step + 1} / {TOUR_STEPS.length}</span>
            <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-600">Skip</button>
          </div>
          <h3 className="font-black text-slate-900 text-base leading-tight mb-1.5">{current.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-3">{current.description}</p>
          <div className="flex justify-center gap-1 mb-3">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === step ? 'w-4 h-1.5 bg-sky-500' : 'w-1.5 h-1.5 bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && <button onClick={() => setStep(s => s - 1)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50">Back</button>}
            <button
              onClick={() => { if (isLast) { finish(); router.push('/dashboard') } else setStep(s => s + 1) }}
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl text-sm"
            >
              {isLast ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
