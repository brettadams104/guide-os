'use client'

import dynamic from 'next/dynamic'

const SpotlightTour = dynamic(
  () => import('./spotlight-tour').then(m => ({ default: m.SpotlightTour })),
  { ssr: false }
)

export function TourWrapper({ userId: _userId, tourComplete }: { userId: string; tourComplete: boolean }) {
  // If Supabase says tour is done, never show it — no localStorage check needed
  if (tourComplete) return null
  return <SpotlightTour onDone={() => {}} />
}
