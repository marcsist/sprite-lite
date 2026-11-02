import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThinkingSprite } from './ThinkingSprite'
import type { VariantName } from './variants'

afterEach(() => {
  cleanup()
})

function svg(container: HTMLElement) {
  return container.querySelector('svg') as SVGSVGElement
}

describe('ThinkingSprite', () => {
  it('plays EKG when variant is omitted and does not cycle', () => {
    const { container } = render(<ThinkingSprite size={8} />)
    const el = svg(container)

    expect(el.getAttribute('role')).toBe('img')
    expect(el.hasAttribute('tabindex')).toBe(false)
    expect(el.getAttribute('style') ?? '').not.toMatch(/cursor|padding/i)
    expect(el.querySelector('title')?.textContent).toBe('EKG')
    expect(el.getAttribute('aria-label')).toBe('Thinking: EKG')

    fireEvent.click(el)
    fireEvent.keyDown(el, { key: 'Enter' })
    fireEvent.keyDown(el, { key: ' ' })

    expect(el.querySelector('title')?.textContent).toBe('EKG')
    expect(el.getAttribute('role')).toBe('img')
  })

  it('plays the named animation when variant is set', () => {
    const { container } = render(<ThinkingSprite variant="DNA" active={false} />)
    const el = svg(container)
    expect(el.getAttribute('role')).toBe('img')
    expect(el.querySelector('title')?.textContent).toBe('DNA')
    expect(el.getAttribute('aria-label')).toBe('Paused: DNA')
  })

  it('keeps dot shape, radius, and LED colour', () => {
    const { container } = render(
      <ThinkingSprite shape="dot" dotRadius={0.2} color={['#00ff88', '#1a2a1a']} active={false} />
    )
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(64)
    expect(circles[0]?.getAttribute('r')).toBe('0.2')
  })

  it('falls back to EKG for an unknown variant name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<ThinkingSprite variant={'NotAVariant' as VariantName} />)
    expect(svg(container).querySelector('title')?.textContent).toBe('EKG')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
