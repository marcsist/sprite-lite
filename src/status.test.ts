import { describe, expect, it } from 'vitest'
import {
  LEVEL,
  RESTING_FRAMES,
  STATUS_DURATION,
  STATUS_FRAMES,
  STATUS_LABELS,
  STATUS_SPEED_DEFAULT,
  clampDotRadius,
  levelsAt,
  quantizeLevel,
  resolveStatusDuration,
  restingLevels,
  waitCenterLevel,
  type StatusVariant,
} from './status'

const GLYPH: Record<string, number> = {
  '·': 0,
  '-': 0.3,
  '+': 0.6,
  '#': 1,
}

function parse(rows: [string, string, string]): number[] {
  const out: number[] = []
  for (const row of rows) {
    for (const token of row.trim().split(/\s+/)) {
      out.push(GLYPH[token] ?? 0)
    }
  }
  expect(out).toHaveLength(9)
  return out
}

function expectLevels(actual: number[], expected: number[], precision = 5) {
  expect(actual).toHaveLength(9)
  for (let i = 0; i < 9; i++) {
    expect(actual[i], `cell ${i}`).toBeCloseTo(expected[i], precision)
  }
}

const SPEC_FRAMES: Record<StatusVariant, Array<[string, string, string]>> = {
  Wait: [
    ['· · ·', '· · ·', '· · ·'],
    ['· · ·', '· - ·', '· · ·'],
    ['· · ·', '· + ·', '· · ·'],
    ['· · ·', '· # ·', '· · ·'],
    ['· · ·', '· + ·', '· · ·'],
    ['· · ·', '· - ·', '· · ·'],
  ],
  Think: [
    ['# · ·', '· · ·', '· · ·'],
    ['+ # ·', '· · ·', '· · ·'],
    ['- + #', '· · ·', '· · ·'],
    ['· - +', '· · #', '· · ·'],
    ['· · -', '· · +', '· · #'],
    ['· · ·', '· · -', '· # +'],
    ['· · ·', '· · ·', '# + -'],
    ['· · ·', '# · ·', '+ - ·'],
  ],
  Work: [
    ['· · ·', '# · ·', '· · ·'],
    ['· · ·', '+ # ·', '· · ·'],
    ['· · ·', '- + #', '· · ·'],
    ['· · ·', '· - +', '· · ·'],
    ['· · ·', '· · -', '· · ·'],
    ['· · ·', '· · ·', '· · ·'],
  ],
  Sync: [
    ['· · ·', '· # ·', '· · ·'],
    ['· # ·', '# + #', '· # ·'],
    ['+ - +', '- · -', '+ - +'],
    ['- · -', '· · ·', '- · -'],
    ['· · ·', '· · ·', '· · ·'],
  ],
  Ready: [['· · ·', '· # ·', '· · ·']],
}

const SPEC_RESTING: Record<StatusVariant, [string, string, string]> = {
  Wait: ['· · ·', '· + ·', '· · ·'],
  Think: ['# + -', '· · ·', '· · ·'],
  Work: ['· · ·', '· # ·', '· · ·'],
  Sync: ['· + ·', '+ - +', '· + ·'],
  Ready: ['· · ·', '· # ·', '· · ·'],
}

describe('frame tables', () => {
  it('encodes every spec glyph frame', () => {
    for (const variant of Object.keys(SPEC_FRAMES) as StatusVariant[]) {
      const spec = SPEC_FRAMES[variant].map(parse)
      expect(STATUS_FRAMES[variant]).toHaveLength(spec.length)
      spec.forEach((frame, i) => {
        expectLevels(STATUS_FRAMES[variant][i], frame)
      })
    }
  })

  it('Think holds each orbit frame after the 90ms ease-out', () => {
    SPEC_FRAMES.Think.forEach((rows, i) => {
      const t = i === 0 ? 0 : i * 110 + 90
      expectLevels(levelsAt('Think', t), parse(rows))
    })
  })

  it('Work holds each pass frame after the 100ms ease-out, then rests dim', () => {
    SPEC_FRAMES.Work.slice(0, 5).forEach((rows, i) => {
      const t = i === 0 ? 0 : i * 140 + 100
      expectLevels(levelsAt('Work', t), parse(rows))
    })
    expectLevels(levelsAt('Work', 800), parse(SPEC_FRAMES.Work[5]))
    expectLevels(levelsAt('Work', 979), parse(SPEC_FRAMES.Work[5]))
  })

  it('Sync holds each ripple frame after the 140ms ease-in-out, then rests dim', () => {
    SPEC_FRAMES.Sync.slice(0, 4).forEach((rows, i) => {
      const t = i === 0 ? 0 : i * 180 + 140
      expectLevels(levelsAt('Sync', t), parse(rows))
    })
    expectLevels(levelsAt('Sync', 860), parse(SPEC_FRAMES.Sync[4]))
    expectLevels(levelsAt('Sync', 1599), parse(SPEC_FRAMES.Sync[4]))
  })

  it('Wait samples the sine every 400ms as the spec glyphs', () => {
    SPEC_FRAMES.Wait.forEach((rows, i) => {
      const sampled = levelsAt('Wait', i * 400).map(quantizeLevel)
      expectLevels(sampled, parse(rows), 10)
    })
  })

  it('Wait is a continuous sine on the center only, 0.15 → 1 → 0.15', () => {
    expect(waitCenterLevel(0)).toBeCloseTo(0.15, 5)
    expect(waitCenterLevel(1200)).toBeCloseTo(1, 5)
    expect(waitCenterLevel(2400)).toBeCloseTo(0.15, 5)
    expect(waitCenterLevel(3600)).toBeCloseTo(1, 5)
    const at0 = levelsAt('Wait', 0)
    expect(at0[4]).toBeCloseTo(0.15, 5)
    at0.forEach((level, i) => {
      if (i !== 4) expect(level).toBe(0)
    })
  })

  it('Ready is static full center', () => {
    expectLevels(levelsAt('Ready', 0), parse(SPEC_FRAMES.Ready[0]))
    expectLevels(levelsAt('Ready', 9999), parse(SPEC_FRAMES.Ready[0]))
  })
})

