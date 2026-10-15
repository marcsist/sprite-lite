/**
 * Figma export for StatusSprite.
 *
 * Builds SVG frames + a manifest from the live tables in `status.ts`
 * (`STATUS_FRAMES`, `RESTING_FRAMES`, `STATUS_MOTION`, `waitCenterLevel`).
 * Nothing here is hand-copied, so the export cannot drift from the code.
 */
import {
  DOT_RADIUS_DEFAULT,
  RESTING_FRAMES,
  SQUARE_INSET,
  SQUARE_RX,
  SQUARE_SIZE,
  STATUS_DURATION,
  STATUS_FRAMES,
  STATUS_MOTION,
  STATUS_SPEED_DEFAULT,
  STATUS_VARIANTS,
  waitCenterLevel,
  type StatusEaseName,
  type StatusVariant,
} from './status'

/** 8 samples per 2400ms Wait cycle (~300ms apart). Continuous sine, not the 6 glyph snapshots. */
export const WAIT_SAMPLE_COUNT = 8

/** Whole-number 150×150 canvas, 50px cells. 0.32 / 0.14 / 0.72 / 0.1 land on integers. */
export const FIGMA_GRID = {
  canvas: 150,
  cell: 50,
  columns: 3,
  rows: 3,
} as const

export const CELL_IDS = [
  'cell-a',
  'cell-b',
  'cell-c',
  'cell-d',
  'cell-e',
  'cell-f',
  'cell-g',
  'cell-h',
  'cell-i',
] as const

export const FIGMA_SHAPES = ['dot', 'square'] as const
export type FigmaShape = (typeof FIGMA_SHAPES)[number]

export const FIGMA_THEMES = ['light', 'dark'] as const
export type FigmaTheme = (typeof FIGMA_THEMES)[number]

/** Light tuple `['#141414', '#d6d6d6']`; dark `['#ededed', '#3a3a3a']`. Bind to `status/lit` + `status/dim`. */
export const FIGMA_COLORS: Record<FigmaTheme, { lit: string; dim: string }> = {
  light: { lit: '#141414', dim: '#d6d6d6' },
  dark: { lit: '#ededed', dim: '#3a3a3a' },
}

export const FIGMA_GEOMETRY = {
  dot: { r: Math.round(DOT_RADIUS_DEFAULT * FIGMA_GRID.cell) },
  square: {
    inset: Math.round(SQUARE_INSET * FIGMA_GRID.cell),
    size: Math.round(SQUARE_SIZE * FIGMA_GRID.cell),
    rx: Math.round(SQUARE_RX * FIGMA_GRID.cell),
  },
} as const

const STATE_SLUG: Record<StatusVariant, string> = {
  Wait: 'wait',
  Think: 'think',
  Work: 'work',
  Sync: 'sync',
  Ready: 'ready',
}

export interface FigmaFrameSpec {
  id: string
  kind: 'animation' | 'rest'
  levels: number[]
  /** Occupies this many ms in the loop at `STATUS_SPEED_DEFAULT`. Rest frames are static (0). */
  holdMs: number
}

export interface FigmaSmartAnimate {
  durationMs: number
  easing: StatusEaseName | 'none'
  figmaEasing: 'Ease Out' | 'Ease In and Out' | 'Linear' | 'Instant'
  note: string
}

export interface FigmaStateManifest {
  loops: boolean
  loopLengthMs: number
  restingFrame: string
  smartAnimate: FigmaSmartAnimate
  frames: Array<{
    id: string
    holdMs: number
    prototypeDelayMs: number
    levels: number[]
    files: Record<FigmaTheme, Record<FigmaShape, string>>
  }>
  rest: {
    id: string
    levels: number[]
    files: Record<FigmaTheme, Record<FigmaShape, string>>
  }
}

export interface FigmaManifest {
  name: string
  grid: {
    canvas: number
    cell: number
    columns: number
    rows: number
    unit: string
    naming: string
    note: string
  }
  cells: readonly string[]
  cellOrder: string
  geometry: {
    dot: { r: number; fromCellFraction: number }
    square: { inset: number; size: number; rx: number; fromCellFraction: { inset: number; size: number; rx: number } }
  }
  colors: Record<
    FigmaTheme,
    { lit: string; dim: string; figmaVariables: { lit: string; dim: string } }
  >
  speed: {
    default: number
    formula: string
  }
  wait: {
    sampleCount: number
    periodMs: number
    note: string
  }
  layerTree: string
  states: Record<StatusVariant, FigmaStateManifest>
}

