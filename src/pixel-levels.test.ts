import { describe, expect, it } from 'vitest'
import { LEVEL, composeLevels, DEFAULT_TRAIL_STEPS } from './pixel-levels'

describe('composeLevels', () => {
  it('full mode lights every pixel at full brightness', () => {
    const grid = composeLevels(
      [
        [0, 0],
        [1, 1],
      ],
      { mode: 'full' }
    )
    expect(grid[0]).toBe(LEVEL.full)
    expect(grid[9]).toBe(LEVEL.full)
    expect(grid[1]).toBe(0)
  })

  it('listOrder assigns trail steps by array order', () => {
    const grid = composeLevels(
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      { mode: 'listOrder', steps: DEFAULT_TRAIL_STEPS }
    )
    expect(grid[0]).toBeCloseTo(LEVEL.full)
    expect(grid[1]).toBeCloseTo(LEVEL.mid)
    expect(grid[2]).toBeCloseTo(LEVEL.low)
  })

  it('columnStack fades upward within each column', () => {
    const grid = composeLevels(
      [
        [3, 7],
        [3, 6],
        [3, 5],
      ],
      { mode: 'columnStack', steps: DEFAULT_TRAIL_STEPS }
    )
    expect(grid[7 * 8 + 3]).toBeCloseTo(LEVEL.full)
    expect(grid[6 * 8 + 3]).toBeCloseTo(LEVEL.mid)
    expect(grid[5 * 8 + 3]).toBeCloseTo(LEVEL.low)
  })

  it('radialRing assigns nearer pixels brighter bands', () => {
    const grid = composeLevels(
      [
        [3, 3],
        [4, 3],
        [0, 0],
      ],
      { mode: 'radialRing', steps: DEFAULT_TRAIL_STEPS }
    )
    expect(grid[3 * 8 + 3]).toBeCloseTo(LEVEL.full)
    expect(grid[3 * 8 + 4]).toBeGreaterThan(0)
    expect(grid[0]).toBeCloseTo(LEVEL.low)
  })
})
