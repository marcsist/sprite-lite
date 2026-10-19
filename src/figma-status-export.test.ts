import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  animationFramesFor,
  animationHoldsMs,
  buildFigmaExport,
  CELL_IDS,
  FIGMA_GEOMETRY,
  FIGMA_GRID,
  FIGMA_SHAPES,
  FIGMA_THEMES,
  formatLevel,
  frameFilePath,
  loopLengthMs,
  renderFrameSvg,
  restingFrameFor,
  WAIT_SAMPLE_COUNT,
  waitSampleLevels,
} from './figma-status-export'
import {
  RESTING_FRAMES,
  STATUS_DURATION,
  STATUS_FRAMES,
  STATUS_MOTION,
  STATUS_SPEED_DEFAULT,
  STATUS_VARIANTS,
  waitCenterLevel,
  type StatusVariant,
} from './status'

const FIGMA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'figma', 'status-sprite')

function listFiles(dir: string, prefix = ''): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir).sort()) {
    const rel = prefix ? `${prefix}/${name}` : name
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...listFiles(path, rel))
    else out.push(rel)
  }
  return out
}

function parseGroups(svg: string): Array<{ id: string; inner: string }> {
  const groups: Array<{ id: string; inner: string }> = []
  const re = /<g id="([^"]+)">([\s\S]*?)<\/g>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(svg))) {
    groups.push({ id: match[1], inner: match[2] })
  }
  return groups
}

function expectLayerTree(svg: string) {
  expect(svg).not.toMatch(/<style[\s>]/i)
  expect(svg).not.toMatch(/<mask[\s>]/i)
  expect(svg).not.toMatch(/<filter[\s>]/i)
  expect(svg).not.toMatch(/<defs[\s>]/i)

  const groups = parseGroups(svg).filter((g) => CELL_IDS.includes(g.id as (typeof CELL_IDS)[number]))
  expect(groups.map((g) => g.id)).toEqual([...CELL_IDS])

  for (const cell of CELL_IDS) {
    const group = groups.find((g) => g.id === cell)
    expect(group, cell).toBeTruthy()
    expect(group!.inner).toContain(`id="${cell}-dim"`)
    expect(group!.inner).toContain(`id="${cell}-lit"`)
    const dimAt = group!.inner.indexOf(`id="${cell}-dim"`)
    const litAt = group!.inner.indexOf(`id="${cell}-lit"`)
    expect(dimAt).toBeGreaterThanOrEqual(0)
    expect(litAt).toBeGreaterThan(dimAt)
  }
}

describe('figma export data matches source tables', () => {
  it('samples Wait 8 times from waitCenterLevel, not STATUS_FRAMES.Wait', () => {
    expect(WAIT_SAMPLE_COUNT).toBe(8)
    const frames = animationFramesFor('Wait')
    expect(frames).toHaveLength(8)
    expect(frames.map((f) => f.id)).toEqual([
      'frame-01',
      'frame-02',
      'frame-03',
      'frame-04',
      'frame-05',
      'frame-06',
      'frame-07',
      'frame-08',
    ])
    frames.forEach((frame, i) => {
      const expected = waitSampleLevels(i)
      expect(expected[4]).toBe(waitCenterLevel((i * STATUS_DURATION.Wait) / WAIT_SAMPLE_COUNT))
      expect(frame.levels).toEqual(expected)
      expect(frame.levels.filter((_, c) => c !== 4).every((v) => v === 0)).toBe(true)
    })
    expect(frames[0].levels).not.toEqual(STATUS_FRAMES.Wait[0])
    expect(frames[4].levels[4]).toBeCloseTo(1, 5)
  })

  it('uses STATUS_FRAMES for Think, Work, Sync, and Ready', () => {
    for (const variant of ['Think', 'Work', 'Sync', 'Ready'] as StatusVariant[]) {
      const frames = animationFramesFor(variant)
      expect(frames.map((f) => f.levels)).toEqual(STATUS_FRAMES[variant])
    }
  })

  it('uses RESTING_FRAMES for every rest.svg', () => {
    for (const variant of STATUS_VARIANTS) {
      expect(restingFrameFor(variant).levels).toEqual(RESTING_FRAMES[variant])
      expect(restingFrameFor(variant).id).toBe('rest')
    }
  })

  it('hold times come from STATUS_MOTION / STATUS_DURATION at speed 90', () => {
    expect(animationHoldsMs('Think')).toEqual(Array(8).fill(STATUS_MOTION.Think.stepMs))
    expect(animationHoldsMs('Work')).toEqual([
      ...Array(STATUS_MOTION.Work.frames.length).fill(STATUS_MOTION.Work.stepMs),
      STATUS_MOTION.Work.restMs,
    ])
    expect(animationHoldsMs('Sync')).toEqual([
      ...Array(STATUS_MOTION.Sync.frames.length).fill(STATUS_MOTION.Sync.stepMs),
      STATUS_MOTION.Sync.restMs,
    ])
    expect(animationHoldsMs('Wait')).toEqual(Array(8).fill(STATUS_DURATION.Wait / 8))
    expect(animationHoldsMs('Ready')).toEqual([0])

    for (const variant of STATUS_VARIANTS) {
      const sum = animationHoldsMs(variant).reduce((a, b) => a + b, 0)
      expect(sum).toBe(STATUS_DURATION[variant])
      expect(loopLengthMs(variant)).toBe(STATUS_DURATION[variant])
      expect(loopLengthMs(variant, 45)).toBe(STATUS_DURATION[variant] * (45 / STATUS_SPEED_DEFAULT))
    }
  })

  it('manifest brightness and paths match the generator', () => {
    const { manifest } = buildFigmaExport()
    for (const variant of STATUS_VARIANTS) {
      const state = manifest.states[variant]
      const frames = animationFramesFor(variant)
      expect(state.frames.map((f) => f.levels)).toEqual(frames.map((f) => f.levels))
      expect(state.rest.levels).toEqual(RESTING_FRAMES[variant])
      expect(state.restingFrame).toBe('rest')
      expect(state.loops).toBe(variant !== 'Ready')
      expect(state.loopLengthMs).toBe(STATUS_DURATION[variant])
      for (const frame of state.frames) {
        for (const theme of FIGMA_THEMES) {
          for (const shape of FIGMA_SHAPES) {
            expect(frame.files[theme][shape]).toBe(
              frameFilePath(theme, variant, shape, frame.id)
            )
          }
        }
      }
    }
    expect(manifest.wait.sampleCount).toBe(8)
    expect(manifest.grid.canvas).toBe(150)
    expect(manifest.grid.cell).toBe(50)
    expect(manifest.cells).toEqual([...CELL_IDS])
  })
})

