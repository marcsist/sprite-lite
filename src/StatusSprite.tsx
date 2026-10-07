import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  STATUS_LABELS,
  STATUS_SPEED_DEFAULT,
  clampDotRadius,
  DOT_RADIUS_DEFAULT,
  levelsAt,
  resolveStatusDuration,
  restingLevels,
  SQUARE_INSET,
  SQUARE_RX,
  SQUARE_SIZE,
  type StatusVariant,
} from './status'

export type { StatusVariant }

export interface StatusSpriteProps {
  /** State to render. Required. */
  variant: StatusVariant
  /** Side length in pixels. SVG viewBox stays 3×3. Default: 16 */
  size?: number
  /**
   * Fill color(s) for lit cells.
   * - Single string → lit layer only; no dim base.
   * - Tuple `[lit, dim]` → LED matrix: dim base + lit layer at fill-opacity.
   * - Omitted → `currentColor`.
   */
  color?: string | [string, string]
  /** Pixel shape. Default: 'dot' */
  shape?: 'dot' | 'square'
  /** Dot radius in cell units (clamped 0.26–0.38). Default: 0.32 */
  dotRadius?: number
  /** When false, freeze on the variant's resting frame. Default: true */
  active?: boolean
  /**
   * Milliseconds per animation tick, same feel as ThinkingSprite.
   * Scales the variant's loop (including rests). Lower = faster. Default: 90.
   * Ignored when `duration` is set.
   */
  speed?: number
  /** Milliseconds per loop, including rests. Defaults per variant. Wins over `speed`. */
  duration?: number
  /** aria-label. Defaults: Waiting, Thinking, Working, Syncing, Ready. */
  label?: string
}

const CELLS: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
]

const REDUCE_MQ = '(prefers-reduced-motion: reduce)'

export function StatusSprite({
  variant,
  size = 16,
  color,
  shape = 'dot',
  dotRadius = DOT_RADIUS_DEFAULT,
  active = true,
  speed = STATUS_SPEED_DEFAULT,
  duration,
  label,
}: StatusSpriteProps) {
  const reducedMotion = usePrefersReducedMotion()
  const frozen = !active || reducedMotion || variant === 'Ready'
  const loopDuration = resolveStatusDuration(variant, duration, speed)
  const [levels, setLevels] = useState(() => levelsAt(variant, 0, loopDuration))
  const displayed = frozen ? restingLevels(variant) : levels

  useEffect(() => {
    if (frozen) return
    setLevels(levelsAt(variant, 0, loopDuration))
    let id = 0
    const origin = performance.now()
    const loop = (now: number) => {
      setLevels(levelsAt(variant, now - origin, loopDuration))
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [frozen, variant, loopDuration])

  const isLedMode = Array.isArray(color) && color.length >= 2
  const primaryColor = isLedMode
    ? (color as [string, string])[0]
    : typeof color === 'string'
      ? color
      : 'currentColor'
  const dimColor = isLedMode ? (color as [string, string])[1] : undefined
  const radius = clampDotRadius(dotRadius)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 3 3"
      role="img"
      aria-label={label ?? STATUS_LABELS[variant]}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {CELLS.map(([x, y], i) =>
        shape === 'square' ? (
          <g key={`${x},${y}`}>
            {dimColor !== undefined && (
              <rect
                x={x + SQUARE_INSET}
                y={y + SQUARE_INSET}
                width={SQUARE_SIZE}
                height={SQUARE_SIZE}
                rx={SQUARE_RX}
                fill={dimColor}
              />
            )}
            <rect
              x={x + SQUARE_INSET}
              y={y + SQUARE_INSET}
              width={SQUARE_SIZE}
              height={SQUARE_SIZE}
              rx={SQUARE_RX}
              fill={primaryColor}
              fillOpacity={displayed[i]}
            />
          </g>
        ) : (
          <g key={`${x},${y}`}>
            {dimColor !== undefined && (
              <circle cx={x + 0.5} cy={y + 0.5} r={radius} fill={dimColor} />
            )}
            <circle
              cx={x + 0.5}
              cy={y + 0.5}
              r={radius}
              fill={primaryColor}
              fillOpacity={displayed[i]}
            />
          </g>
        )
      )}
    </svg>
  )
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(REDUCE_MQ).matches
}

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mq = window.matchMedia(REDUCE_MQ)
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }
  mq.addListener(onChange)
  return () => mq.removeListener(onChange)
}
