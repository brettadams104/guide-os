'use client'

import dynamic from 'next/dynamic'

// ssr:false means SpotlightTour only runs on the client — no hydration mismatch,
// no state reset from server re-renders on desktop navigation.
const SpotlightTour = dynamic(
  () => import('./spotlight-tour').then(m => ({ default: m.SpotlightTour })),
  { ssr: false }
)

export function TourWrapper({ userId: _userId }: { userId: string }) {
  return <SpotlightTour onDone={() => {}} />
}
