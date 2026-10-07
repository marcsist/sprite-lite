import {
  STATUS_DURATION,
  STATUS_SPEED_DEFAULT,
  resolveStatusDuration,
  type StatusVariant,
} from './status'

export const BOARD_STEPS: readonly { variant: StatusVariant; label: string }[] = [
  { variant: 'Wait', label: 'queued' },
  { variant: 'Think', label: 'thinking' },
  { variant: 'Work', label: 'running tools' },
  { variant: 'Sync', label: 'syncing' },
  { variant: 'Ready', label: 'done' },
]

export const BOARD_BUSY_LOOPS = 2
export const BOARD_READY_HOLD_MS = 2000
export const BOARD_LABEL_FADE_MS = 150

export type BoardAgent = {
  pool: readonly string[]
  startStep: number
  /** Elapsed into the start step, measured at default speed. Scaled with `speed`. */
  startElapsedMs: number
  frozenStep: number
}

export const BOARD_AGENTS: readonly BoardAgent[] = [
  {
    pool: ['Fix flaky checkout test', 'Triage new bug reports', 'Evaluate new prompt'],
    startStep: 2,
    startElapsedMs: 0,
    frozenStep: 2,
  },
  {
    pool: ['Draft release notes', 'Summarise customer calls', 'Update onboarding docs'],
    startStep: 1,
    startElapsedMs: 0,
    frozenStep: 1,
  },
  {
    pool: ['Retrain support bot', 'Deploy support bot v2', 'Refresh help articles'],
    startStep: 3,
    startElapsedMs: 1600,
    frozenStep: 4,
  },
]

export function boardHoldMs(
  variant: StatusVariant,
  speed: number = STATUS_SPEED_DEFAULT
): number {
  if (variant === 'Ready') return BOARD_READY_HOLD_MS
  const loop = resolveStatusDuration(variant, undefined, speed) ?? STATUS_DURATION[variant]
  return BOARD_BUSY_LOOPS * loop
}

export function boardHolds(speed: number = STATUS_SPEED_DEFAULT): number[] {
  return BOARD_STEPS.map((step) => boardHoldMs(step.variant, speed))
}

export function boardCycleMs(speed: number = STATUS_SPEED_DEFAULT): number {
  return boardHolds(speed).reduce((sum, hold) => sum + hold, 0)
}

function scaleElapsed(msAtDefault: number, speed: number): number {
  if (speed === STATUS_SPEED_DEFAULT) return msAtDefault
  return msAtDefault * (speed / STATUS_SPEED_DEFAULT)
}

export function agentStartOffsetMs(
  row: number,
  speed: number = STATUS_SPEED_DEFAULT
): number {
  const agent = BOARD_AGENTS[row]
  const holds = boardHolds(speed)
  let offset = 0
  for (let i = 0; i < agent.startStep; i++) offset += holds[i]
  return offset + scaleElapsed(agent.startElapsedMs, speed)
}

export function remainingHoldMs(
  row: number,
  speed: number = STATUS_SPEED_DEFAULT
): number {
  const holds = boardHolds(speed)
  const cycle = boardCycleMs(speed)
  let t = ((agentStartOffsetMs(row, speed) % cycle) + cycle) % cycle
  let step = 0
  while (step < holds.length - 1 && t >= holds[step]) {
    t -= holds[step]
    step += 1
  }
  return holds[step] - t
}

export function agentAt(
  row: number,
  elapsedMs: number,
  speed: number = STATUS_SPEED_DEFAULT
): { variant: StatusVariant; label: string; task: string; step: number } {
  const agent = BOARD_AGENTS[row]
  const holds = boardHolds(speed)
  const cycle = boardCycleMs(speed)
  const start = agentStartOffsetMs(row, speed)
  const total = start + elapsedMs
  const wraps = Math.floor(total / cycle) - Math.floor(start / cycle)
  let t = ((total % cycle) + cycle) % cycle
  let step = 0
  while (step < holds.length - 1 && t >= holds[step]) {
    t -= holds[step]
    step += 1
  }
  return {
    variant: BOARD_STEPS[step].variant,
    label: BOARD_STEPS[step].label,
    task: agent.pool[((wraps % agent.pool.length) + agent.pool.length) % agent.pool.length],
    step,
  }
}

export function frozenAgent(row: number): {
  variant: StatusVariant
  label: string
  task: string
} {
  const agent = BOARD_AGENTS[row]
  const step = BOARD_STEPS[agent.frozenStep]
  return {
    variant: step.variant,
    label: step.label,
    task: agent.pool[0],
  }
}
