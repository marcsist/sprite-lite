# sprite-lite 0.2.0

Not published yet. This is a minor release: `StatusSprite` is a new export, and the 8×8 sprites stay as they are.

Live demo: [https://marcsist.github.io/sprite-lite/](https://marcsist.github.io/sprite-lite/)

## StatusSprite

A quiet 3×3 LED status light for product chrome. Five fixed states — no click-cycling. Use it small (about 12–20px). Keep `ThinkingSprite` for the larger, characterful 8×8 moments.

```tsx
import { StatusSprite, type StatusVariant } from 'sprite-lite'

<StatusSprite
  variant="Think"
  size={16}
  color={['#141414', '#d6d6d6']}
  speed={90}
/>
```

| State | Means | Motion |
|---|---|---|
| `Wait` | waiting | Centre breathes on a 2400ms sine |
| `Think` | thinking | Clockwise ring with a 2-dot tail, 880ms |
| `Work` | working | Middle row passes left to right, 980ms including rest |
| `Sync` | syncing | Outward ripple, 1600ms including rest |
| `Ready` | ready | Static centre |

Always `role="img"`. Meaning lives in position and motion, not in colour.

### Props

| Prop | Default | Notes |
|---|---|---|
| `variant` | — | Required. `'Wait' \| 'Think' \| 'Work' \| 'Sync' \| 'Ready'` |
| `size` | `16` | Side length in px. ViewBox stays 3×3. |
| `color` | `currentColor` | A string for the lit layer, or `[lit, dim]` for LED matrix mode. |
| `shape` | `'dot'` | Dot is the recommended look. Square is an inset rect, never full-cell. |
| `dotRadius` | `0.32` | Dot radius in cell units, clamped 0.26–0.38. |
| `active` | `true` | When `false`, freeze on that variant’s resting frame. |
| `speed` | `90` | Milliseconds per tick, same feel as ThinkingSprite. Scales the whole loop, including rests. Lower is faster. Ignored if `duration` is set. |
| `duration` | per variant | Milliseconds per loop, including rests. Wins over `speed`. Ready is static. |
| `label` | per variant | `aria-label`. Defaults: Waiting, Thinking, Working, Syncing, Ready. |

`active={false}` and `prefers-reduced-motion: reduce` both show the variant’s defined resting frame, so the state stays readable.

## Demo

The playground 3×3 row now sits on the page theme, like the 8×8 set. Live controls (size, speed, active, shape, colours) drive the five states.

Selecting a 3×3 state switches the CODE box to a `<StatusSprite />` snippet with only the non-default props.

After Ready, a looping chat fragment shows the set in situ: a cropped assistant bubble, a 20px status line, and a decorative input. It follows the same controls (the fragment sprite stays 20px), is not selectable, and does not change the CODE snippet.

Dot shape is on by default in the playground.

## 8×8 sprites

`ThinkingSprite` and `WriteSprite` are unchanged. Existing 8×8 variants, props, and behaviour are the same.
