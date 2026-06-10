'use client'

import { useSpotlightTour, SpotlightTour } from './spotlight-tour'

export function TourWrapper({ userId }: { userId: string }) {
  const { showTour, closeTour } = useSpotlightTour(userId)
  if (!showTour) return null
  return <SpotlightTour userId={userId} onClose={closeTour} />
}