export interface FigmaExport {
  files: Map<string, string>
  manifest: FigmaManifest
}

export function waitSampleLevels(index: number): number[] {
  const period = STATUS_DURATION.Wait
  const elapsed = (index * period) / WAIT_SAMPLE_COUNT
  const levels = Array<number>(9).fill(0)
  levels[4] = waitCenterLevel(elapsed, period)
  return levels
}

export function animationFramesFor(variant: StatusVariant): FigmaFrameSpec[] {
  if (variant === 'Wait') {
    const holdMs = STATUS_DURATION.Wait / WAIT_SAMPLE_COUNT
    return Array.from({ length: WAIT_SAMPLE_COUNT }, (_, i) => ({
      id: frameId(i),
      kind: 'animation' as const,
      levels: waitSampleLevels(i),
      holdMs,
    }))
  }
  const table = STATUS_FRAMES[variant]
  const holds = animationHoldsMs(variant)
  return table.map((levels, i) => ({
    id: frameId(i),
    kind: 'animation' as const,
    levels: levels.slice(),
    holdMs: holds[i] ?? 0,
  }))
}

export function restingFrameFor(variant: StatusVariant): FigmaFrameSpec {
  return {
    id: 'rest',
    kind: 'rest',
    levels: RESTING_FRAMES[variant].slice(),
    holdMs: 0,
  }
}

export function animationHoldsMs(
  variant: StatusVariant,
  speed = STATUS_SPEED_DEFAULT
): number[] {
  const scale = speed / STATUS_SPEED_DEFAULT
  if (variant === 'Ready') return [0]
  if (variant === 'Wait') {
    const hold = (STATUS_DURATION.Wait / WAIT_SAMPLE_COUNT) * scale
    return Array.from({ length: WAIT_SAMPLE_COUNT }, () => hold)
  }
  const spec = STATUS_MOTION[variant]
  return STATUS_FRAMES[variant].map((_, i) =>
    (i < spec.frames.length ? spec.stepMs : spec.restMs) * scale
  )
}

export function loopLengthMs(variant: StatusVariant, speed = STATUS_SPEED_DEFAULT): number {
  if (variant === 'Ready') return 0
  return STATUS_DURATION[variant] * (speed / STATUS_SPEED_DEFAULT)
}

export function formatLevel(level: number): string {
  if (level === 0) return '0'
  if (level === 1) return '1'
  const rounded = Math.round(level * 10000) / 10000
  return String(rounded)
}

export function frameFilePath(
  theme: FigmaTheme,
  variant: StatusVariant,
  shape: FigmaShape,
  frameIdValue: string
): string {
  return `${theme}/${STATE_SLUG[variant]}/${shape}/${frameIdValue}.svg`
}

export function renderFrameSvg(
  levels: number[],
  shape: FigmaShape,
  theme: FigmaTheme,
  idPrefix = ''
): string {
  const { canvas, cell } = FIGMA_GRID
  const colors = FIGMA_COLORS[theme]
  const cells = CELL_IDS.map((cellId, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const originX = col * cell
    const originY = row * cell
    const dimId = `${idPrefix}${cellId}-dim`
    const litId = `${idPrefix}${cellId}-lit`
    const groupId = `${idPrefix}${cellId}`
    const opacity = formatLevel(levels[i] ?? 0)
    const shapes =
      shape === 'dot'
        ? renderDot(originX, originY, colors.dim, colors.lit, opacity, dimId, litId)
        : renderSquare(originX, originY, colors.dim, colors.lit, opacity, dimId, litId)
    return `  <g id="${groupId}">\n${shapes}\n  </g>`
  }).join('\n')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}" fill="none">`,
    cells,
    `</svg>`,
    '',
  ].join('\n')
}

function renderDot(
  originX: number,
  originY: number,
  dim: string,
  lit: string,
  opacity: string,
  dimId: string,
  litId: string
): string {
  const r = FIGMA_GEOMETRY.dot.r
  const cx = originX + FIGMA_GRID.cell / 2
  const cy = originY + FIGMA_GRID.cell / 2
  return [
    `    <circle id="${dimId}" cx="${cx}" cy="${cy}" r="${r}" fill="${dim}"/>`,
    `    <circle id="${litId}" cx="${cx}" cy="${cy}" r="${r}" fill="${lit}" opacity="${opacity}"/>`,
  ].join('\n')
}

