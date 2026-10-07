import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StatusLifecycle } from './StatusLifecycle'
import { StatusSetDemo } from './StatusSetDemo'
import { formatSnippet, STATUS_DEFAULTS } from './demo-snippet'
import { LIFECYCLE_STEPS, lifecycleHoldMs } from './status-lifecycle'

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

function labelOf(container: HTMLElement) {
  return container.querySelector('[data-lifecycle-label]')?.textContent
}

function variantOf(container: HTMLElement) {
  return container.querySelector('[data-lifecycle]')?.getAttribute('data-lifecycle-variant')
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  mockMatchMedia(false)
})

describe('StatusLifecycle', () => {
  it('advances through the product labels on each hold', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusLifecycle {...LIGHTS} active />)
    expect(labelOf(container)).toBe('Queued')
    expect(variantOf(container)).toBe('Wait')

    act(() => {
      vi.advanceTimersByTime(lifecycleHoldMs('Wait') - 1)
    })
    expect(labelOf(container)).toBe('Queued')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(labelOf(container)).toBe('Thinking')
    expect(variantOf(container)).toBe('Think')

    act(() => {
      vi.advanceTimersByTime(lifecycleHoldMs('Think'))
    })
    expect(labelOf(container)).toBe('Running tools')

    act(() => {
      vi.advanceTimersByTime(lifecycleHoldMs('Work'))
    })
    expect(labelOf(container)).toBe('Retraining')

    act(() => {
      vi.advanceTimersByTime(lifecycleHoldMs('Sync'))
    })
    expect(labelOf(container)).toBe('Ready')
    expect(variantOf(container)).toBe('Ready')

    act(() => {
      vi.advanceTimersByTime(lifecycleHoldMs('Ready'))
    })
    expect(labelOf(container)).toBe('Queued')
    expect(variantOf(container)).toBe('Wait')
  })

  it('scales the first hold when speed changes', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusLifecycle {...LIGHTS} speed={45} active />)
    act(() => {
      vi.advanceTimersByTime(lifecycleHoldMs('Wait', 45) - 1)
    })
    expect(labelOf(container)).toBe('Queued')
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(labelOf(container)).toBe('Thinking')
  })

  it('freezes on Ready when Active is off', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusLifecycle {...LIGHTS} active={false} />)
    expect(labelOf(container)).toBe('Ready')
    expect(variantOf(container)).toBe('Ready')
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(labelOf(container)).toBe('Ready')
  })

  it('freezes on Ready when prefers-reduced-motion is set', () => {
    mockMatchMedia(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusLifecycle {...LIGHTS} active />)
    expect(labelOf(container)).toBe('Ready')
    expect(variantOf(container)).toBe('Ready')
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(labelOf(container)).toBe('Ready')
  })

  it('is labelled for assistive tech without a live region', () => {
    const { container, getByLabelText } = render(<StatusLifecycle {...LIGHTS} active />)
    const example = getByLabelText('Status lifecycle example')
    expect(example.getAttribute('aria-live')).toBeNull()
    expect(container.querySelector('[aria-live]')).toBeNull()
    expect(example.getAttribute('tabIndex')).toBeNull()
  })
})

describe('lifecycle example vs CODE snippet', () => {
  it('does not change the selected StatusSprite snippet', () => {
    const onSelect = vi.fn()
    const { getByLabelText } = render(
      <StatusSetDemo {...LIGHTS} active selected={undefined} onSelect={onSelect} />
    )
    fireEvent.click(getByLabelText('Status lifecycle example'))
    fireEvent.focus(getByLabelText('Status lifecycle example'))
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
    for (const { label } of LIFECYCLE_STEPS) {
      if (label === 'Ready' || label === 'Thinking') continue
      expect(snippet).not.toContain(label)
    }
  })
})
