import figma from '@figma/code-connect'
import { StatusSprite } from './StatusSprite'
import type { StatusVariant } from './status'

/** Component set at node 1:5550. Frame is an animation step and is not mapped. */
export const FIGMA_STATUS_SPRITE_URL =
  'https://www.figma.com/design/kts3xQEzfCxv5CybxtKusi?node-id=1-5550'

export const FIGMA_STATE: Record<string, StatusVariant> = {
  Wait: 'Wait',
  Think: 'Think',
  Work: 'Work',
  Sync: 'Sync',
  Ready: 'Ready',
}

/** Figma labels are lowercase. `dot` is the code default, so omit it. */
export const FIGMA_SHAPE = {
  dot: undefined,
  square: 'square' as const,
}

/** Code default `size` is 16 — omit that variant, emit 12 and 20 as numbers. */
export const FIGMA_SIZE = {
  '12': 12,
  '16': undefined,
  '20': 20,
}

/**
 * Active is a Figma variant (`true` / `false` strings), not a boolean property.
 * `true` is the code default (omit). `false` is mapped here for tests; snippets
 * use a variant-restricted `figma.connect` so Dev Mode actually prints
 * `active={false}` (the parser drops boolean `false` attributes).
 */
export const FIGMA_ACTIVE = {
  true: undefined,
  false: false,
}

/**
 * Figma always shows the LED pair (variables `status/lit` + `status/dim`).
 * Code without `color` is `currentColor` and no dim layer, so the snippet
 * hard-codes the Light-mode hex fallback. Dark is a variable mode, not a prop.
 */
export const FIGMA_LED_COLOR: [string, string] = ['#141414', '#d6d6d6']

const props = {
  // Parser requires object literals here (not imported maps).
  variant: figma.enum('State', {
    Wait: 'Wait',
    Think: 'Think',
    Work: 'Work',
    Sync: 'Sync',
    Ready: 'Ready',
  }),
  shape: figma.enum('Shape', {
    dot: undefined,
    square: 'square',
  }),
  size: figma.enum('Size', {
    '12': 12,
    '16': undefined,
    '20': 20,
  }),
  active: figma.enum('Active', {
    true: undefined,
    false: false,
  }),
}

figma.connect(StatusSprite, FIGMA_STATUS_SPRITE_URL, {
  variant: { Active: 'true' },
  imports: ["import { StatusSprite } from 'sprite-lite'"],
  props,
  example: ({ variant, shape, size }) => (
    <>
      {/* dark: ['#ededed', '#3a3a3a'] */}
      <StatusSprite variant={variant} shape={shape} size={size} color={['#141414', '#d6d6d6']} />
    </>
  ),
})

figma.connect(StatusSprite, FIGMA_STATUS_SPRITE_URL, {
  variant: { Active: 'false' },
  imports: ["import { StatusSprite } from 'sprite-lite'"],
  props,
  example: ({ variant, shape, size }) => (
    <>
      {/* dark: ['#ededed', '#3a3a3a'] */}
      <StatusSprite
        variant={variant}
        shape={shape}
        size={size}
        color={['#141414', '#d6d6d6']}
        active={false}
      />
    </>
  ),
})
