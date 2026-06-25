'use client'

import dynamic from 'next/dynamic'

const SpotlightTour = dynamic(
  () => import('./spotlight-tour').then(m => ({ default: m.SpotlightTour })),
  { ssr: false }
)

export function TourWrapper({ userId: _userId, tourComplete }: { userId: string; tourComplete: boolean }) {
  // Tour disabled for stability - will rebuild as image-based slideshow later
  return null
}
