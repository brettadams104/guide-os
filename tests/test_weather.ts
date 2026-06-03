import { describe, it, expect } from 'vitest'
import { getMoonPhase, getPressureTrend } from '@/lib/weather'

describe('getMoonPhase', () => {
  it('returns a non-empty string for any date', () => {
    const phase = getMoonPhase(new Date('2024-01-01'))
    expect(typeof phase).toBe('string')
    expect(phase.length).toBeGreaterThan(0)
  })

  it('identifies full moon correctly', () => {
    // Jan 25, 2024 was a full moon
    const phase = getMoonPhase(new Date('2024-01-25'))
    expect(phase.toLowerCase()).toContain('full')
  })
})

describe('getPressureTrend', () => {
  it('returns rising when current is higher', () => {
    expect(getPressureTrend(1020, 1015)).toBe('rising')
  })
  it('returns falling when current is lower', () => {
    expect(getPressureTrend(1010, 1018)).toBe('falling')
  })
  it('returns steady when close', () => {
    expect(getPressureTrend(1015, 1015.5)).toBe('steady')
  })
})
