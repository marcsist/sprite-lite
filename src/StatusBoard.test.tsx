import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StatusBoard } from './StatusBoard'
import { StatusSetDemo } from './StatusSetDemo'
import { formatSnippet, STATUS_DEFAULTS } from './demo-snippet'
import {
  BOARD_STEPS,
  agentAt,
  boardCycleMs,
  boardHoldMs,
  remainingHoldMs,
} from './status-board'

const LIGHTS = {
  size: 32,
  speed: 90,
  color: ['#ededed', '#3a3a3a'] as [string, string],
  shape: 'dot' as const,
  dotRadius: 0.38,
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') && query.includes('reduce') ? matches : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

function rowsOf(container: HTMLElement) {
  return [...container.querySelectorAll('[data-board-row]')].map((row) => ({
    variant: row.getAttribute('data-board-variant'),
    task: row.getAttribute('data-board-task'),
    status: row.getAttribute('data-board-status'),
  }))
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  mockMatchMedia(false)
})

describe('StatusBoard', () => {
  it('opens on Work, Think and Sync with the starting tasks', () => {
    const { container } = render(<StatusBoard {...LIGHTS} active />)
    expect(rowsOf(container)).toEqual([
      { variant: 'Work', task: 'Fix flaky checkout test', status: 'running tools' },
      { variant: 'Think', task: 'Draft release notes', status: 'thinking' },
      { variant: 'Sync', task: 'Retrain support bot', status: 'syncing' },
    ])
  })

  it('staggers rows so they are not in lockstep', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusBoard {...LIGHTS} active />)
    let elapsed = 0
    const samples: string[][] = []
    const marks = [0, 1600, 2000, 4000, 5160, 7200, 9000, 11000]
    for (const t of marks) {
      act(() => {
        vi.advanceTimersByTime(t - elapsed)
      })
      elapsed = t
      const variants = rowsOf(container).map((row) => row.variant!)
      samples.push(variants)
      expect(new Set(variants).size, `t=${t} ${variants.join(',')}`).toBeGreaterThanOrEqual(2)
      expect(variants).toEqual([0, 1, 2].map((row) => agentAt(row, t).variant))
    }
    expect(samples[0]).not.toEqual(samples[1])
  })

  it('visits all five states over a loop', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusBoard {...LIGHTS} active />)
    const seen = new Set<string>()
    let elapsed = 0
    const cycle = boardCycleMs()
    for (let t = 0; t <= cycle; t += 400) {
      act(() => {
        vi.advanceTimersByTime(t - elapsed)
      })
      elapsed = t
      for (const row of rowsOf(container)) seen.add(row.variant!)
    }
    expect(seen).toEqual(new Set(['Wait', 'Think', 'Work', 'Sync', 'Ready']))
  })

  it('holds done, then picks up the next task at Wait', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusBoard {...LIGHTS} active />)
    const enterReady = remainingHoldMs(0) + boardHoldMs('Sync')
    act(() => {
      vi.advanceTimersByTime(enterReady)
    })
    expect(rowsOf(container)[0]).toMatchObject({
      variant: 'Ready',
      status: 'done',
      task: 'Fix flaky checkout test',
    })
    act(() => {
      vi.advanceTimersByTime(boardHoldMs('Ready') - 1)
    })
    expect(rowsOf(container)[0].variant).toBe('Ready')
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(rowsOf(container)[0]).toMatchObject({
      variant: 'Wait',
      status: 'queued',
      task: 'Triage new bug reports',
    })
  })

  it('freezes on Work / Think / Ready when Active is off', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusBoard {...LIGHTS} active={false} />)
    expect(rowsOf(container)).toEqual([
      { variant: 'Work', task: 'Fix flaky checkout test', status: 'running tools' },
      { variant: 'Think', task: 'Draft release notes', status: 'thinking' },
      { variant: 'Ready', task: 'Retrain support bot', status: 'done' },
    ])
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(rowsOf(container)[2].variant).toBe('Ready')
  })

  it('freezes on Work / Think / Ready when prefers-reduced-motion is set', () => {
    mockMatchMedia(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusBoard {...LIGHTS} active />)
    expect(rowsOf(container)).toEqual([
      { variant: 'Work', task: 'Fix flaky checkout test', status: 'running tools' },
      { variant: 'Think', task: 'Draft release notes', status: 'thinking' },
      { variant: 'Ready', task: 'Retrain support bot', status: 'done' },
    ])
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(rowsOf(container)[0].variant).toBe('Work')
  })

  it('is labelled for assistive tech without a live region or focus target', () => {
    const { container, getByLabelText } = render(<StatusBoard {...LIGHTS} active />)
    const example = getByLabelText('Multi-agent status example')
    expect(example.getAttribute('aria-live')).toBeNull()
    expect(container.querySelector('[aria-live]')).toBeNull()
    expect(example.getAttribute('tabIndex')).toBeNull()
  })
})

describe('status board vs CODE snippet', () => {
  it('does not change the selected StatusSprite snippet', () => {
    const onSelect = vi.fn()
    const { getByLabelText } = render(
      <StatusSetDemo {...LIGHTS} active selected={undefined} onSelect={onSelect} />
    )
    fireEvent.click(getByLabelText('Multi-agent status example'))
    fireEvent.focus(getByLabelText('Multi-agent status example'))
    expect(onSelect).not.toHaveBeenCalled()

    const snippet = formatSnippet(
      'StatusSprite',
      {
        variant: 'Wait',
        size: 32,
        color: LIGHTS.color,
        shape: 'dot',
        speed: 90,
        active: true,
        dotRadius: 0.38,
      },
      STATUS_DEFAULTS
    )
    expect(snippet).toContain('variant="Wait"')
    for (const { label } of BOARD_STEPS) {
      expect(snippet).not.toContain(label)
    }
  })
})
