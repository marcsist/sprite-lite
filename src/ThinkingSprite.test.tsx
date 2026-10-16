import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ThinkingSprite } from './ThinkingSprite'
import { LEVEL } from './status'

afterEach(() => cleanup)

function primaryOpacities(container: HTMLElement, primary = '#00ff88'): number[] {
  const svg = container.querySelector('svg')!
  return [...svg.querySelectorAll('circle, rect')]
    .filter((el) => el.getAttribute('fill') === primary)
    .map((el) => Number(el.getAttribute('fill-opacity') ?? '1'))
}

describe('ThinkingSprite half-tones', () => {
  it('uses fill-opacity on trail pixels in LED mode', () => {
    const { container } = render(
      <ThinkingSprite
        variant="Snake"
        active={false}
        color={['#00ff88', '#1a2a1a']}
        shape="dot"
      />
    )
    const opacities = primaryOpacities(container)
    expect(opacities.length).toBeGreaterThanOrEqual(3)
    expect(opacities.some((o) => Math.abs(o - LEVEL.full) < 0.001)).toBe(true)
    expect(opacities.some((o) => Math.abs(o - LEVEL.mid) < 0.001)).toBe(true)
    expect(opacities.some((o) => Math.abs(o - LEVEL.low) < 0.001)).toBe(true)
  })

  it('does not add fill-opacity in single-colour mode', () => {
    const { container } = render(
      <ThinkingSprite variant="Snake" active={false} color="#00ff88" shape="dot" />
    )
    const svg = container.querySelector('svg')!
    const lit = [...svg.querySelectorAll('circle')].filter(
      (el) => el.getAttribute('fill') === '#00ff88'
    )
    expect(lit.length).toBeGreaterThan(0)
    lit.forEach((el) => expect(el.getAttribute('fill-opacity')).toBeNull())
  })
})
