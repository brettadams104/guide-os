'use client'

import { SpotlightTour, useTourVisible } from './spotlight-tour'

export function TourWrapper({ userId }: { userId: string }) {
  const { visible, hide } = useTourVisible(userId)
  if (!visible) return null
  return <SpotlightTour onClose={hide} />
}
