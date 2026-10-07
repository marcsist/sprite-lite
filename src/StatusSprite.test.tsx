import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StatusSprite } from './StatusSprite'
import { RESTING_FRAMES, SQUARE_INSET, SQUARE_RX, SQUARE_SIZE, type StatusVariant } from './status'

const VARIANTS: StatusVariant[] = ['Wait', 'Think', 'Work', 'Sync', 'Ready']
const LABELS: Record<StatusVariant, string> = {
  Wait: 'Waiting',
  Think: 'Thinking',
  Work: 'Working',
  Sync: 'Syncing',
  Ready: 'Ready',
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

function svg(container: HTMLElement) {
  return container.querySelector('svg') as SVGSVGElement
}

function litOpacities(container: HTMLElement, lit = '#141414'): number[] {
  const nodes = [...svg(container).querySelectorAll('circle, rect')].filter(
    (el) => el.getAttribute('fill') === lit
  )
  return nodes.map((el) => Number(el.getAttribute('fill-opacity')))
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  mockMatchMedia(false)
})

describe('StatusSprite', () => {
  it('is always role=img with default aria-labels', () => {
    for (const variant of VARIANTS) {
      const { container } = render(<StatusSprite variant={variant} />)
      const el = svg(container)
      expect(el.getAttribute('role')).toBe('img')
      expect(el.getAttribute('aria-label')).toBe(LABELS[variant])
      expect(el.getAttribute('tabIndex')).toBeNull()
      cleanup()
    }
  })

  it('uses a custom label when provided', () => {
    const { container } = render(<StatusSprite variant="Sync" label="Retraining model" />)
    expect(svg(container).getAttribute('aria-label')).toBe('Retraining model')
  })

  it('uses viewBox 0 0 3 3 and default size 16', () => {
    const { container } = render(<StatusSprite variant="Ready" />)
    const el = svg(container)
    expect(el.getAttribute('viewBox')).toBe('0 0 3 3')
    expect(el.getAttribute('width')).toBe('16')
    expect(el.getAttribute('height')).toBe('16')
  })

  it('active={false} shows each variant resting frame', () => {
    for (const variant of VARIANTS) {
      const { container } = render(
        <StatusSprite variant={variant} active={false} color={['#141414', '#d6d6d6']} />
      )
      expect(litOpacities(container)).toEqual(RESTING_FRAMES[variant])
      cleanup()
    }
  })

  it('prefers-reduced-motion shows each variant resting frame while active', () => {
    mockMatchMedia(true)
    for (const variant of VARIANTS) {
      const { container } = render(
        <StatusSprite variant={variant} active color={['#141414', '#d6d6d6']} />
      )
      expect(litOpacities(container)).toEqual(RESTING_FRAMES[variant])
      cleanup()
    }
  })

  it('tuple color draws a dim base plus a lit layer', () => {
    const { container } = render(
      <StatusSprite variant="Ready" color={['#141414', '#d6d6d6']} />
    )
    const circles = [...svg(container).querySelectorAll('circle')]
    expect(circles).toHaveLength(18)
    const dim = circles.filter((el) => el.getAttribute('fill') === '#d6d6d6')
    const lit = circles.filter((el) => el.getAttribute('fill') === '#141414')
    expect(dim).toHaveLength(9)
    expect(lit).toHaveLength(9)
    dim.forEach((el) => expect(el.getAttribute('fill-opacity')).toBeNull())
  })

  it('single colour draws only the lit layer', () => {
    const { container } = render(<StatusSprite variant="Ready" color="#ff00aa" />)
    const circles = [...svg(container).querySelectorAll('circle')]
    expect(circles).toHaveLength(9)
    circles.forEach((el) => expect(el.getAttribute('fill')).toBe('#ff00aa'))
  })

  it('omitted colour uses currentColor with no dim base', () => {
    const { container } = render(<StatusSprite variant="Ready" />)
    const circles = [...svg(container).querySelectorAll('circle')]
    expect(circles).toHaveLength(9)
    circles.forEach((el) => expect(el.getAttribute('fill')).toBe('currentColor'))
  })

  it('square geometry is inset, never full-cell', () => {
    const { container } = render(
      <StatusSprite variant="Ready" shape="square" color={['#141414', '#d6d6d6']} />
    )
    const rects = [...svg(container).querySelectorAll('rect')]
    expect(rects.length).toBeGreaterThan(0)
    expect(svg(container).querySelector('circle')).toBeNull()
    for (const rect of rects) {
      const x = Number(rect.getAttribute('x'))
      const y = Number(rect.getAttribute('y'))
      expect(x % 1).toBeCloseTo(SQUARE_INSET, 5)
      expect(y % 1).toBeCloseTo(SQUARE_INSET, 5)
      expect(rect.getAttribute('width')).toBe(String(SQUARE_SIZE))
      expect(rect.getAttribute('height')).toBe(String(SQUARE_SIZE))
      expect(rect.getAttribute('rx')).toBe(String(SQUARE_RX))
      expect(rect.getAttribute('width')).not.toBe('1')
      expect(rect.getAttribute('height')).not.toBe('1')
    }
  })

  it('dot default uses r 0.32 at cell centres', () => {
    const { container } = render(<StatusSprite variant="Ready" />)
    const circles = [...svg(container).querySelectorAll('circle')]
    expect(circles).toHaveLength(9)
    circles.forEach((el, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      expect(Number(el.getAttribute('cx'))).toBeCloseTo(col + 0.5, 5)
      expect(Number(el.getAttribute('cy'))).toBeCloseTo(row + 0.5, 5)
      expect(el.getAttribute('r')).toBe('0.32')
    })
  })

  it('accepts speed without changing the default aria label', () => {
    const { container } = render(<StatusSprite variant="Wait" speed={45} />)
    expect(svg(container).getAttribute('aria-label')).toBe('Waiting')
  })
})