describe('resting frames', () => {
  it('matches the spec for every variant', () => {
    for (const variant of Object.keys(SPEC_RESTING) as StatusVariant[]) {
      expectLevels(RESTING_FRAMES[variant], parse(SPEC_RESTING[variant]))
      expectLevels(restingLevels(variant), parse(SPEC_RESTING[variant]))
    }
  })

  it('Work/Sync resting frames are not the loop rest (all-dim) frames', () => {
    expect(restingLevels('Work')[4]).toBe(LEVEL.full)
    expect(levelsAt('Work', 900)[4]).toBe(LEVEL.dim)
    expect(restingLevels('Sync')[4]).toBe(LEVEL.low)
    expect(levelsAt('Sync', 1200)[4]).toBe(LEVEL.dim)
  })
})

describe('loop timings', () => {
  it('uses the spec durations', () => {
    expect(STATUS_DURATION).toEqual({
      Wait: 2400,
      Think: 880,
      Work: 980,
      Sync: 1600,
      Ready: 0,
    })
  })

  it('scales Think when duration is overridden', () => {
    expectLevels(levelsAt('Think', 0, 1760), STATUS_FRAMES.Think[0])
    expectLevels(levelsAt('Think', 220 + 180, 1760), STATUS_FRAMES.Think[1])
  })

  it('keeps Work rest in proportion when the loop is scaled', () => {
    expectLevels(levelsAt('Work', 1600, 1960), parse(SPEC_FRAMES.Work[5]))
  })
})

describe('resolveStatusDuration', () => {
  it('defaults speed to 90 and leaves spec duration in place', () => {
    expect(STATUS_SPEED_DEFAULT).toBe(90)
    expect(resolveStatusDuration('Wait')).toBeUndefined()
    expect(resolveStatusDuration('Wait', undefined, 90)).toBeUndefined()
    expect(resolveStatusDuration('Think', undefined, 90)).toBeUndefined()
  })

  it('scales each variant loop by speed/90, including Ready at 0', () => {
    expect(resolveStatusDuration('Wait', undefined, 45)).toBe(1200)
    expect(resolveStatusDuration('Think', undefined, 45)).toBe(440)
    expect(resolveStatusDuration('Work', undefined, 180)).toBe(1960)
    expect(resolveStatusDuration('Sync', undefined, 45)).toBe(800)
    expect(resolveStatusDuration('Ready', undefined, 45)).toBe(0)
  })

  it('lets an explicit duration win over speed', () => {
    expect(resolveStatusDuration('Wait', 1000, 45)).toBe(1000)
    expect(resolveStatusDuration('Think', 0, 45)).toBe(0)
  })
})

describe('geometry helpers', () => {
  it('clamps dot radius to 0.26–0.38', () => {
    expect(clampDotRadius(0.32)).toBe(0.32)
    expect(clampDotRadius(0.1)).toBe(0.26)
    expect(clampDotRadius(0.5)).toBe(0.38)
  })
})

describe('aria defaults', () => {
  it('uses the spec labels', () => {
    expect(STATUS_LABELS).toEqual({
      Wait: 'Waiting',
      Think: 'Thinking',
      Work: 'Working',
      Sync: 'Syncing',
      Ready: 'Ready',
    })
  })
})
