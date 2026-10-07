import { describe, expect, it } from 'vitest'
import {
  BOARD_AGENTS,
  BOARD_STEPS,
  agentAt,
  boardCycleMs,
  boardHoldMs,
  frozenAgent,
} from './status-board'

describe('board sequence', () => {
  it('runs Wait → Think → Work → Sync → Ready with the muted status words', () => {
    expect(BOARD_STEPS.map((step) => step.variant)).toEqual([
      'Wait',
      'Think',
      'Work',
      'Sync',
      'Ready',
    ])
    expect(BOARD_STEPS.map((step) => step.label)).toEqual([
      'queued',
      'thinking',
      'running tools',
      'syncing',
      'done',
    ])
  })

  it('starts the three rows on Work, Think and Sync', () => {
    expect(agentAt(0, 0).variant).toBe('Work')
    expect(agentAt(0, 0).task).toBe('Fix flaky checkout test')
    expect(agentAt(1, 0).variant).toBe('Think')
    expect(agentAt(1, 0).task).toBe('Draft release notes')
    expect(agentAt(2, 0).variant).toBe('Sync')
    expect(agentAt(2, 0).task).toBe('Retrain support bot')
  })
})

describe('boardHoldMs', () => {
  it('holds each busy state for two of its own loops at default speed', () => {
    expect(boardHoldMs('Wait', 90)).toBe(4800)
    expect(boardHoldMs('Think', 90)).toBe(1760)
    expect(boardHoldMs('Work', 90)).toBe(1960)
    expect(boardHoldMs('Sync', 90)).toBe(3200)
  })

  it('scales busy holds with the speed control', () => {
    expect(boardHoldMs('Wait', 45)).toBe(2400)
    expect(boardHoldMs('Think', 45)).toBe(880)
    expect(boardHoldMs('Work', 180)).toBe(3920)
  })

  it('holds Ready for 2s regardless of speed', () => {
    expect(boardHoldMs('Ready', 90)).toBe(2000)
    expect(boardHoldMs('Ready', 45)).toBe(2000)
  })
})

describe('board stagger', () => {
  it('keeps rows out of lockstep with at least two distinct states', () => {
    const cycle = boardCycleMs()
    for (let t = 0; t <= cycle; t += 200) {
      const variants = [0, 1, 2].map((row) => agentAt(row, t).variant)
      const distinct = new Set(variants)
      expect(distinct.size, `t=${t} ${variants.join(',')}`).toBeGreaterThanOrEqual(2)
    }
  })

  it('shows all five states over a full loop', () => {
    const seen = new Set<string>()
    const cycle = boardCycleMs()
    for (let t = 0; t <= cycle; t += 100) {
      for (const row of [0, 1, 2]) seen.add(agentAt(row, t).variant)
    }
    expect([...seen].sort()).toEqual(['Ready', 'Sync', 'Think', 'Wait', 'Work'].sort())
  })
})

describe('done hold then next task', () => {
  it('holds done, then starts the next task at Wait', () => {
    const workHold = boardHoldMs('Work')
    const syncHold = boardHoldMs('Sync')
    const readyHold = boardHoldMs('Ready')
    const enterReady = workHold + syncHold
    const stillDone = agentAt(0, enterReady)
    expect(stillDone.variant).toBe('Ready')
    expect(stillDone.label).toBe('done')
    expect(stillDone.task).toBe(BOARD_AGENTS[0].pool[0])

    const lastDone = agentAt(0, enterReady + readyHold - 1)
    expect(lastDone.variant).toBe('Ready')
    expect(lastDone.task).toBe(BOARD_AGENTS[0].pool[0])

    const next = agentAt(0, enterReady + readyHold)
    expect(next.variant).toBe('Wait')
    expect(next.label).toBe('queued')
    expect(next.task).toBe(BOARD_AGENTS[0].pool[1])
  })
})

describe('frozen frame', () => {
  it('is Work / Think / Ready with the opening tasks', () => {
    expect(frozenAgent(0)).toEqual({
      variant: 'Work',
      label: 'running tools',
      task: 'Fix flaky checkout test',
    })
    expect(frozenAgent(1)).toEqual({
      variant: 'Think',
      label: 'thinking',
      task: 'Draft release notes',
    })
    expect(frozenAgent(2)).toEqual({
      variant: 'Ready',
      label: 'done',
      task: 'Retrain support bot',
    })
  })
})