function renderSquare(
  originX: number,
  originY: number,
  dim: string,
  lit: string,
  opacity: string,
  dimId: string,
  litId: string
): string {
  const { inset, size, rx } = FIGMA_GEOMETRY.square
  const x = originX + inset
  const y = originY + inset
  return [
    `    <rect id="${dimId}" x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${dim}"/>`,
    `    <rect id="${litId}" x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${lit}" opacity="${opacity}"/>`,
  ].join('\n')
}

function smartAnimateFor(variant: StatusVariant): FigmaSmartAnimate {
  if (variant === 'Ready') {
    return {
      durationMs: 0,
      easing: 'none',
      figmaEasing: 'Instant',
      note: 'Ready is a single static frame — no Smart Animate transition.',
    }
  }
  if (variant === 'Wait') {
    return {
      durationMs: STATUS_DURATION.Wait / WAIT_SAMPLE_COUNT,
      easing: 'ease-in-out',
      figmaEasing: 'Ease In and Out',
      note:
        'Wait is a continuous sine in code. With 8 samples, Smart Animate 300ms Ease In and Out and delay 0 between frames approximates the breath.',
    }
  }
  const spec = STATUS_MOTION[variant]
  return {
    durationMs: spec.crossfade,
    easing: spec.ease,
    figmaEasing: spec.ease === 'ease-in-out' ? 'Ease In and Out' : 'Ease Out',
    note: `Matches STATUS_MOTION.${variant}.crossfade (${spec.crossfade}ms) and ease (${spec.ease}). Figma delay = holdMs − crossfade (not less than 0), then Smart Animate for the crossfade.`,
  }
}

function prototypeDelayMs(holdMs: number, fadeMs: number): number {
  if (holdMs <= 0) return 0
  return Math.max(0, holdMs - fadeMs)
}

function filesFor(
  variant: StatusVariant,
  frameIdValue: string
): Record<FigmaTheme, Record<FigmaShape, string>> {
  const out = {} as Record<FigmaTheme, Record<FigmaShape, string>>
  for (const theme of FIGMA_THEMES) {
    out[theme] = {} as Record<FigmaShape, string>
    for (const shape of FIGMA_SHAPES) {
      out[theme][shape] = frameFilePath(theme, variant, shape, frameIdValue)
    }
  }
  return out
}

export function buildManifest(): FigmaManifest {
  const states = {} as Record<StatusVariant, FigmaStateManifest>
  for (const variant of STATUS_VARIANTS) {
    const smart = smartAnimateFor(variant)
    const frames = animationFramesFor(variant)
    const rest = restingFrameFor(variant)
    states[variant] = {
      loops: variant !== 'Ready',
      loopLengthMs: loopLengthMs(variant),
      restingFrame: rest.id,
      smartAnimate: smart,
      frames: frames.map((frame) => ({
        id: frame.id,
        holdMs: frame.holdMs,
        prototypeDelayMs: prototypeDelayMs(frame.holdMs, smart.durationMs),
        levels: frame.levels,
        files: filesFor(variant, frame.id),
      })),
      rest: {
        id: rest.id,
        levels: rest.levels,
        files: filesFor(variant, rest.id),
      },
    }
  }

  return {
    name: 'StatusSprite',
    grid: {
      canvas: FIGMA_GRID.canvas,
      cell: FIGMA_GRID.cell,
      columns: FIGMA_GRID.columns,
      rows: FIGMA_GRID.rows,
      unit: 'px',
      naming: 'Groups cell-a … cell-i (row-major). Children cell-a-dim / cell-a-lit (unique ids; Figma layer names).',
      note: '150×150 viewBox with 50px cells so dot r, square inset/size/rx are whole pixels (16 / 7 / 36 / 5).',
    },
    cells: CELL_IDS,
    cellOrder: 'Row-major a–i, left-to-right, top-to-bottom, matching STATUS_FRAMES.',
    geometry: {
      dot: { r: FIGMA_GEOMETRY.dot.r, fromCellFraction: DOT_RADIUS_DEFAULT },
      square: {
        inset: FIGMA_GEOMETRY.square.inset,
        size: FIGMA_GEOMETRY.square.size,
        rx: FIGMA_GEOMETRY.square.rx,
        fromCellFraction: { inset: SQUARE_INSET, size: SQUARE_SIZE, rx: SQUARE_RX },
      },
    },
    colors: {
      light: {
        ...FIGMA_COLORS.light,
        figmaVariables: { lit: 'status/lit', dim: 'status/dim' },
      },
      dark: {
        ...FIGMA_COLORS.dark,
        figmaVariables: { lit: 'status/lit', dim: 'status/dim' },
      },
    },
    speed: {
      default: STATUS_SPEED_DEFAULT,
      formula:
        'scaledMs = specMs * (speed / 90). Loop length and every frame hold scale the same way. An explicit duration prop replaces the whole loop length and still keeps internal hold/rest ratios.',
    },
    wait: {
      sampleCount: WAIT_SAMPLE_COUNT,
      periodMs: STATUS_DURATION.Wait,
      note: `Wait is a sine (waitCenterLevel), not the 6 glyph snapshots in STATUS_FRAMES.Wait. Exported as ${WAIT_SAMPLE_COUNT} keyframes at t = i * ${STATUS_DURATION.Wait} / ${WAIT_SAMPLE_COUNT}, using the real (unquantized) center brightness.`,
    },
    layerTree:
      '9 groups (cell-a … cell-i), each with dim (LED-off base) then lit (LED-on, opacity = brightness). lit is present even at opacity 0 so every frame has the same tree for Smart Animate.',
    states,
  }
}

