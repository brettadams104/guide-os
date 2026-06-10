'use client'

import { SpotlightTour } from './spotlight-tour'

// SpotlightTour is always mounted so it never loses step state during navigation.
// It manages its own active/inactive state internally.
export function TourWrapper({ userId: _userId }: { userId: string }) {
  return <SpotlightTour onDone={() => {}} />
}
