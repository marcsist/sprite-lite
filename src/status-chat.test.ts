import { describe, expect, it } from 'vitest'
import {
  CHAT_BUSY_STEPS,
  CHAT_FROZEN_STEP,
  CHAT_SPRITE_SIZE,
  chatHoldMs,
} from './status-chat'

describe('chat sequence', () => {
  it('runs Queued → Thinking → Running tools → Retraining', () => {
    expect(CHAT_BUSY_STEPS.map((step) => step.variant)).toEqual([
      'Wait',
      'Think',
      'Work',
      'Sync',
    ])
    expect(CHAT_BUSY_STEPS.map((step) => step.label)).toEqual([
      'Queued',
      'Thinking',
      'Running tools',
      'Retraining',
    ])
  })

  it('freezes on Think', () => {
    expect(CHAT_BUSY_STEPS[CHAT_FROZEN_STEP]).toEqual({
      variant: 'Think',
      label: 'Thinking',
    })
  })

  it('pins the fragment sprite at 20px', () => {
    expect(CHAT_SPRITE_SIZE).toBe(20)
  })
})

describe('chatHoldMs', () => {
  it('holds each busy state for two of its own loops at default speed', () => {
    expect(chatHoldMs('Wait', 90)).toBe(4800)
    expect(chatHoldMs('Think', 90)).toBe(1760)
    expect(chatHoldMs('Work', 90)).toBe(1960)
    expect(chatHoldMs('Sync', 90)).toBe(3200)
  })

  it('scales busy holds with the speed control', () => {
    expect(chatHoldMs('Wait', 45)).toBe(2400)
    expect(chatHoldMs('Think', 45)).toBe(880)
    expect(chatHoldMs('Work', 180)).toBe(3920)
  })

  it('holds Ready for 2s regardless of speed', () => {
    expect(chatHoldMs('Ready', 90)).toBe(2000)
    expect(chatHoldMs('Ready', 45)).toBe(2000)
  })
})