export function buildFigmaExport(): FigmaExport {
  const manifest = buildManifest()
  const files = new Map<string, string>()

  for (const variant of STATUS_VARIANTS) {
    const animation = animationFramesFor(variant)
    const rest = restingFrameFor(variant)
    for (const frame of [...animation, rest]) {
      for (const theme of FIGMA_THEMES) {
        for (const shape of FIGMA_SHAPES) {
          const rel = frameFilePath(theme, variant, shape, frame.id)
          files.set(rel, renderFrameSvg(frame.levels, shape, theme))
        }
      }
    }
  }

  files.set('contact-sheet.svg', buildContactSheetSvg())
  files.set('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)
  files.set('README.md', FIGMA_README)

  return { files, manifest }
}

export function buildContactSheetSvg(): string {
  const thumb = 72
  const gap = 12
  const labelW = 168
  const pad = 36
  const headingH = 28
  const stateGap = 28
  const rowH = thumb + 18
  const rowsPerState = FIGMA_THEMES.length * FIGMA_SHAPES.length
  const maxFrames = Math.max(
    ...STATUS_VARIANTS.map((v) => animationFramesFor(v).length + 1)
  )
  const width = pad * 2 + labelW + maxFrames * (thumb + gap)
  const height =
    pad * 2 +
    40 +
    STATUS_VARIANTS.length * (headingH + rowsPerState * rowH + stateGap) -
    stateGap

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`,
    `  <rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `  <text x="${pad}" y="${pad + 8}" fill="#111111" font-family="Inter, Helvetica, Arial, sans-serif" font-size="18">StatusSprite · Figma frames</text>`,
    `  <text x="${pad}" y="${pad + 28}" fill="#666666" font-family="Inter, Helvetica, Arial, sans-serif" font-size="12">150×150 grid, 50px cells · light + dark · dot + square · rest at the end of each row</text>`,
  ]

  let y = pad + 48
  const scale = thumb / FIGMA_GRID.canvas

  for (const variant of STATUS_VARIANTS) {
    const frames = [...animationFramesFor(variant), restingFrameFor(variant)]
    parts.push(
      `  <text x="${pad}" y="${y + 16}" fill="#111111" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14">${escapeXml(variant)}</text>`
    )
    y += headingH

    let row = 0
    for (const theme of FIGMA_THEMES) {
      for (const shape of FIGMA_SHAPES) {
        const rowY = y + row * rowH
        parts.push(
          `  <text x="${pad}" y="${rowY + 40}" fill="#666666" font-family="Inter, Helvetica, Arial, sans-serif" font-size="11">${theme} · ${shape}</text>`
        )
        frames.forEach((frame, fi) => {
          const x = pad + labelW + fi * (thumb + gap)
          const prefix = `${STATE_SLUG[variant]}-${theme}-${shape}-${frame.id}-`
          const inner = renderFrameSvg(frame.levels, shape, theme, prefix)
            .replace(/^<svg[^>]*>/, '')
            .replace(/<\/svg>\s*$/, '')
          parts.push(
            `  <g id="${prefix}thumb" transform="translate(${x} ${rowY}) scale(${scale})">`,
            inner.trimEnd(),
            `  </g>`,
            `  <text x="${x}" y="${rowY + thumb + 12}" fill="#888888" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9">${escapeXml(frame.id)}</text>`
          )
        })
        row += 1
      }
    }
    y += rowsPerState * rowH + stateGap
  }

  parts.push(`</svg>`, '')
  return parts.join('\n')
}

