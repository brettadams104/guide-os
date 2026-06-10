'use client'

import { useOnboardingTour, OnboardingTour } from './onboarding-tour'

export function TourWrapper({ userId }: { userId: string }) {
  const { showTour, completeTour } = useOnboardingTour(userId)
  if (!showTour) return null
  return <OnboardingTour userId={userId} onClose={completeTour} />
}
