'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SpotlightTour } from './spotlight-tour'

async function resetOnboardingInDb() {
  await fetch('/api/reset-onboarding', { method: 'POST' })
}

export function RestartTourButton() {
  const router  = useRouter()
  const [show,     setShow]     = useState(false)
  const [resetMsg, setResetMsg] = useState(false)

  async function handleRestart() {
    localStorage.removeItem('gs_tour_done')
    sessionStorage.removeItem('gs_tour_step')
    sessionStorage.removeItem('gs_tour_started')
    await resetOnboardingInDb()
    router.refresh()
    setShow(true)
  }

  async function handleReset() {
    localStorage.removeItem('gs_tour_done')
    sessionStorage.removeItem('gs_tour_step')
    sessionStorage.removeItem('gs_tour_started')
    await resetOnboardingInDb()
    router.refresh()
    setResetMsg(true)
    setTimeout(() => setResetMsg(false), 2500)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={handleRestart} className="flex items-center gap-2 border border-sky-200 text-sky-600 hover:bg-sky-50 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.44"/>
          </svg>
          Restart App Tour
        </button>
        <button onClick={handleReset} className="flex items-center gap-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          {resetMsg ? '✓ Reset — refresh to see tour' : 'Reset Tour (Test)'}
        </button>
      </div>
      {show && <SpotlightTour onDone={() => { setShow(false); router.refresh() }} />}
    </>
  )
}
