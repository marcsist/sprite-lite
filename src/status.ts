export type StatusVariant = 'Wait' | 'Think' | 'Work' | 'Sync' | 'Ready'

export const STATUS_VARIANTS: readonly StatusVariant[] = [
  'Wait',
  'Think',
  'Work',
  'Sync',
  'Ready',
]

/** Glyph brightness: dim / low / mid / full */
export const LEVEL = { dim: 0, low: 0.3, mid: 0.6, full: 1 } as const

export const DOT_RADIUS_DEFAULT = 0.32
export const DOT_RADIUS_MIN = 0.26
export const DOT_RADIUS_MAX = 0.38
export const SQUARE_INSET = 0.14
export const SQUARE_SIZE = 0.72
export const SQUARE_RX = 0.1

export const STATUS_LABELS: Record<StatusVariant, string> = {
  Wait: 'Waiting',
  Think: 'Thinking',
  Work: 'Working',
  Sync: 'Syncing',
  Ready: 'Ready',
}

export const STATUS_MEANINGS: Record<StatusVariant, string> = {
  Wait: 'waiting',
  Think: 'thinking',
  Work: 'working',
  Sync: 'syncing',
  Ready: 'ready',
}

export const STATUS_DURATION: Record<StatusVariant, number> = {
  Wait: 2400,
  Think: 880,
  Work: 980,
  Sync: 1600,
  Ready: 0,
}

/** Same default as ThinkingSprite `speed`. Lower is faster. */
export const STATUS_SPEED_DEFAULT = 90

/**
 * Resolve the loop length passed to `levelsAt`.
 * An explicit `duration` always wins. Otherwise `speed` (ms/tick, default 90)
 * scales the variant's spec duration, including rests. `undefined` means
 * "use the spec duration" so internal ratios stay intact.
 */
export function resolveStatusDuration(
  variant: StatusVariant,
  duration?: number,
  speed?: number
): number | undefined {
  if (duration != null) return duration
  if (speed == null || speed === STATUS_SPEED_DEFAULT) return undefined
  const base = STATUS_DURATION[variant]
  if (base <= 0) return base
  return base * (speed / STATUS_SPEED_DEFAULT)
}

const D = LEVEL.dim
const L = LEVEL.low
const M = LEVEL.mid
const F = LEVEL.full
const DIM: number[] = [D, D, D, D, D, D, D, D, D]

/**
 * Discrete glyph frames from the spec, row-major a–i.
 * Wait entries are the 400ms reference samples (the live animation is a sine).
 */
export const STATUS_FRAMES: Record<StatusVariant, number[][]> = {
  Wait: [
    [D, D, D, D, D, D, D, D, D],
    [D, D, D, D, L, D, D, D, D],
    [D, D, D, D, M, D, D, D, D],
    [D, D, D, D, F, D, D, D, D],
    [D, D, D, D, M, D, D, D, D],
    [D, D, D, D, L, D, D, D, D],
  ],
  Think: [
    [F, D, D, D, D, D, D, D, D],
    [M, F, D, D, D, D, D, D, D],
    [L, M, F, D, D, D, D, D, D],
    [D, L, M, D, D, F, D, D, D],
    [D, D, L, D, D, M, D, D, F],
    [D, D, D, D, D, L, D, F, M],
    [D, D, D, D, D, D, F, M, L],
    [D, D, D, F, D, D, M, L, D],
  ],
  Work: [
    [D, D, D, F, D, D, D, D, D],
    [D, D, D, M, F, D, D, D, D],
    [D, D, D, L, M, F, D, D, D],
    [D, D, D, D, L, M, D, D, D],
    [D, D, D, D, D, L, D, D, D],
    [D, D, D, D, D, D, D, D, D],
  ],
  Sync: [
    [D, D, D, D, F, D, D, D, D],
    [D, F, D, F, M, F, D, F, D],
    [M, L, M, L, D, L, M, L, M],
    [L, D, L, D, D, D, L, D, L],
    [D, D, D, D, D, D, D, D, D],
  ],
  Ready: [[D, D, D, D, F, D, D, D, D]],
}

/** Frame shown when `active={false}` or `prefers-reduced-motion: reduce`. */
export const RESTING_FRAMES: Record<StatusVariant, number[]> = {
  Wait: [D, D, D, D, M, D, D, D, D],
  Think: [F, M, L, D, D, D, D, D, D],
  Work: [D, D, D, D, F, D, D, D, D],
  Sync: [D, M, D, M, L, M, D, M, D],
  Ready: [D, D, D, D, F, D, D, D, D],
}

