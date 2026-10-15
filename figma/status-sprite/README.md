# StatusSprite — Figma frames

SVG frames generated from the live `StatusSprite` source (`src/status.ts`). Do not hand-edit brightness values here; re-run `npm run export:figma` after animation changes.

## Grid

- Canvas **150×150**, **50px** cells (3×3).
- Cell groups: `cell-a` … `cell-i`, row-major (left to right, top to bottom) — the same a–i order as the product brief.
- Inside each cell: `cell-a-dim` (LED off) under `cell-a-lit` (LED on). `lit` stays in the tree even at opacity `0`, so Smart Animate always sees the same layer tree.
- Dot: r **16** (0.32 of a cell). Square: inset **7**, size **36**, rx **5** (0.14 / 0.72 / 0.1 of a cell).
- Fills are plain hex. Light `['#141414', '#d6d6d6']`, dark `['#ededed', '#3a3a3a']`. Bind them to Figma colour variables `status/lit` and `status/dim`.

## Wait samples

Wait is a continuous sine in code. This export uses **8 keyframes** per 2400ms cycle (300ms apart) at the real `waitCenterLevel` values — not the six glyph snapshots in `STATUS_FRAMES.Wait`.

## Import

1. In Figma, drag the SVGs from `light/` (start here) into the file. Repeat for `dark/` if you want a second theme before variables exist.
2. Build a component set with variants:
   - **State:** Wait, Think, Work, Sync, Ready
   - **Frame:** frame-01, frame-02, … and **rest**
   - **Shape:** Dot, Square
3. Keep the layer tree as imported. Matching names across frames is what Smart Animate needs.
4. The published component can hide **Frame** and drive it from a prototype (see below). Resting frames (`rest.svg`) are for `active={false}` and reduced motion — not part of the loop.

## Prototype delays

`manifest.json` lists each animation frame's `holdMs` at the default speed **90**, plus `prototypeDelayMs` (hold minus the Smart Animate duration).

- **Think:** hold 110ms, Smart Animate **90ms Ease Out**. Delay = 20ms.
- **Work:** motion holds 140ms, rest hold 280ms, Smart Animate **100ms Ease Out**.
- **Sync:** motion holds 180ms, rest hold 880ms, Smart Animate **140ms Ease In and Out**.
- **Wait:** 8 frames × 300ms, Smart Animate **300ms Ease In and Out**, delay 0.
- **Ready:** one static frame; no loop.

Other speeds: `scaledMs = specMs * (speed / 90)`. Loop length scales the same way.

Wire After delay → next frame, last frame → first frame (except Ready). Use the `rest` variant when Active is off.

## Code Connect

The Figma component set is node `1:5550` in [the StatusSprite file](https://www.figma.com/design/kts3xQEzfCxv5CybxtKusi?node-id=1-5550). The mapping lives in `src/StatusSprite.figma.tsx` (`@figma/code-connect@1.5.3`) and is **not published yet**.

To publish later (Marcs):

```bash
FIGMA_ACCESS_TOKEN=<token> npx figma connect publish
```

That command pushes snippets into Figma Dev Mode. Do not run it until you mean to. Parse locally without a token: `npx figma connect parse`.
