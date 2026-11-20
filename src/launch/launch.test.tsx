import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LaunchCast } from './cast'
import { LaunchUsage } from './usage'

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

function sprites(container: HTMLElement) {
  return [...container.querySelectorAll('svg')]
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  mockMatchMedia(false)
})

describe('launch usage', () => {
  it('opens mid-task, with locked sprites and a real ask', () => {
    const { container, getByText } = render(<LaunchUsage />)

    expect(getByText(/Nothing here/)).toBeTruthy()
    expect(getByText(/No invoices yet/)).toBeTruthy()
    expect(container.querySelector('[data-launch="usage"]')?.getAttribute('data-phase')).toBe('work')

    const marks = sprites(container)
    expect(marks.length).toBeGreaterThan(0)
    for (const el of marks) {
      expect(el.getAttribute('role')).toBe('img')
      expect(el.getAttribute('tabindex')).not.toBe('0')
    }

    const thinking = marks.filter((el) => (el.getAttribute('aria-label') ?? '').startsWith('Thinking'))
    expect(thinking.map((el) => el.getAttribute('aria-label'))).toEqual(['Thinking: Face'])
  })
})

describe('launch cast', () => {
  it('is one scene of eight locked characters', () => {
    const { container, getByRole } = render(<LaunchCast />)

    expect(getByRole('heading', { name: /their own hours/i })).toBeTruthy()
    expect(container.querySelector('[data-launch="cast"]')).toBeTruthy()

    const thinking = sprites(container).filter((el) =>
      (el.getAttribute('aria-label') ?? '').startsWith('Thinking')
    )
    expect(thinking.map((el) => el.getAttribute('aria-label'))).toEqual([
      'Thinking: Rain',
      'Thinking: Spark',
      'Thinking: Invader',
      'Thinking: Ghost',
      'Thinking: Tamagotchi',
      'Thinking: Campfire',
      'Thinking: Hourglass',
      'Thinking: Face',
    ])
    for (const el of thinking) {
      expect(el.getAttribute('role')).toBe('img')
      expect(el.getAttribute('tabindex')).toBe('-1')
    }
  })
})
