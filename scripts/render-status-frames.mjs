#!/usr/bin/env node
/**
 * Renders the 3×3 status frame-strip PNGs used in the README
 * via an HTML document screenshotted with headless Chrome.
 */
import { writeFileSync, mkdirSync, unlinkSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const DIM = 0
const LOW = 0.3
const MID = 0.6
const FULL = 1

const SECTIONS = [
  {
    title: 'Wait  ·  waiting (center breathes, 2400ms loop)',
    frames: [
      [DIM, DIM, DIM, DIM, DIM, DIM, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, LOW, DIM, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, MID, DIM, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, FULL, DIM, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, MID, DIM, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, LOW, DIM, DIM, DIM, DIM],
    ],
  },
  {
    title: 'Think  ·  thinking (orbit + 2-dot tail, 880ms)',
    frames: [
      [FULL, DIM, DIM, DIM, DIM, DIM, DIM, DIM, DIM],
      [MID, FULL, DIM, DIM, DIM, DIM, DIM, DIM, DIM],
      [LOW, MID, FULL, DIM, DIM, DIM, DIM, DIM, DIM],
      [DIM, LOW, MID, DIM, DIM, FULL, DIM, DIM, DIM],
      [DIM, DIM, LOW, DIM, DIM, MID, DIM, DIM, FULL],
      [DIM, DIM, DIM, DIM, DIM, LOW, DIM, FULL, MID],
      [DIM, DIM, DIM, DIM, DIM, DIM, FULL, MID, LOW],
      [DIM, DIM, DIM, FULL, DIM, DIM, MID, LOW, DIM],
    ],
  },
  {
    title: 'Work  ·  working (pass L→R, 980ms)',
    frames: [
      [DIM, DIM, DIM, FULL, DIM, DIM, DIM, DIM, DIM],
      [DIM, DIM, DIM, MID, FULL, DIM, DIM, DIM, DIM],
      [DIM, DIM, DIM, LOW, MID, FULL, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, LOW, MID, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, DIM, LOW, DIM, DIM, DIM],
      [DIM, DIM, DIM, DIM, DIM, DIM, DIM, DIM, DIM],
    ],
  },
  {
    title: 'Sync  ·  syncing / retraining (ripple, 1600ms)',
    frames: [
      [DIM, DIM, DIM, DIM, FULL, DIM, DIM, DIM, DIM],
      [DIM, FULL, DIM, FULL, MID, FULL, DIM, FULL, DIM],
      [MID, LOW, MID, LOW, DIM, LOW, MID, LOW, MID],
      [LOW, DIM, LOW, DIM, DIM, DIM, LOW, DIM, LOW],
      [DIM, DIM, DIM, DIM, DIM, DIM, DIM, DIM, DIM],
    ],
  },
  {
    title: 'Ready  ·  ready (static)',
    frames: [[DIM, DIM, DIM, DIM, FULL, DIM, DIM, DIM, DIM]],
  },
]

const THEMES = {
  light: { bg: '#ffffff', lit: '#141414', dim: '#d6d6d6', text: '#8a8a8a' },
  dark: { bg: '#111111', lit: '#ededed', dim: '#3a3a3a', text: '#9a9a9a' },
}

function gridSvg(levels, lit, dim, size = 42) {
  const cells = levels
    .map((level, i) => {
      const x = i % 3
      const y = Math.floor(i / 3)
      return `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.32" fill="${dim}"/><circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.32" fill="${lit}" fill-opacity="${level}"/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 3" width="${size}" height="${size}" aria-hidden="true">${cells}</svg>`
}

function htmlFor(themeName) {
  const theme = THEMES[themeName]
  const sections = SECTIONS.map(
    (section) => `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <div class="frames">
          ${section.frames.map((frame) => `<div class="frame">${gridSvg(frame, theme.lit, theme.dim)}</div>`).join('')}
        </div>
      </section>`
  ).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; background: ${theme.bg}; }
    body {
      font-family: Inter, "Noto Sans", system-ui, sans-serif;
      padding: 48px 56px 56px;
      width: max-content;
      color: ${theme.text};
    }
    section { margin: 0 0 42px; }
    section:last-child { margin-bottom: 0; }
    h2 {
      margin: 0 0 14px;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0.01em;
      color: ${theme.text};
    }
    .frames { display: flex; gap: 28px; align-items: center; }
    .frame { flex: 0 0 auto; }
    svg { display: block; }
  </style>
</head>
<body>
  ${sections}
</body>
</html>`
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function screenshot(htmlPath, pngPath) {
  const result = spawnSync(
    'google-chrome',
    [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--user-data-dir=/tmp/chrome-status-frames',
      '--force-device-scale-factor=2',
      '--window-size=720,660',
      `--screenshot=${pngPath}`,
      htmlPath,
    ],
    { encoding: 'utf8', timeout: 20000, killSignal: 'SIGKILL' }
  )
  if (result.error && result.error.code !== 'ETIMEDOUT') {
    throw result.error
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs')
mkdirSync(outDir, { recursive: true })

for (const theme of ['light', 'dark']) {
  const htmlPath = join(outDir, `status-frames-${theme}.html`)
  const pngPath = join(outDir, `status-frames-${theme}.png`)
  writeFileSync(htmlPath, htmlFor(theme))
  screenshot(htmlPath, pngPath)
  unlinkSync(htmlPath)
  if (statSync(pngPath).size < 1000) {
    throw new Error(`screenshot too small: ${pngPath}`)
  }
  console.log('wrote', pngPath)
}
