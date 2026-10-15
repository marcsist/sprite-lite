# Figma Code Connect plan (StatusSprite)

Plan only — do **not** add `@figma/code-connect` until the designer has published the Figma component set. This document is the mapping contract so that file (`StatusSprite.figma.tsx`) is a mechanical step later.

## Two Figma components

Keep animation frames and the published symbol separate.

| Figma component | Purpose | Variants the designer needs |
|---|---|---|
| `StatusSprite / Frames` | Internal library. One variant per exported SVG. Prototypes Smart Animate between **Frame** values. | **State**, **Frame**, **Shape**, optional **Theme** |
| `StatusSprite` | What engineers and Code Connect bind to. Instance size is the sprite size. Prototype (or a nested Frames instance) plays the loop. | **State**, **Shape**, **Size**, **Speed**, **LED**, **Active** |

Code Connect targets the published `StatusSprite` only. `StatusSprite / Frames` is a designer tool; it does not map to a React prop named `frame`.

## Recommended Figma property names

Use these names and types on the published component. Code Connect matches **property name** + **option label**, so changing them later means editing the mapping file.

| Figma property | Figma type | Option labels / values | StatusSprite prop |
|---|---|---|---|
| `State` | Variant | `Wait`, `Think`, `Work`, `Sync`, `Ready` | `variant` |
| `Shape` | Variant | `Dot`, `Square` | `shape`: `'dot'` / `'square'` |
| `Size` | Variant | `16`, `24`, `32` | `size`: `16` / `24` / `32` |
| `Speed` | Variant | `Default`, `Fast`, `Slow` | `speed`: `90` / `60` / `135` |
| `LED` | Boolean | on / off (default **on**) | `color`: tuple vs single colour |
| `Active` | Boolean | on / off (default **on**) | `active` |

### Why these types

Figma component properties are variant, boolean, text, or instance-swap — there is no native number field. Size and Speed are therefore labeled variants, not free numbers.

- **Size** labels are the pixel values themselves (`16` / `24` / `32`) so they stay obvious. The instance can still be resized on the canvas; Code Connect should prefer the **Size** variant, and a later follow-up can map instance width if the designer drops the variant.
- **Speed** uses words because `60` / `90` / `135` are easy to mix up with Size. Mapping: Fast = `60` (quicker than default), Default = `90`, Slow = `135` (half as fast as 60, 1.5× default). Other speeds stay a code-only `speed` / `duration` override.
- **LED** is a boolean, not a colour picker. Colours live in Figma variables `status/lit` and `status/dim` (light `#141414` / `#d6d6d6`, dark `#ededed` / `#3a3a3a`). The boolean only chooses tuple vs single fill, which is the `color` prop’s two modes.
- **Active** off must show the exported **rest** frame (the same glyph as `active={false}` / reduced motion), not a paused mid-loop frame.

Do **not** put `duration`, `dotRadius`, or `label` on the published component for v1. They remain code overrides.

## Mapping file (later)

When the Figma nodes exist, add the dependency and a file next to the component:

```tsx
// StatusSprite.figma.tsx  (do not add until the Figma set is published)
import figma from '@figma/code-connect'
import { StatusSprite } from './StatusSprite'

figma.connect(StatusSprite, 'FIGMA_NODE_URL', {
  props: {
    variant: figma.enum('State', {
      Wait: 'Wait',
      Think: 'Think',
      Work: 'Work',
      Sync: 'Sync',
      Ready: 'Ready',
    }),
    shape: figma.enum('Shape', {
      Dot: 'dot',
      Square: 'square',
    }),
    size: figma.enum('Size', {
      '16': 16,
      '24': 24,
      '32': 32,
    }),
    speed: figma.enum('Speed', {
      Fast: 60,
      Default: 90,
      Slow: 135,
    }),
    color: figma.boolean('LED', {
      true: ['#141414', '#d6d6d6'], // bind to status/lit, status/dim in Figma; hex is the code fallback
      false: '#141414',
    }),
    active: figma.boolean('Active'),
  },
  example: ({ variant, shape, size, speed, color, active }) => (
    <StatusSprite
      variant={variant}
      shape={shape}
      size={size}
      speed={speed}
      color={color}
      active={active}
    />
  ),
})
```

Replace `FIGMA_NODE_URL` with the published component URL. If the designer uses variable modes for light/dark, the snippet can keep the tuple and let Figma inspect the bound variables rather than hard-coding hex.

## Internal Frames component (not Code Connect)

For Smart Animate, every frame must keep the same layer tree: `cell-a` … `cell-i`, each with `cell-*-dim` then `cell-*-lit`. Variant properties:

| Property | Type | Labels |
|---|---|---|
| `State` | Variant | `Wait`, `Think`, `Work`, `Sync`, `Ready` |
| `Frame` | Variant | `frame-01` … plus `rest` (see `manifest.json` for how many per state) |
| `Shape` | Variant | `Dot`, `Square` |
| `Theme` | Variant (optional) | `Light`, `Dark` — skip if colour variables already switch both fills |

Prototype: After delay = `prototypeDelayMs`, Smart Animate duration / easing from `states[State].smartAnimate` in `figma/status-sprite/manifest.json`. Loop last → first except Ready. `Active = false` on the published component should swap to `Frame = rest`.

## Out of scope until the Figma set exists

- Adding `@figma/code-connect` to `package.json`
- Creating `StatusSprite.figma.tsx`
- Publishing the Figma library
- Mapping `duration`, `dotRadius`, or `label`
