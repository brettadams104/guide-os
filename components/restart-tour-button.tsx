'use client'

import { useState } from 'react'
import { SpotlightTour } from './spotlight-tour'

export function RestartTourButton() {
  const [show, setShow] = useState(false)

  function handleRestart() {
    localStorage.removeItem('gs_tour_done')
    setShow(true)
  }

  return (
    <>
      <button onClick={handleRestart} className="flex items-center gap-2 border border-sky-200 text-sky-600 hover:bg-sky-50 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.44"/>
        </svg>
        Restart App Tour
      </button>
      {show && <SpotlightTour onDone={() => setShow(false)} />}
    </>
  )
}
