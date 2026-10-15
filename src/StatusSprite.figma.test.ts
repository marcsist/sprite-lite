import { describe, expect, it } from 'vitest'
import { STATUS_VARIANTS } from './status'
import {
  FIGMA_ACTIVE,
  FIGMA_LED_COLOR,
  FIGMA_SHAPE,
  FIGMA_SIZE,
  FIGMA_STATE,
  FIGMA_STATUS_SPRITE_URL,
} from './StatusSprite.figma'

describe('StatusSprite Code Connect maps', () => {
  it('maps every StatusVariant 1:1 from Figma State', () => {
    expect(Object.keys(FIGMA_STATE).sort()).toEqual([...STATUS_VARIANTS].sort())
    for (const variant of STATUS_VARIANTS) {
      expect(FIGMA_STATE[variant]).toBe(variant)
    }
  })

  it('maps lowercase Figma Shape, omitting the code default (dot)', () => {
    expect(Object.keys(FIGMA_SHAPE).sort()).toEqual(['dot', 'square'])
    expect(FIGMA_SHAPE.dot).toBeUndefined()
    expect(FIGMA_SHAPE.square).toBe('square')
  })

  it('maps Figma Size 12/16/20 and omits the code default 16', () => {
    expect(Object.keys(FIGMA_SIZE).sort()).toEqual(['12', '16', '20'])
    expect(FIGMA_SIZE['16']).toBeUndefined()
    expect(FIGMA_SIZE['12']).toBe(12)
    expect(FIGMA_SIZE['20']).toBe(20)
  })

  it('treats Active as true/false variant strings', () => {
    expect(Object.keys(FIGMA_ACTIVE).sort()).toEqual(['false', 'true'])
    expect(FIGMA_ACTIVE.true).toBeUndefined()
    expect(FIGMA_ACTIVE.false).toBe(false)
  })

  it('keeps the LED pair on with the light hex fallback', () => {
    expect(FIGMA_LED_COLOR).toEqual(['#141414', '#d6d6d6'])
  })

  it('points at the StatusSprite component set node', () => {
    expect(FIGMA_STATUS_SPRITE_URL).toContain('kts3xQEzfCxv5CybxtKusi')
    expect(FIGMA_STATUS_SPRITE_URL).toContain('node-id=1-5550')
  })
})