type EaseName = 'ease-out' | 'ease-in-out'

interface MotionSpec {
  duration: number
  stepMs: number
  restMs: number
  crossfade: number
  ease: EaseName
  /** Motion frames only; Work/Sync rest is all-dim after these. */
  frames: number[][]
}

const MOTION: Record<'Think' | 'Work' | 'Sync', MotionSpec> = {
  Think: {
    duration: 880,
    stepMs: 110,
    restMs: 0,
    crossfade: 90,
    ease: 'ease-out',
    frames: STATUS_FRAMES.Think,
  },
  Work: {
    duration: 980,
    stepMs: 140,
    restMs: 280,
    crossfade: 100,
    ease: 'ease-out',
    frames: STATUS_FRAMES.Work.slice(0, 5),
  },
  Sync: {
    duration: 1600,
    stepMs: 180,
    restMs: 880,
    crossfade: 140,
    ease: 'ease-in-out',
    frames: STATUS_FRAMES.Sync.slice(0, 4),
  },
}

export function clampDotRadius(radius: number): number {
  return Math.min(DOT_RADIUS_MAX, Math.max(DOT_RADIUS_MIN, radius))
}

export function restingLevels(variant: StatusVariant): number[] {
  return RESTING_FRAMES[variant].slice()
}

/** Center-dot opacity for Wait: 0.15 → 1.0 → 0.15 over one sine period. */
export function waitCenterLevel(elapsedMs: number, duration = STATUS_DURATION.Wait): number {
  const period = duration > 0 ? duration : STATUS_DURATION.Wait
  const t = mod(elapsedMs, period)
  return 0.15 + 0.425 * (1 - Math.cos((2 * Math.PI * t) / period))
}

export function levelsAt(
  variant: StatusVariant,
  elapsedMs: number,
  duration?: number
): number[] {
  if (variant === 'Ready') return restingLevels('Ready')
  if (variant === 'Wait') {
    const levels = DIM.slice()
    levels[4] = waitCenterLevel(elapsedMs, duration ?? STATUS_DURATION.Wait)
    return levels
  }
  return motionLevels(variant, elapsedMs, duration)
}

export function easeOut(t: number): number {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}

export function easeInOut(t: number): number {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/** Snap a 0–1 level to the nearest of the four spec glyphs (ties toward dim). */
export function quantizeLevel(level: number): number {
  const steps = [LEVEL.dim, LEVEL.low, LEVEL.mid, LEVEL.full]
  let best = steps[0]
  let bestDist = Math.abs(level - best)
  for (let i = 1; i < steps.length; i++) {
    const dist = Math.abs(level - steps[i])
    if (dist < bestDist) {
      best = steps[i]
      bestDist = dist
    }
  }
  return best
}

function motionLevels(
  variant: 'Think' | 'Work' | 'Sync',
  elapsedMs: number,
  duration?: number
): number[] {
  const spec = MOTION[variant]
  const loop = duration != null && duration > 0 ? duration : spec.duration
  const scale = loop / spec.duration
  const stepMs = spec.stepMs * scale
  const restMs = spec.restMs * scale
  const fadeMs = spec.crossfade * scale
  const frames = spec.frames
  const n = frames.length
  const motionMs = n * stepMs
  const total = motionMs + restMs
  const t = mod(elapsedMs, total)
  const wrapped = elapsedMs >= total
  const ease = spec.ease === 'ease-in-out' ? easeInOut : easeOut

  if (t < motionMs) {
    const index = Math.min(n - 1, Math.floor(t / stepMs))
    const local = t - index * stepMs
    const curr = frames[index]
    const fade = Math.min(fadeMs, stepMs)
    if (index === 0 && !wrapped) return curr.slice()
    if (local >= fade || fade <= 0) return curr.slice()
    const prev = index === 0 ? restOrLast(frames, restMs) : frames[index - 1]
    return lerpLevels(prev, curr, ease(local / fade))
  }

  const local = t - motionMs
  const curr = DIM
  const prev = frames[n - 1]
  const fade = Math.min(fadeMs, restMs || fadeMs)
  if (local >= fade || fade <= 0) return curr.slice()
  return lerpLevels(prev, curr, ease(local / fade))
}

function restOrLast(frames: number[][], restMs: number): number[] {
  return restMs > 0 ? DIM : frames[frames.length - 1]
}

function lerpLevels(a: number[], b: number[], t: number): number[] {
  const out = new Array<number>(9)
  for (let i = 0; i < 9; i++) out[i] = a[i] + (b[i] - a[i]) * t
  return out
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
