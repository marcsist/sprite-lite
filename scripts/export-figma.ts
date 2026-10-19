import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFigmaExport } from '../src/figma-status-export'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'figma', 'status-sprite')

const { files, manifest } = buildFigmaExport()

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const [rel, contents] of files) {
  const path = join(outDir, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

const svgCount = [...files.keys()].filter((name) => name.endsWith('.svg')).length
console.log(`Wrote ${files.size} files (${svgCount} SVGs) to ${outDir}`)
console.log(`Wait samples: ${manifest.wait.sampleCount}`)
console.log(`Grid: ${manifest.grid.canvas}×${manifest.grid.canvas}, ${manifest.grid.cell}px cells`)
