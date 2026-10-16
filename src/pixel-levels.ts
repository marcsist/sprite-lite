import { LEVEL } from './status'
import type { Pixels } from './variants'

export { LEVEL }

export type HalftoneSpec =
  | { mode: 'off' }
  | { mode: 'full' }
  | { mode: 'listOrder'; steps?: readonly number[] }
  | { mode: 'columnStack'; steps?: readonly number[] }
  | { mode: 'radialRing'; center?: readonly [number, number]; steps?: readonly number[] }

export const DEFAULT_TRAIL_STEPS: readonly number[] = [LEVEL.full, LEVEL.mid, LEVEL.low]

const DEFAULT_CENTER: readonly [number, number] = [3.5, 3.5]

export function composeLevels(pixels: Pixels, spec: HalftoneSpec): Float32Array {
  const grid = new Float32Array(64)
  if (spec.mode === 'off' || spec.mode === 'full') {
    for (const [x, y] of pixels) setMax(grid, x, y, LEVEL.full)
    return grid
  }
  switch (spec.mode) {
    case 'listOrder':
      applyListOrder(grid, pixels, spec.steps ?? DEFAULT_TRAIL_STEPS)
      break
    case 'columnStack':
      applyColumnStack(grid, pixels, spec.steps ?? DEFAULT_TRAIL_STEPS)
      break
    case 'radialRing':
      applyRadialRing(grid, pixels, spec.center ?? DEFAULT_CENTER, spec.steps ?? DEFAULT_TRAIL_STEPS)
      break
    default: {
      const _exhaustive: never = spec
      return _exhaustive
    }
  }
  return grid
}

function setMax(grid: Float32Array, x: number, y: number, level: number) {
  if (x < 0 || x > 7 || y < 0 || y > 7) return
  const i = y * 8 + x
  if (level > grid[i]) grid[i] = level
}

function applyListOrder(grid: Float32Array, pixels: Pixels, steps: readonly number[]) {
  for (let i = 0; i < pixels.length; i++) {
    const [x, y] = pixels[i]
    const level = steps[Math.min(i, steps.length - 1)]
    setMax(grid, x, y, level)
  }
}

function applyColumnStack(grid: Float32Array, pixels: Pixels, steps: readonly number[]) {
  const byCol = new Map<number, Array<[number, number]>>()
  for (const [x, y] of pixels) {
    let col = byCol.get(x)
    if (!col) {
      col = []
      byCol.set(x, col)
    }
    col.push([x, y])
  }
  for (const col of byCol.values()) {
    col.sort((a, b) => b[1] - a[1])
    for (let i = 0; i < col.length; i++) {
      const [x, y] = col[i]
      const level = steps[Math.min(i, steps.length - 1)]
      setMax(grid, x, y, level)
    }
  }
}

function applyRadialRing(
  grid: Float32Array,
  pixels: Pixels,
  center: readonly [number, number],
  steps: readonly number[]
) {
  const [cx, cy] = center
  const ranked = pixels.map(([x, y]) => {
    const dx = x + 0.5 - cx
    const dy = y + 0.5 - cy
    return { x, y, d: Math.hypot(dx, dy) }
  })
  ranked.sort((a, b) => a.d - b.d)
  let band = 0
  let lastD = -1
  for (const { x, y, d } of ranked) {
    if (lastD >= 0 && d > lastD + 0.01) band++
    const level = steps[Math.min(band, steps.length - 1)]
    setMax(grid, x, y, level)
    lastD = d
  }
}
