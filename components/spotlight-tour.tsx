'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const DONE_KEY = 'gs_tour_done'
const STEP_KEY = 'gs_tour_step'
const STARTED_KEY = 'gs_tour_started'

export const TOUR_STEPS = [
  {
    path: '/settings',
    selector: '[data-tour="packages"]',
    title: 'Add Your Trip Packages',
    description: 'Start here. Add the packages you offer — Half Day, Full Day, Trophy Trip. These auto-fill your prices every time you schedule a trip.',
    position: 'bottom',
  },
  {
    path: '/settings',
    selector: '[data-tour="species"]',
    title: 'Species Presets',
    description: 'Add the fish species you target most. These become one-tap options when logging catches in Trip Mode — no typing on the water.',
    position: 'bottom',
  },
  {
    path: '/settings',
    selector: '[data-tour="lures"]',
    title: 'Lure & Bait Presets',
    description: 'Save your go-to lures and baits. Quick-select during a live trip so you can log and get back to fishing fast.',
    position: 'bottom',
  },
  {
    path: '/dashboard',
    selector: '[data-tour="dashboard-stats"]',
    title: 'Your Stats at a Glance',
    description: 'These four cards are your daily snapshot — trips completed this year, trips this month, revenue, and any outstanding balances you still need to collect.',
    position: 'bottom',
  },
  {
    path: '/dashboard',
    selector: '[data-tour="upcoming-trips"]',
    title: 'Upcoming Trips',
    description: 'Every scheduled trip shows here sorted by date. Tap any trip to view details, start it in Trip Mode when you\'re on the water, or collect payment when it\'s done.',
    position: 'top',
  },
  {
    path: '/calendar',
    selector: '[data-tour="calendar-content"]',
    title: 'Trip Calendar',
    description: 'A full calendar view of every trip you\'ve scheduled. Great for planning around open dates and making sure you\'re never double-booked.',
    position: 'bottom',
  },
  {
    path: '/trips',
    selector: '[data-tour="schedule-tab"]',
    title: 'Schedule a Trip',
    description: 'Tap the Schedule tab to book a new trip. Add your client, date, location, and package. It lands on the dashboard and calendar automatically.',
    position: 'bottom',
  },
  {
    path: '/trips',
    selector: '[data-tour="current-trips"]',
    title: 'Current Trips',
    description: 'All your upcoming and active trips live here. Tap one to open it and hit Start Trip when you\'re heading out — that launches Trip Mode on your phone.',
    position: 'bottom',
  },
  {
    path: '/clients',
    selector: '[data-tour="clients-content"]',
    title: 'Client Management',
    description: 'Every client\'s contact info, full trip history, and outstanding balance — organized and always with you. Tap any client to call, email, or view their record.',
    position: 'bottom',
  },
  {
    path: '/analytics',
    selector: '[data-tour="analytics-tabs"]',
    title: 'Analytics',
    description: 'Switch between Fishing and Financials. Fishing shows avg fish per trip, best day of the week, and top spots. Financials tracks your revenue, collection rate, and year-over-year growth.',
    position: 'bottom',
  },
  {
    path: '/water-flows',
    selector: '[data-tour="water-flows-content"]',
    title: 'Water Flows',
    description: 'Live USGS river flow data for any gauge in the US. Search for your local rivers, save your favorites, and check conditions before every trip. Never show up to blown-out water again.',
    position: 'bottom',
  },
]

interface SpotlightRect { top: number; left: number; width: number; height: number }

function getTooltipPosition(rect: SpotlightRect, position: string, windowH: number, windowW: number) {
  const pad = 16
  const tooltipW = 310
  const tooltipH = 200
  const spaceBelow = windowH - rect.top - rect.height
  const spaceAbove = rect.top
  const pos = position === 'bottom'
    ? (spaceBelow > tooltipH + pad ? 'bottom' : 'top')
    : position === 'top'
    ? (spaceAbove > tooltipH + pad ? 'top' : 'bottom')
    : position
  let top = 0, left = 0
  if (pos === 'bottom') {
    top = rect.top + rect.height + pad
    left = Math.min(Math.max(rect.left + rect.width / 2 - tooltipW / 2, pad), windowW - tooltipW - pad)
  } else {
    top = rect.top - tooltipH - pad
    left = Math.min(Math.max(rect.left + rect.width / 2 - tooltipW / 2, pad), windowW - tooltipW - pad)
  }
  return { top, left, arrowPos: pos === 'bottom' ? 'top' : 'bottom' }
}

function WelcomeScreen({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
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
          <p className="text-slate-400 text-sm leading-relaxed">
            Before you dive in, let us show you around. This quick tour highlights the key features and walks you through exactly how the app works — takes about 2 minutes.
          </p>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={onStart} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors">
            Show Me Around →
          </button>
          <button onClick={onSkip} className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium py-2 transition-colors">
            Skip — I'll figure it out
          </button>
        </div>
      </div>
    </div>
  )
}

