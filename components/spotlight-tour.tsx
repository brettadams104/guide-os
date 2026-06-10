'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export interface TourStep {
  path: string
  selector: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const TOUR_STEPS: TourStep[] = [
  {
    path: '/settings',
    selector: '[data-tour="packages"]',
    title: 'Add Your Trip Packages',
    description: 'Start here. Add the packages you offer — Half Day, Full Day, Trophy Trip. Once saved, prices auto-fill every time you schedule a trip.',
    position: 'bottom',
  },
  {
    path: '/settings',
    selector: '[data-tour="species"]',
    title: 'Species Presets',
    description: "Add the fish species you target most. These become one-tap options when logging catches during a live trip — no typing on the water.",
    position: 'bottom',
  },
  {
    path: '/settings',
    selector: '[data-tour="lures"]',
    title: 'Lure & Bait Presets',
    description: 'Save your go-to lures and baits here. Same idea — quick select during a trip so you can log and get back to fishing.',
    position: 'bottom',
  },
  {
    path: '/dashboard',
    selector: '[data-tour="dashboard-stats"]',
    title: 'Your Dashboard',
    description: "Your command center. At a glance — trips completed this year, revenue this month, and any outstanding balances you need to collect.",
    position: 'bottom',
  },
  {
    path: '/dashboard',
    selector: '[data-tour="upcoming-trips"]',
    title: 'Upcoming Trips',
    description: "Every trip you've scheduled shows here, grouped by date. Tap any trip to view details, start it in Trip Mode, or collect payment.",
    position: 'top',
  },
  {
    path: '/trips',
    selector: '[data-tour="schedule-tab"]',
    title: 'Schedule a Trip',
    description: "Tap Schedule to book a new trip. Add your client, date, location, and package. It lands on the dashboard and calendar automatically.",
    position: 'bottom',
  },
  {
    path: '/trips',
    selector: '[data-tour="current-trips"]',
    title: 'Current Trips',
    description: "All your active and upcoming trips live here. Tap one to start Trip Mode when you're on the water — log fish, weather, photos, and notes in real time.",
    position: 'bottom',
  },
  {
    path: '/clients',
    selector: '[data-tour="clients-content"]',
    title: 'Client Management',
    description: "Every client's contact info, full trip history, and outstanding balance — all in one place. Tap a client to see their record or call them directly.",
    position: 'bottom',
  },
  {
    path: '/analytics',
    selector: '[data-tour="analytics-tabs"]',
    title: 'Analytics',
    description: "Switch between Fishing and Financials. Fishing shows your catch stats — avg per trip, best day, top spots. Financials tracks revenue, outstanding balances, and year-over-year growth.",
    position: 'bottom',
  },
  {
    path: '/water-flows',
    selector: '[data-tour="water-flows-content"]',
    title: 'Water Flows',
    description: "Live river data from USGS for any gauge in the US. Search for your local rivers, save your favorites, and check conditions before every trip. Never show up to blown-out water again.",
    position: 'bottom',
  },
]

const STORAGE_KEY_PREFIX = 'gs_tour_v2_'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

function getTooltipStyle(rect: SpotlightRect, position: string, windowH: number, windowW: number) {
  const pad = 16
  const tooltipW = 320
  const tooltipH = 180

  // Auto-position based on space available
  const spaceBelow = windowH - rect.top - rect.height
  const spaceAbove = rect.top
  const resolvedPos = position === 'bottom'
    ? (spaceBelow > tooltipH + pad ? 'bottom' : 'top')
    : position === 'top'
    ? (spaceAbove > tooltipH + pad ? 'top' : 'bottom')
    : position

  let top = 0, left = 0

  if (resolvedPos === 'bottom') {
    top = rect.top + rect.height + pad
    left = Math.min(Math.max(rect.left + rect.width / 2 - tooltipW / 2, pad), windowW - tooltipW - pad)
  } else if (resolvedPos === 'top') {
    top = rect.top - tooltipH - pad
    left = Math.min(Math.max(rect.left + rect.width / 2 - tooltipW / 2, pad), windowW - tooltipW - pad)
  } else if (resolvedPos === 'right') {
    top = rect.top + rect.height / 2 - tooltipH / 2
    left = rect.left + rect.width + pad
  } else {
    top = rect.top + rect.height / 2 - tooltipH / 2
    left = rect.left - tooltipW - pad
  }

  const arrowPos = resolvedPos === 'bottom' ? 'top' : resolvedPos === 'top' ? 'bottom' : null

  return { top, left, arrowPos, resolvedPos }
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
          <h2 className="text-2xl font-black text-white leading-tight mb-3">
            Welcome to GuideStride
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Before you dive in, let us show you around. This quick tour highlights the key features and walks you through exactly how the app works — takes about 2 minutes.
          </p>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={onStart}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
          >
            Show Me Around →
          </button>
          <button
            onClick={onSkip}
            className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium py-2 transition-colors"
          >
            Skip — I'll figure it out
          </button>
        </div>
      </div>
    </div>
  )
}

