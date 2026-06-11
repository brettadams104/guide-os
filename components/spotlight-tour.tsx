'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { markOnboardingComplete } from '@/lib/actions/onboarding'

const DONE_KEY  = 'gs_tour_done'
const STEP_KEY  = 'gs_tour_step'

// ── Tour steps ─────────────────────────────────────────────────────────────────

interface TourStep {
  path: string
  selector: string
  page: string
  title: string
  description: string
  action?: string   // programmatic click to run after element is found
}

export const TOUR_STEPS: TourStep[] = [
  {
    path: '/settings',
    selector: '[data-tour="packages"]',
    page: 'Settings',
    title: 'Trip Packages You Offer',
    description: 'Start here before anything else. Add the packages you offer — Half Day, Full Day, Trophy Trip, etc. These auto-fill your pricing every time you schedule a trip so you never have to type it again.',
  },
  {
    path: '/settings',
    selector: '[data-tour="lures"]',
    page: 'Settings',
    title: 'Lures, Flies & Bait Presets',
    description: 'Save your go-to lures, flies, and baits here. When you\'re out on the water in Trip Mode, these show as one-tap buttons when logging a catch — so you can record it fast and get back to fishing.',
  },
  {
    path: '/settings',
    selector: '[data-tour="species"]',
    page: 'Settings',
    title: 'Quick Catch Species',
    description: 'Add the species you typically target on your trips. Just like lures, these appear as one-tap buttons in Trip Mode so logging a catch only takes a second.',
  },
  {
    path: '/dashboard',
    selector: '[data-tour="dashboard-stats"]',
    page: 'Dashboard',
    title: 'Your Daily Snapshot',
    description: 'These four cards are your at-a-glance numbers — trips completed this year, trips this month, revenue collected, and any outstanding balances still owed by clients.',
  },
  {
    path: '/dashboard',
    selector: '[data-tour="upcoming-trips"]',
    page: 'Dashboard',
    title: 'Upcoming Trips',
    description: 'Every trip you\'ve scheduled shows here sorted by date. Tap any trip to view it, start it in Trip Mode when you\'re heading out, or collect payment once it\'s done.',
  },
  {
    path: '/trips',
    selector: '[data-tour="current-trips"]',
    page: 'Trips',
    title: 'Current Trips',
    description: 'All your upcoming and active trips live here. Tap a trip to open it. When you\'re ready to head out, hit Start Trip to launch Trip Mode — your live guide tool on the water.',
  },
  {
    path: '/trips',
    selector: '[data-tour="schedule-tab"]',
    page: 'Trips',
    title: 'Schedule a Trip',
    description: 'Tap the Schedule tab to book a new trip. Add your client, date, location, and package. It will automatically appear on your dashboard and calendar.',
  },
  {
    path: '/clients',
    selector: '[data-tour="clients-content"]',
    page: 'Clients',
    title: 'Client Management',
    description: 'Every client\'s contact info, full trip history, and outstanding balance — all in one place. Tap any client to call, email, or pull up their complete record.',
  },
  {
    path: '/analytics',
    selector: '[data-tour="analytics-tabs"]',
    page: 'Analytics',
    title: 'Fishing Analytics',
    description: 'The Fishing tab breaks down your catch data — species caught, fish per trip, best times of day, top locations, and trends over time. Great data to show potential clients.',
    action: 'tab:fishing',
  },
  {
    path: '/analytics',
    selector: '[data-tour="analytics-tabs"]',
    page: 'Analytics',
    title: 'Financial Analytics',
    description: 'The Financials tab tracks your revenue, collection rate, best month, top clients, and year-over-year growth. Everything you need to understand the business side of guiding.',
    action: 'tab:financials',
  },
  {
    path: '/water-flows',
    selector: '[data-tour="water-flows-content"]',
    page: 'Conditions',
    title: 'Weather Forecast',
    description: 'The Weather tab gives you a full forecast — current conditions, 12-hour hourly view, 7-day forecast, barometric pressure chart, and wind direction arrows. Check this before every trip.',
    action: 'tab:weather',
  },
  {
    path: '/water-flows',
    selector: '[data-tour="water-flows-content"]',
    page: 'Conditions',
    title: 'River Flows',
    description: 'The Flows tab connects to USGS river gauges. Search for your local rivers and save them. Real-time flow and gage height so you never show up to blown-out water.',
    action: 'tab:flows',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number }

function clampTooltip(rect: Rect, wW: number, wH: number) {
  const PAD = 12
  const tW  = Math.min(320, wW - PAD * 2)
  const tH  = 260

  if (wW < 500) {
    return { style: { position: 'fixed' as const, bottom: PAD, left: PAD, right: PAD, top: 'auto', width: 'auto' } }
  }

  const spaceBelow = wH - rect.top - rect.height
  const pos = spaceBelow >= tH + PAD ? 'bottom' : 'top'
  let top  = pos === 'bottom' ? rect.top + rect.height + PAD : rect.top - tH - PAD
  let left = rect.left + rect.width / 2 - tW / 2

  top  = Math.max(PAD, Math.min(top,  wH - tH - PAD))
  left = Math.max(PAD, Math.min(left, wW - tW - PAD))

  return { style: { position: 'absolute' as const, top, left, width: tW } }
}

// ── Welcome card ───────────────────────────────────────────────────────────────

function WelcomeCard({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#0f1f35] px-8 pt-10 pb-8 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight mb-3">Welcome to GuideStride</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Let us walk you through the app so you know exactly where everything is and how it works. This quick tour takes about 2 minutes.
          </p>
          <p className="text-slate-400 text-xs mt-3 leading-relaxed">
            You can always come back to this tour at any time from <span className="text-sky-400 font-medium">Settings → App Tour</span>.
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

// ── Main component ─────────────────────────────────────────────────────────────

export function SpotlightTour({ onDone }: { onDone: () => void }) {
  const router   = useRouter()
  const pathname = usePathname()
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [active,      setActive]      = useState(() => localStorage.getItem(DONE_KEY) !== '1')
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem(STEP_KEY))
  const [step,        setStep]        = useState(() => parseInt(sessionStorage.getItem(STEP_KEY) ?? '0', 10))
  const [rect,        setRect]        = useState<Rect | null>(null)
  const [ready,       setReady]       = useState(false)

  const current = TOUR_STEPS[step]
  const isLast  = step === TOUR_STEPS.length - 1

  // Persist step
  useEffect(() => { sessionStorage.setItem(STEP_KEY, String(step)) }, [step])

  function finish() {
    localStorage.setItem(DONE_KEY, '1')
    sessionStorage.removeItem(STEP_KEY)
    setActive(false)
    onDone()
    markOnboardingComplete()
  }

  const findAndHighlight = useCallback(() => {
    if (retryRef.current) clearTimeout(retryRef.current)
    if (!current) return
    if (current.path !== pathname) {
      router.push(current.path)
      return
    }

    let tries = 0
    function attempt() {
      const el = document.querySelector(current.selector) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Run any tab-switching action BEFORE highlighting
        if (current.action?.startsWith('tab:')) {
          const tabName = current.action.split(':')[1]
          const btn = document.querySelector(`[data-tour-tab="${tabName}"]`) as HTMLElement | null
          if (btn) btn.click()
        }

        setTimeout(() => {
          const r = el.getBoundingClientRect()
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          setReady(true)
        }, 350)
      } else if (tries < 30) {
        tries++
        retryRef.current = setTimeout(attempt, 100)
      }
    }

    setReady(false)
    setRect(null)
    attempt()
    return () => { if (retryRef.current) clearTimeout(retryRef.current) }
  }, [current, pathname, router])

  // Run when step or pathname changes
  useEffect(() => {
    if (!active || showWelcome) return
    return findAndHighlight()
  }, [active, showWelcome, step, pathname, findAndHighlight])

  // Reposition on resize/scroll
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
  if (showWelcome) return (
    <WelcomeCard
      onStart={() => setShowWelcome(false)}
      onSkip={finish}
    />
  )

  const wW  = window.innerWidth
  const wH  = window.innerHeight
  const PAD = 10
  const hl  = rect ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null
  const { style: tooltipStyle } = hl ? clampTooltip(hl, wW, wH) : { style: { position: 'fixed' as const, bottom: 16, left: 16, right: 16, top: 'auto', width: 'auto' } }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Dark overlay — clickable to close */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{ boxShadow: hl ? '0 0 0 9999px rgba(0,0,0,0.65)' : '0 0 0 9999px rgba(0,0,0,0.65)' }}
        onClick={finish}
      />

      {/* Spotlight ring around element */}
      {hl && ready && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: hl.top, left: hl.left, width: hl.width, height: hl.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px #0ea5e9',
            borderRadius: 12,
            zIndex: 1,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
        style={{ ...tooltipStyle, zIndex: 2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div className="h-1 bg-sky-500 transition-all duration-300" style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>

        <div className="p-4">
          {/* Page breadcrumb + step count */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {current.page}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{step + 1} / {TOUR_STEPS.length}</span>
              <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Skip</button>
            </div>
          </div>

          {/* Title & description */}
          <h3 className="font-black text-slate-900 text-base leading-tight mb-1.5">{current.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-3">{current.description}</p>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1 mb-3">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === step ? 'w-4 h-1.5 bg-sky-500' : 'w-1.5 h-1.5 bg-slate-200'}`} />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) { finish(); router.push('/dashboard') }
                else setStep(s => s + 1)
              }}
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {isLast ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