export function SpotlightTour({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read step from sessionStorage synchronously — survives page remounts
  const [step, setStep] = useState(() =>
    typeof window !== 'undefined' ? parseInt(sessionStorage.getItem(STEP_KEY) ?? '0', 10) : 0
  )
  const [showWelcome, setShowWelcome] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem(STARTED_KEY) !== '1' : true
  )
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null)
  const [ready, setReady] = useState(false)

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  // Save step whenever it changes
  useEffect(() => { sessionStorage.setItem(STEP_KEY, String(step)) }, [step])

  function finish() {
    sessionStorage.removeItem(STEP_KEY)
    sessionStorage.removeItem(STARTED_KEY)
    localStorage.setItem(DONE_KEY, '1')
    onClose()
  }

  function handleSkip() { finish() }

  function handleNext() {
    if (isLast) { finish(); router.push('/dashboard'); return }
    setStep(s => s + 1)
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  // Find and highlight the target element on this page
  const activateStep = useCallback((stepIdx: number, currentPath: string) => {
    const s = TOUR_STEPS[stepIdx]
    if (!s) return
    if (s.path !== currentPath) { router.push(s.path); return }

    let attempts = 0
    function tryFind() {
      const el = document.querySelector(s.selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const r = el.getBoundingClientRect()
          setSpotlightRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          setReady(true)
        }, 350)
      } else if (attempts < 15) {
        attempts++
        retryRef.current = setTimeout(tryFind, 200)
      }
    }
    setReady(false)
    setSpotlightRect(null)
    tryFind()
  }, [router])

  useEffect(() => {
    if (showWelcome) return
    activateStep(step, pathname)
    return () => { if (retryRef.current) clearTimeout(retryRef.current) }
  }, [step, pathname, showWelcome, activateStep])

  // Recalculate on scroll/resize so spotlight follows the element
  useEffect(() => {
    if (!current || showWelcome) return
    function recalc() {
      const el = document.querySelector(current.selector)
      if (el) {
        const r = el.getBoundingClientRect()
        setSpotlightRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
    }
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc)
    return () => { window.removeEventListener('resize', recalc); window.removeEventListener('scroll', recalc) }
  }, [current, showWelcome])

  if (showWelcome) {
    return (
      <WelcomeScreen
        onStart={() => { sessionStorage.setItem(STARTED_KEY, '1'); setShowWelcome(false) }}
        onSkip={finish}
      />
    )
  }

  const PAD = 10
  const windowW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const windowH = typeof window !== 'undefined' ? window.innerHeight : 800

  if (!ready || !spotlightRect) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-xl p-4 pointer-events-auto flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-600 font-medium">Loading...</span>
          <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600 ml-2">Skip</button>
        </div>
      </div>
    )
  }

  const hl = { top: spotlightRect.top - PAD, left: spotlightRect.left - PAD, width: spotlightRect.width + PAD * 2, height: spotlightRect.height + PAD * 2 }
  const { top: ttTop, left: ttLeft, arrowPos } = getTooltipPosition(hl, current.position ?? 'bottom', windowH, windowW)

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Full overlay — click to skip */}
      <div className="absolute inset-0 pointer-events-auto" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)' }} onClick={handleSkip} />

      {/* Spotlight ring around the element */}
      <div className="absolute pointer-events-none" style={{ top: hl.top, left: hl.left, width: hl.width, height: hl.height, boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px #0ea5e9', borderRadius: 12, zIndex: 51 }} />

      {/* Tooltip */}
      <div className="absolute bg-white rounded-2xl shadow-2xl pointer-events-auto" style={{ top: ttTop, left: ttLeft, width: 310, zIndex: 52 }} onClick={e => e.stopPropagation()}>
        {arrowPos === 'top' && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-sm" />}
        {arrowPos === 'bottom' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-sm" />}

        <div className="h-1 bg-slate-100 rounded-t-2xl overflow-hidden">
          <div className="h-1 bg-sky-500 transition-all duration-300" style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-500 uppercase tracking-widest">{step + 1} / {TOUR_STEPS.length}</span>
            <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600">Skip</button>
          </div>
          <h3 className="font-black text-slate-900 text-base leading-tight mb-1.5">{current.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">{current.description}</p>
          <div className="flex justify-center gap-1 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === step ? 'w-4 h-1.5 bg-sky-500' : 'w-1.5 h-1.5 bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={handleBack} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50">Back</button>
            )}
            <button onClick={handleNext} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl text-sm">
              {isLast ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// TourWrapper — reads localStorage synchronously so it never flashes off on remount
export function useTourVisible(userId: string) {
  const [visible, setVisible] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(DONE_KEY) !== '1' : false
  )
  return { visible, hide: () => setVisible(false) }
}
