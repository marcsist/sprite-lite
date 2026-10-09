# Changelog

All notable changes to sprite-lite are documented here.

## [Unreleased]

## [0.2.0] - 2026-10-09 (unreleased)

Minor release. `StatusSprite` is a new, backwards-compatible export. Not published yet.

### Added
- `StatusSprite` — a 3×3 LED status set with five fixed states: Wait, Think, Work, Sync, Ready
- `StatusVariant` type, exported next to `ThinkingSprite`
- `speed` on `StatusSprite` — same default (90) and feel as ThinkingSprite; scales each variant loop including rests. `duration` still wins when set.
- Unit tests for frame tables, resting frames, reduced motion, colour modes, square geometry, aria labels, snippet output and speed scaling

### Changed
- Demo 3×3 section sits on the page theme like the 8×8 set: one row of five states, driven by the playground controls, with the CODE snippet switching to `<StatusSprite />` when a state is selected.
- Demo 3×3 row includes a looping chat-status fragment after the five states. It follows the playground controls, is not selectable, and does not change the CODE snippet.
- Demo playground defaults to dot shape (lite-brite).

## [0.1.1] - 2026-04-13

### Added
- `shape` prop on `ThinkingSprite` and `WriteSprite` — pass `shape="dot"` to render round circles instead of square pixels, giving a lite-brite peg-board look
- `dotRadius` prop — controls circle radius in SVG units (0–0.5, default 0.38); smaller values add more spacing between dots
- Demo playground: "Dot shape (lite brite)" checkbox and a live dot-size slider that appears when dot mode is active
- `WriteSprite` component — spells out text letter by letter with a sweeping radial reveal animation; supports A–Z, 0–9, and punctuation
- 21 new animation variants: Ghost, Breath, Drip, Bubble, Hourglass, Ripple, Tide, Signal, Focus, Campfire, Firefly, Bloom, Flutter, Aurora, Surf, Invader, Pac, Pong, Neko, Worm, Face

### Changed
- LED matrix pixel lookup switched from string-keyed `Set` to flat `Uint8Array` — eliminates per-tick string allocation
- `pool` resolved once per render instead of inside each event handler
- Demo variant count is now dynamic (tracks actual `VARIANTS` array length)
- Speed slider range tightened to 30–150ms/tick
- Color pickers exposed in demo when LED matrix mode is on

## [0.1.0] - 2026-04-11

Initial release — `ThinkingSprite` with 20 animation variants, 8×8 SVG pixel art, zero dependencies.
