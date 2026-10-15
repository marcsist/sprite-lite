# Figma Code Connect (StatusSprite)

The Figma component set exists, so this is the mapping contract for `src/StatusSprite.figma.tsx`. `@figma/code-connect` is a **devDependency**, pinned to **1.5.3** because CLI v2 dropped the React parser that `.figma.tsx` / `figma.connect()` needs. Snippets have **not** been published (`figma connect publish` is still for Marcs).

## File and node

- File: https://www.figma.com/design/kts3xQEzfCxv5CybxtKusi
- Component set: node `1:5550` → https://www.figma.com/design/kts3xQEzfCxv5CybxtKusi?node-id=1-5550
- Doc page: node `1:5713`

One component set. Animation frames live on the same set as **Frame**; Code Connect ignores Frame. There is no separate “published” vs “frames” component.

## Figma properties (as built)

| Figma property | Type | Values | StatusSprite prop | Snippet |
|---|---|---|---|---|
| `State` | Variant | `Wait`, `Think`, `Work`, `Sync`, `Ready` | `variant` | Always emit (required in code). Identity map to `StatusVariant`. |
| `Shape` | Variant | `dot`, `square` (lowercase) | `shape` | Omit `dot` (code default). Emit `shape="square"`. |
| `Size` | Variant | `20`, `16`, `12` | `size` | Code default is **16**. Omit `16`. Emit `size={12}` / `size={20}`. |
| `Active` | Variant (`true` / `false` strings) | not a boolean property | `active` | Omit when `true`. Emit `active={false}` when `false`. |
| `Frame` | Variant | `1`–`8` | — | Ignore. Animation step only; `false` Active is the rest frame and only exists at Frame=1. |

Default Figma instance: **Think / dot / 20 / true / 1**. That snippet is:

```tsx
<StatusSprite variant="Think" size={20} color={['#141414', '#d6d6d6']} />
```

(`shape` and `active` omitted as defaults; `size={20}` because 20 is not the code default.)

## Not in Figma

- **Speed** — omit. Code keeps `speed={90}`.
- **LED** — no property. Colours are Figma variables `status/lit` and `status/dim` (Light / Dark modes).

## LED in the snippet

`StatusSprite` without `color` paints `currentColor` on the lit layer only — no dim base. The Figma library is always the LED pair. Code Connect therefore always passes the Light-mode hex fallback:

```tsx
color={['#141414', '#d6d6d6']}
```

Dark mode is a variable mode, not a component property, so the snippet does not switch tuples. Engineers who need dark hex pass `['#ededed', '#3a3a3a']` in code.

## Active = false in Dev Mode

`figma.enum('Active', { true: undefined, false: false })` is the mapping, but the React parser **drops boolean `false` attributes** (it would print nothing instead of `active={false}`). Two `figma.connect` calls with `variant: { Active: 'true' | 'false' }` keep the enum and hard-code `active={false}` on the false example.

## Out of scope

- `duration`, `dotRadius`, `label`
- Publishing (`npx figma connect publish`)
- Adding Code Connect to the published npm tarball (the `.figma.tsx` file is excluded from `tsc`, the library build, and `npm pack`)
