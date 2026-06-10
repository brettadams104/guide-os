'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    number: 1,
    title: 'Welcome to GuideStride!',
    description: "You're about to run your guide business like a pro. This quick tour will walk you through everything — takes about 2 minutes. Let's go.",
    detail: null,
    path: null,
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    number: 2,
    title: 'Set Up Your Packages',
    description: "First stop — Settings. Add the trip packages you offer like Half Day or Full Day. Once they're saved, your prices auto-fill every time you schedule a trip.",
    detail: 'Settings → Trip Packages',
    path: '/settings',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
  {
    number: 3,
    title: 'Add Species, Lures & Baits',
    description: "Still in Settings — add the fish species you target and the lures or baits you use. These become quick-select presets when you log catches on the water. No typing during a trip.",
    detail: 'Settings → Species Presets & Lure Presets',
    path: '/settings',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M8 6h10v10"/>
      </svg>
    ),
  },
  {
    number: 4,
    title: 'Schedule Your First Trip',
    description: "Head to Trips and hit Schedule. Add your client, date, location, and package. Done. The trip shows up on your dashboard and calendar automatically.",
    detail: 'Trips → Schedule Tab',
    path: '/trips',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    number: 5,
    title: 'Manage Your Clients',
    description: "The Clients page keeps every guide's contact info, full trip history, and outstanding balances in one place. Add a client here or directly when scheduling a trip.",
    detail: 'Clients Page',
    path: '/clients',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    number: 6,
    title: 'Track Your Performance',
    description: "Analytics shows your fishing stats and financials. Average fish per trip, best day of the week, revenue, outstanding balances — everything you need to prove your value to new clients.",
    detail: 'Analytics Page',
    path: '/analytics',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    number: 7,
    title: 'Check Your Water',
    description: "Water Flows pulls live river gauge data from USGS for any river or stream in the US. Save your favorite spots and check conditions before every trip. Never show up to blown-out water again.",
    detail: 'Water Flows Page',
    path: '/water-flows',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12c3-4 6-4 9 0s6 4 9 0"/><path d="M3 6c3-4 6-4 9 0s6 4 9 0"/><path d="M3 18c3-4 6-4 9 0s6 4 9 0"/>
      </svg>
    ),
  },
  {
    number: 8,
    title: "You're All Set!",
    description: "That's the whole platform. Start by scheduling your first real trip — everything else builds from there. You can replay this tour anytime from Settings.",
    detail: null,
    path: '/dashboard',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
]

function getTourKey(userId: string) {
  return `gs_tour_complete_${userId}`
}

export function useOnboardingTour(userId: string) {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const key = getTourKey(userId)
    const done = localStorage.getItem(key)
    if (!done) setShowTour(true)
  }, [userId])

  const completeTour = useCallback(() => {
    localStorage.setItem(getTourKey(userId), '1')
    setShowTour(false)
  }, [userId])

  const restartTour = useCallback(() => {
    localStorage.removeItem(getTourKey(userId))
    setShowTour(true)
  }, [userId])

  return { showTour, completeTour, restartTour }
}

export function OnboardingTour({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  function handleNext() {
    if (isLast) {
      localStorage.setItem(getTourKey(userId), '1')
      if (current.path) router.push(current.path)
      onClose()
      return
    }
    const next = STEPS[step + 1]
    if (next.path) router.push(next.path)
    setStep(s => s + 1)
  }

  function handleBack() {
    const prev = STEPS[step - 1]
    if (prev.path) router.push(prev.path)
    setStep(s => s - 1)
  }

  function handleSkip() {
    localStorage.setItem(getTourKey(userId), '1')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-1.5 bg-sky-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Step counter */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Step {step + 1} of {STEPS.length}
          </p>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            {current.icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-slate-900 mb-3 leading-tight">
            {current.title}
          </h2>

          {/* Description */}
          <p className="text-slate-500 leading-relaxed mb-4">
            {current.description}
          </p>

          {/* Location hint */}
          {current.detail && (
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              {current.detail}
            </div>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${i === step ? 'w-5 h-2 bg-sky-500' : 'w-2 h-2 bg-slate-200'}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 flex gap-3">
          {!isFirst && (
            <button
              onClick={handleBack}
              className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-2xl text-sm hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 bg-[#0ea5e9] hover:bg-sky-400 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
          >
            {isLast ? 'Go to Dashboard' : current.path ? `Take Me There →` : 'Get Started →'}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <div className="text-center pb-5">
            <button onClick={handleSkip} className="text-slate-400 text-xs hover:text-slate-600 transition-colors">
              Skip tour
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