describe('figma SVG layer tree', () => {
  it('every frame SVG has the same 9×(dim+lit) structure and integer geometry', () => {
    const { files } = buildFigmaExport()
    let frameSvgCount = 0
    for (const [rel, svg] of files) {
      if (!rel.endsWith('.svg') || rel === 'contact-sheet.svg') continue
      frameSvgCount += 1
      expectLayerTree(svg)
      expect(svg).toContain(`width="${FIGMA_GRID.canvas}"`)
      expect(svg).toContain(`viewBox="0 0 ${FIGMA_GRID.canvas} ${FIGMA_GRID.canvas}"`)
      if (rel.includes('/dot/')) {
        expect(svg).toContain(`r="${FIGMA_GEOMETRY.dot.r}"`)
      } else {
        expect(svg).toContain(`width="${FIGMA_GEOMETRY.square.size}"`)
        expect(svg).toContain(`rx="${FIGMA_GEOMETRY.square.rx}"`)
      }
      // integer attributes only — no fractional coordinates
      expect(svg).not.toMatch(/\b(cx|cy|x|y|r|width|height|rx)="[-+]?\d+\.\d+"/)
    }
    // 5 states × (Wait 8+1, Think 8+1, Work 6+1, Sync 5+1, Ready 1+1) × 2 shapes × 2 themes
    expect(frameSvgCount).toBe((9 + 9 + 7 + 6 + 2) * 2 * 2)
  })

  it('keeps the lit layer at opacity 0', () => {
    const svg = renderFrameSvg(Array(9).fill(0), 'dot', 'light')
    expect(svg).toContain(`id="cell-e-lit"`)
    expect(svg).toContain(`opacity="${formatLevel(0)}"`)
    expect((svg.match(/id="cell-[a-i]-lit"/g) ?? []).length).toBe(9)
  })

  it('uses real Wait brightness on the lit layer', () => {
    const levels = waitSampleLevels(0)
    const svg = renderFrameSvg(levels, 'dot', 'light')
    expect(svg).toContain(`id="cell-e-lit"`)
    expect(svg).toContain(`opacity="${formatLevel(levels[4])}"`)
    expect(levels[4]).toBeCloseTo(0.15, 5)
  })
})

describe('committed figma/status-sprite output', () => {
  it('matches the generator byte-for-byte', () => {
    const { files } = buildFigmaExport()
    const disk = listFiles(FIGMA_DIR)
    expect(disk.sort()).toEqual([...files.keys()].sort())
    for (const [rel, contents] of files) {
      expect(readFileSync(join(FIGMA_DIR, rel), 'utf8'), rel).toBe(contents)
    }
  })
})
