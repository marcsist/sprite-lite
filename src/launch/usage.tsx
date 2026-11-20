import { useEffect, useState } from 'react'
import { StatusSprite } from '../StatusSprite'
import { ThinkingSprite } from '../ThinkingSprite'
import type { StatusVariant } from '../status'
import { launchPath } from './routes'
import { usePrefersReducedMotion } from './reduced'
import './launch.css'

const LED: [string, string] = ['#ededed', '#3a3a3a']

const STEPS: readonly { variant: StatusVariant; label: string; hold: number }[] = [
  { variant: 'Think', label: 'Reading invoices/empty.tsx', hold: 2400 },
  { variant: 'Work', label: 'Rewriting the empty state', hold: 3400 },
  { variant: 'Sync', label: 'Checking the line at 320', hold: 2600 },
  { variant: 'Ready', label: 'Fits on one line at 320', hold: 3600 },
]

const TRACE = [
  'Read invoices/empty.tsx',
  'Rewrite the empty state',
  'Check the line at 320',
] as const

const WORK_INDEX = 1

function usePhase(reduced: boolean): number {
  const [index, setIndex] = useState(WORK_INDEX)

  useEffect(() => {
    if (reduced) return
    const id = window.setTimeout(() => {
      setIndex((current) => (current + 1) % STEPS.length)
    }, STEPS[index].hold)
    return () => window.clearTimeout(id)
  }, [index, reduced])

  return reduced ? WORK_INDEX : index
}

type RowState = 'done' | 'now' | 'wait'

function rowState(row: number, phase: number): RowState {
  if (phase >= STEPS.length - 1) return 'done'
  if (row < phase) return 'done'
  if (row === phase) return 'now'
  return 'wait'
}

function rowVariant(state: RowState, phase: number): StatusVariant {
  if (state === 'done') return 'Ready'
  if (state === 'now') return STEPS[phase].variant
  return 'Wait'
}

export function LaunchUsage() {
  const reduced = usePrefersReducedMotion()
  const phase = usePhase(reduced)
  const step = STEPS[phase]

  useEffect(() => {
    const previous = document.title
    document.title = 'Field — sprite-lite'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="launch">
      <main className="usage-stage" data-launch="usage" data-phase={step.variant.toLowerCase()}>
        <section className="usage-window" aria-label="Field, working on the invoices empty state">
          <header className="usage-bar">
            <div className="usage-brand">
              <span>Field</span>
            </div>
            <p className="usage-path">
              <span>Invoices</span>
              <span className="usage-path-sep" aria-hidden="true">
                /
              </span>
              <span className="usage-path-here">Empty state</span>
            </p>
          </header>

          <div className="usage-body">
            <div className="usage-thread">
              <p className="usage-user">
                The empty state still says “Nothing here.” Can you match the tone we used in Settings?
              </p>

              <div className="usage-agent">
                <div className="usage-mark" aria-hidden="true">
                  <ThinkingSprite
                    variant="Face"
                    size={28}
                    speed={140}
                    shape="square"
                    color={LED[0]}
                    active={!reduced}
                  />
                </div>
                <div className="usage-agent-body">
                  <div className="usage-who">Field</div>
                  <div className="usage-status" role="status">
                    <StatusSprite
                      variant={step.variant}
                      size={14}
                      color={LED}
                      speed={90}
                      active={!reduced}
                      label={step.label}
                    />
                    <span key={step.label} className="usage-status-label">
                      {step.label}
                    </span>
                  </div>
                  <p className="usage-answer">
                    I’d use “No invoices yet.” Second line, “They show up here after the first payment.” Same size as Settings. No illustration.
                  </p>
                </div>
              </div>

              <div className="usage-compose" inert>
                <span>Reply to Field</span>
              </div>
            </div>

            <aside className="usage-trace" aria-label="Work so far">
              <h2>Work</h2>
              <ol>
                {TRACE.map((label, row) => {
                  const state = rowState(row, phase)
                  const variant = rowVariant(state, phase)
                  return (
                    <li key={label} data-state={state}>
                      <StatusSprite
                        variant={variant}
                        size={14}
                        color={LED}
                        speed={90}
                        active={!reduced && state === 'now'}
                        label={label}
                      />
                      <span>{label}</span>
                    </li>
                  )
                })}
              </ol>
            </aside>
          </div>
        </section>
      </main>

      <footer className="launch-credit">
        <span>sprite-lite</span>
        <a href={launchPath('cast')}>Cast</a>
      </footer>
    </div>
  )
}