export function buildThinkDotStripSvg(theme: FigmaTheme = 'light'): string {
  const variant: StatusVariant = 'Think'
  const shape: FigmaShape = 'dot'
  const frames = animationFramesFor(variant)
  const gap = 16
  const canvas = FIGMA_GRID.canvas
  const width = frames.length * canvas + (frames.length - 1) * gap
  const height = canvas + 24
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`,
    `  <rect width="${width}" height="${height}" fill="#ffffff"/>`,
  ]
  frames.forEach((frame, i) => {
    const x = i * (canvas + gap)
    const prefix = `think-strip-${frame.id}-`
    const inner = renderFrameSvg(frame.levels, shape, theme, prefix)
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
    parts.push(`  <g transform="translate(${x} 0)">`, inner.trimEnd(), `  </g>`)
  })
  parts.push(`</svg>`, '')
  return parts.join('\n')
}

function frameId(index: number): string {
  return `frame-${String(index + 1).padStart(2, '0')}`
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const FIGMA_README = `# StatusSprite — Figma frames

SVG frames generated from the live \`StatusSprite\` source (\`src/status.ts\`). Do not hand-edit brightness values here; re-run \`npm run export:figma\` after animation changes.

## Grid

- Canvas **150×150**, **50px** cells (3×3).
- Cell groups: \`cell-a\` … \`cell-i\`, row-major (left to right, top to bottom) — the same a–i order as the product brief.
- Inside each cell: \`cell-a-dim\` (LED off) under \`cell-a-lit\` (LED on). \`lit\` stays in the tree even at opacity \`0\`, so Smart Animate always sees the same layer tree.
- Dot: r **16** (0.32 of a cell). Square: inset **7**, size **36**, rx **5** (0.14 / 0.72 / 0.1 of a cell).
- Fills are plain hex. Light \`['#141414', '#d6d6d6']\`, dark \`['#ededed', '#3a3a3a']\`. Bind them to Figma colour variables \`status/lit\` and \`status/dim\`.

## Wait samples

Wait is a continuous sine in code. This export uses **8 keyframes** per 2400ms cycle (300ms apart) at the real \`waitCenterLevel\` values — not the six glyph snapshots in \`STATUS_FRAMES.Wait\`.

## Import

1. In Figma, drag the SVGs from \`light/\` (start here) into the file. Repeat for \`dark/\` if you want a second theme before variables exist.
2. Build a component set with variants:
   - **State:** Wait, Think, Work, Sync, Ready
   - **Frame:** frame-01, frame-02, … and **rest**
   - **Shape:** Dot, Square
3. Keep the layer tree as imported. Matching names across frames is what Smart Animate needs.
4. The published component can hide **Frame** and drive it from a prototype (see below). Resting frames (\`rest.svg\`) are for \`active={false}\` and reduced motion — not part of the loop.

## Prototype delays

\`manifest.json\` lists each animation frame's \`holdMs\` at the default speed **90**, plus \`prototypeDelayMs\` (hold minus the Smart Animate duration).

- **Think:** hold 110ms, Smart Animate **90ms Ease Out**. Delay = 20ms.
- **Work:** motion holds 140ms, rest hold 280ms, Smart Animate **100ms Ease Out**.
- **Sync:** motion holds 180ms, rest hold 880ms, Smart Animate **140ms Ease In and Out**.
- **Wait:** 8 frames × 300ms, Smart Animate **300ms Ease In and Out**, delay 0.
- **Ready:** one static frame; no loop.

Other speeds: \`scaledMs = specMs * (speed / 90)\`. Loop length scales the same way.

Wire After delay → next frame, last frame → first frame (except Ready). Use the \`rest\` variant when Active is off.

## Code Connect

The Figma component set is node \`1:5550\` in [the StatusSprite file](https://www.figma.com/design/kts3xQEzfCxv5CybxtKusi?node-id=1-5550). The mapping lives in \`src/StatusSprite.figma.tsx\` (\`@figma/code-connect@1.5.3\`) and is **not published yet**.

To publish later (Marcs):

\`\`\`bash
FIGMA_ACCESS_TOKEN=<token> npx figma connect publish
\`\`\`

That command pushes snippets into Figma Dev Mode. Do not run it until you mean to. Parse locally without a token: \`npx figma connect parse\`.
`
