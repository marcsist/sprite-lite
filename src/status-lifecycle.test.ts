import { describe, expect, it } from 'vitest'
import {
  LIFECYCLE_STEPS,
  lifecycleHoldMs,
} from './status-lifecycle'

describe('lifecycle sequence', () => {
  it('runs Queued → Thinking → Running tools → Retraining → Ready', () => {
    expect(LIFECYCLE_STEPS.map((step) => step.variant)).toEqual([
      'Wait',
      'Think',
      'Work',
      'Sync',
      'Ready',
    ])
    expect(LIFECYCLE_STEPS.map((step) => step.label)).toEqual([
      'Queued',
      'Thinking',
      'Running tools',
      'Retraining',
      'Ready',
    ])
  })
})

describe('lifecycleHoldMs', () => {
  it('holds each busy state for two of its own loops at default speed', () => {
    expect(lifecycleHoldMs('Wait', 90)).toBe(4800)
    expect(lifecycleHoldMs('Think', 90)).toBe(1760)
    expect(lifecycleHoldMs('Work', 90)).toBe(1960)
    expect(lifecycleHoldMs('Sync', 90)).toBe(3200)
  })

  it('scales busy holds with the speed control', () => {
    expect(lifecycleHoldMs('Wait', 45)).toBe(2400)
    expect(lifecycleHoldMs('Think', 45)).toBe(880)
    expect(lifecycleHoldMs('Work', 180)).toBe(3920)
  })

  it('holds Ready for 2s regardless of speed', () => {
    expect(lifecycleHoldMs('Ready', 90)).toBe(2000)
    expect(lifecycleHoldMs('Ready', 45)).toBe(2000)
  })
})
