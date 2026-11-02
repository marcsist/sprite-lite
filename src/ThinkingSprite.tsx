import { useEffect, useState } from 'react'
import { VARIANTS, type VariantName, type Pixels } from './variants'

function resolveVariant(name: VariantName) {
  const found = VARIANTS.find((v) => v.name === name)
  if (!found) {
    console.warn(`[ThinkingSprite] Unknown variant "${name}". Falling back to EKG.`)
    return VARIANTS[0]
  }
  return found
}

export interface ThinkingSpriteProps {
  /** Side length in pixels. The SVG scales to any size; viewBox stays 8×8. Default: 16 */
  size?: number
  /** Which animation to play. When omitted, plays the first variant (EKG). */
  variant?: VariantName
  /** When false, animation freezes on the current frame at the same opacity. Default: true */
  active?: boolean
  /**
   * Fill color(s) for lit pixels.
   * - Single string → applies to all lit pixels; unlit pixels are not rendered.
   * - Tuple `[primary, dim]` → LED matrix mode: all 64 cells render, dim for unlit, primary for lit.
   * - Omitted → `currentColor` (inherits from CSS).
   */
  color?: string | [string, string]
  /** Milliseconds per animation tick. Lower = faster. Default: 90 */
  speed?: number
  /** Pixel shape. 'dot' renders round circles with lite-brite spacing. Default: 'square' */
  shape?: 'square' | 'dot'
  /** Radius of each dot in SVG units (0–0.5). Only used when shape='dot'. Default: 0.38 */
  dotRadius?: number
}

export function ThinkingSprite({
  size = 16,
  variant,
  active = true,
  color,
  speed = 90,
  shape = 'square',
  dotRadius = 0.38,
}: ThinkingSpriteProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), speed)
    return () => clearInterval(id)
  }, [active, speed])

  const entry = variant === undefined ? VARIANTS[0] : resolveVariant(variant)

  const { name, render } = entry
  const litPixels = render(tick)

  // Flat Uint8Array lookup — avoids per-tick string allocation
  const litMap = new Uint8Array(64)
  for (const [x, y] of litPixels) litMap[y * 8 + x] = 1

  // Color resolution
  const isLedMode = Array.isArray(color) && color.length >= 2
  const primaryColor = isLedMode
    ? (color as [string, string])[0]
    : typeof color === 'string'
      ? color
      : 'currentColor'
  const dimColor = isLedMode ? (color as [string, string])[1] : undefined

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      role="img"
      aria-label={`${active ? 'Thinking' : 'Paused'}: ${name}`}
      style={{
        imageRendering: shape === 'dot' ? undefined : 'pixelated',
        display: 'block',
        flexShrink: 0,
      }}
    >
      <title>{name}</title>
      {isLedMode
        ? ALL_CELLS.map(([x, y]) =>
            shape === 'dot' ? (
              <circle
                key={`${x},${y}`}
                cx={x + 0.5}
                cy={y + 0.5}
                r={dotRadius}
                fill={litMap[y * 8 + x] ? primaryColor : dimColor}
              />
            ) : (
              <rect
                key={`${x},${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={litMap[y * 8 + x] ? primaryColor : dimColor}
              />
            )
          )
        : litPixels.map(([x, y], i) =>
            shape === 'dot' ? (
              <circle key={i} cx={x + 0.5} cy={y + 0.5} r={dotRadius} fill={primaryColor} />
            ) : (
              <rect key={i} x={x} y={y} width={1} height={1} fill={primaryColor} />
            )
          )}
    </svg>
  )
}

// All 64 cells for LED matrix mode
const ALL_CELLS: Pixels = Array.from({ length: 64 }, (_, i) => [i % 8, Math.floor(i / 8)])