export function SpotlightTour({ userId, onClose }: { userId: string; onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [showWelcome, setShowWelcome] = useState(true)
  const [step, setStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null)
  const [ready, setReady] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  // Find and spotlight the target element
  const activateStep = useCallback((stepIdx: number, currentPath: string) => {
    const s = TOUR_STEPS[stepIdx]
    if (!s) return

    if (s.path !== currentPath) {
      router.push(s.path)
      return
    }

    // Try to find the element, retry a few times to wait for render
    let attempts = 0
    function tryFind() {
      const el = document.querySelector(s.selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const rect = el.getBoundingClientRect()
          setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
          setReady(true)
        }, 300)
      } else if (attempts < 10) {
        attempts++
        retryRef.current = setTimeout(tryFind, 200)
      }
    }
    setReady(false)
    tryFind()
  }, [router])

  useEffect(() => {
    activateStep(step, pathname)
    return () => { if (retryRef.current) clearTimeout(retryRef.current) }
  }, [step, pathname, activateStep])

  // Recalculate on resize
  useEffect(() => {
    function recalc() {
      const el = document.querySelector(current.selector)
      if (el) {
        const rect = el.getBoundingClientRect()
        setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      }
    }
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [current.selector])

  function handleNext() {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY_PREFIX + userId, '1')
      router.push('/dashboard')
      onClose()
      return
    }
    setStep(s => s + 1)
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, '1')
    onClose()
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        onStart={() => setShowWelcome(false)}
        onSkip={() => {
          localStorage.setItem(STORAGE_KEY_PREFIX + userId, '1')
          onClose()
        }}
      />
    )
  }

  const PAD = 10
  const windowW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const windowH = typeof window !== 'undefined' ? window.innerHeight : 800

  if (!ready || !spotlightRect) {
    // Show a small loading indicator while navigating
    return (
      <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-xl p-4 pointer-events-auto flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-600 font-medium">Navigating...</span>
          <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600 ml-2">Skip tour</button>
        </div>
      </div>
    )
  }

  const hl = { top: spotlightRect.top - PAD, left: spotlightRect.left - PAD, width: spotlightRect.width + PAD * 2, height: spotlightRect.height + PAD * 2 }
  const { top: ttTop, left: ttLeft, arrowPos } = getTooltipStyle(hl, current.position ?? 'bottom', windowH, windowW)

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay with hole cut out using clip-path */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{
          background: 'rgba(0,0,0,0)',
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.72)`,
        }}
        onClick={handleSkip}
      />

      {/* Highlighted element border */}
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{
          top: hl.top,
          left: hl.left,
          width: hl.width,
          height: hl.height,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px #0ea5e9',
          borderRadius: 12,
          zIndex: 51,
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl pointer-events-auto"
        style={{ top: ttTop, left: ttLeft, width: 320, zIndex: 52 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Arrow indicator */}
        {arrowPos === 'top' && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-sm" style={{ boxShadow: '-1px -1px 2px rgba(0,0,0,0.08)' }} />
        )}
        {arrowPos === 'bottom' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-sm" style={{ boxShadow: '1px 1px 2px rgba(0,0,0,0.08)' }} />
        )}

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 rounded-t-2xl overflow-hidden">
          <div className="h-1 bg-sky-500 transition-all duration-300" style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>

        <div className="p-5">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-sky-500 uppercase tracking-widest">Step {step + 1} of {TOUR_STEPS.length}</span>
            <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Skip</button>
          </div>

          {/* Title */}
          <h3 className="font-black text-slate-900 text-lg leading-tight mb-2">{current.title}</h3>

          {/* Description */}
          <p className="text-slate-500 text-sm leading-relaxed mb-5">{current.description}</p>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-200 ${i === step ? 'w-4 h-1.5 bg-sky-500' : 'w-1.5 h-1.5 bg-slate-200'}`} />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={handleBack} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Back
              </button>
            )}
            <button onClick={handleNext} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              {isLast ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useSpotlightTour(userId: string) {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY_PREFIX + userId)
    if (!done) setShowTour(true)
  }, [userId])

  const closeTour = useCallback(() => setShowTour(false), [])
  const restartTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + userId)
    setShowTour(true)
  }, [userId])

  return { showTour, closeTour, restartTour }
}
