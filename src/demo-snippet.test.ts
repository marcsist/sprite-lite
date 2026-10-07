import { describe, expect, it } from 'vitest'
import {
  STATUS_DEFAULTS,
  THINKING_DEFAULTS,
  WRITE_DEFAULTS,
  formatSnippet,
} from './demo-snippet'

describe('formatSnippet', () => {
  it('omits ThinkingSprite props that match defaults', () => {
    expect(
      formatSnippet(
        'ThinkingSprite',
        { size: 16, speed: 90, active: true, shape: 'square', dotRadius: 0.38 },
        THINKING_DEFAULTS
      )
    ).toBe('<ThinkingSprite />')
  })

  it('emits WriteSprite text when it differs', () => {
    expect(
      formatSnippet(
        'WriteSprite',
        { text: 'HI', size: 16, speed: 90, active: true, shape: 'square', dotRadius: 0.38 },
        WRITE_DEFAULTS
      )
    ).toBe(`<WriteSprite\n  text="HI"\n/>`)
  })
})

describe('StatusSprite snippet', () => {
  it('keeps variant and omits library defaults', () => {
    expect(
      formatSnippet(
        'StatusSprite',
        {
          variant: 'Wait',
          size: 16,
          shape: 'dot',
          speed: 90,
          active: true,
        },
        STATUS_DEFAULTS
      )
    ).toBe(`<StatusSprite\n  variant="Wait"\n/>`)
  })

  it('emits size, color tuple, square shape, speed, and inactive', () => {
    expect(
      formatSnippet(
        'StatusSprite',
        {
          variant: 'Think',
          size: 48,
          color: ['#ff00aa', '#110011'],
          shape: 'square',
          speed: 40,
          active: false,
        },
        STATUS_DEFAULTS
      )
    ).toBe(
      `<StatusSprite\n  variant="Think"\n  size={48}\n  color={["#ff00aa","#110011"]}\n  shape="square"\n  speed={40}\n  active={false}\n/>`
    )
  })

  it('uses a string color when LED mode is off', () => {
    expect(
      formatSnippet(
        'StatusSprite',
        {
          variant: 'Sync',
          size: 32,
          color: '#00ff88',
          shape: 'square',
          speed: 90,
          active: true,
        },
        STATUS_DEFAULTS
      )
    ).toBe(`<StatusSprite\n  variant="Sync"\n  size={32}\n  color="#00ff88"\n  shape="square"\n/>`)
  })

  it('switches variant when a 3×3 state is selected', () => {
    const props = {
      size: 32,
      color: ['#ededed', '#3a3a3a'] as [string, string],
      shape: 'square' as const,
      speed: 90,
      active: true,
    }
    expect(
      formatSnippet('StatusSprite', { variant: 'Wait', ...props }, STATUS_DEFAULTS)
    ).toContain('variant="Wait"')
    expect(
      formatSnippet('StatusSprite', { variant: 'Ready', ...props }, STATUS_DEFAULTS)
    ).toContain('variant="Ready"')
  })

  it('includes the dark theme default tuple until colour is customised', () => {
    expect(
      formatSnippet(
        'StatusSprite',
        {
          variant: 'Work',
          size: 32,
          color: ['#ededed', '#3a3a3a'],
          shape: 'square',
          speed: 90,
          active: true,
        },
        STATUS_DEFAULTS
      )
    ).toBe(
      `<StatusSprite\n  variant="Work"\n  size={32}\n  color={["#ededed","#3a3a3a"]}\n  shape="square"\n/>`
    )
  })

  it('includes the light theme default tuple', () => {
    expect(
      formatSnippet(
        'StatusSprite',
        {
          variant: 'Wait',
          size: 32,
          color: ['#141414', '#d6d6d6'],
          shape: 'square',
          speed: 90,
          active: true,
        },
        STATUS_DEFAULTS
      )
    ).toContain('color={["#141414","#d6d6d6"]}')
  })
})
