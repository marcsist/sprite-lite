import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { StatusSprite } from './StatusSprite'
import {
  BOARD_AGENTS,
  BOARD_LABEL_FADE_MS,
  BOARD_STEPS,
  boardHoldMs,
  remainingHoldMs,
} from './status-board'

const REDUCE_MQ = '(prefers-reduced-motion: reduce)'

export function StatusBoard({
  size,
  speed,
  active,
  color,
  shape,
  dotRadius,
}: {
  size: number
  speed: number
  active: boolean
  color: string | [string, string]
  shape: 'dot' | 'square'
  dotRadius: number
}) {
  const reducedMotion = usePrefersReducedMotion()
  const frozen = !active || reducedMotion

  return (
    <div
      className="status-board"
      data-board=""
      role="group"
      aria-label="Multi-agent status example"
    >
      <div className="status-board-body">
        {BOARD_AGENTS.map((agent, row) => (
          <AgentRow
            key={row}
            row={row}
            frozen={frozen}
            size={size}
            speed={speed}
            active={active}
            color={color}
            shape={shape}
            dotRadius={dotRadius}
            pool={agent.pool}
            startStep={agent.startStep}
            frozenStep={agent.frozenStep}
          />
        ))}
      </div>
    </div>
  )
}

function AgentRow({
  row,
  frozen,
  size,
  speed,
  active,
  color,
  shape,
  dotRadius,
  pool,
  startStep,
  frozenStep,
}: {
  row: number
  frozen: boolean
  size: number
  speed: number
  active: boolean
  color: string | [string, string]
  shape: 'dot' | 'square'
  dotRadius: number
  pool: readonly string[]
  startStep: number
  frozenStep: number
}) {
  const [stepIndex, setStepIndex] = useState(startStep)
  const [taskIndex, setTaskIndex] = useState(0)
  const atStart = useRef(true)
  const stepRef = useRef(startStep)
  const taskRef = useRef(0)

  useEffect(() => {
    if (frozen) {
      atStart.current = true
      stepRef.current = startStep
      taskRef.current = 0
      setStepIndex(startStep)
      setTaskIndex(0)
      return
    }

    let cancelled = false
    let id = 0

    const tick = () => {
      if (cancelled) return
      atStart.current = false
      const next = (stepRef.current + 1) % BOARD_STEPS.length
      if (next === 0) {
        taskRef.current = (taskRef.current + 1) % pool.length
      }
      stepRef.current = next
      setStepIndex(next)
      setTaskIndex(taskRef.current)
      id = setTimeout(tick, boardHoldMs(BOARD_STEPS[next].variant, speed)) as unknown as number
    }

    const hold = atStart.current
      ? remainingHoldMs(row, speed)
      : boardHoldMs(BOARD_STEPS[stepRef.current].variant, speed)
    id = setTimeout(tick, hold) as unknown as number
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [frozen, speed, row, startStep, pool.length])

  const step = BOARD_STEPS[frozen ? frozenStep : stepIndex]
  const task = pool[frozen ? 0 : taskIndex]

  return (
    <div
      className="status-board-row"
      data-board-row={row}
      data-board-variant={step.variant}
      data-board-task={task}
      data-board-status={step.label}
    >
      <span className="status-board-sprite" aria-hidden="true">
        <StatusSprite
          variant={step.variant}
          size={size}
          color={color}
          shape={shape}
          dotRadius={dotRadius}
          speed={speed}
          active={active}
        />
      </span>
      <CrossfadeText
        text={task}
        className="status-board-task"
        dataAttr="data-board-task-label"
      />
      <CrossfadeText
        text={step.label}
        className="status-board-status"
        dataAttr="data-board-status-label"
      />
    </div>
  )
}

function CrossfadeText({
  text,
  className,
  dataAttr,
}: {
  text: string
  className: string
  dataAttr: string
}) {
  const [current, setCurrent] = useState(text)
  const [previous, setPrevious] = useState<string | null>(null)

  useEffect(() => {
    if (text === current) return
    setPrevious(current)
    setCurrent(text)
    const id = setTimeout(() => setPrevious(null), BOARD_LABEL_FADE_MS)
    return () => clearTimeout(id)
  }, [text, current])

  return (
    <span className={`${className}-copy`}>
      {previous != null && (
        <span className={`${className} is-leave`} aria-hidden="true">
          {previous}
        </span>
      )}
      <span className={className} {...{ [dataAttr]: current }}>
        {current}
      </span>
    </span>
  )
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(REDUCE_MQ).matches
}

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mq = window.matchMedia(REDUCE_MQ)
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }
  mq.addListener(onChange)
  return () => mq.removeListener(onChange)
}
