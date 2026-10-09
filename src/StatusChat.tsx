import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { StatusSprite } from './StatusSprite'
import {
  CHAT_BUSY_STEPS,
  CHAT_DONE_COPY,
  CHAT_FRAGMENT_COPY,
  CHAT_FROZEN_STEP,
  CHAT_INPUT_PLACEHOLDER,
  CHAT_LABEL_FADE_MS,
  CHAT_SPRITE_SIZE,
  chatHoldMs,
} from './status-chat'

const REDUCE_MQ = '(prefers-reduced-motion: reduce)'
const LAST_BUSY = CHAT_BUSY_STEPS.length - 1

export function StatusChat({
  speed,
  active,
  color,
  shape,
  dotRadius,
}: {
  speed: number
  active: boolean
  color: string | [string, string]
  shape: 'dot' | 'square'
  dotRadius: number
}) {
  const reducedMotion = usePrefersReducedMotion()
  const frozen = !active || reducedMotion
  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase] = useState<'busy' | 'ready'>('busy')
  const stepRef = useRef(0)
  const phaseRef = useRef<'busy' | 'ready'>('busy')

  useEffect(() => {
    if (frozen) {
      stepRef.current = CHAT_FROZEN_STEP
      phaseRef.current = 'busy'
      setStepIndex(CHAT_FROZEN_STEP)
      setPhase('busy')
      return
    }

    let cancelled = false
    let id = 0

    const tick = () => {
      if (cancelled) return
      if (phaseRef.current === 'ready') {
        phaseRef.current = 'busy'
        stepRef.current = 0
        setPhase('busy')
        setStepIndex(0)
        id = setTimeout(tick, chatHoldMs('Wait', speed)) as unknown as number
        return
      }
      if (stepRef.current === LAST_BUSY) {
        phaseRef.current = 'ready'
        setPhase('ready')
        id = setTimeout(tick, chatHoldMs('Ready', speed)) as unknown as number
        return
      }
      const next = stepRef.current + 1
      stepRef.current = next
      setStepIndex(next)
      id = setTimeout(tick, chatHoldMs(CHAT_BUSY_STEPS[next].variant, speed)) as unknown as number
    }

    const opening = phaseRef.current === 'ready' ? 'Ready' : CHAT_BUSY_STEPS[stepRef.current].variant
    id = setTimeout(tick, chatHoldMs(opening, speed)) as unknown as number
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [frozen, speed])

  const step = CHAT_BUSY_STEPS[frozen ? CHAT_FROZEN_STEP : stepIndex]
  const livePhase = frozen ? 'busy' : phase
  const variant = livePhase === 'ready' ? 'Ready' : step.variant
  const label = livePhase === 'ready' ? CHAT_BUSY_STEPS[LAST_BUSY].label : step.label
  const shimmer = !frozen && livePhase === 'busy'

  return (
    <div
      className="status-chat"
      data-chat=""
      data-chat-phase={livePhase}
      data-chat-variant={variant}
      data-chat-shimmer={shimmer ? 'true' : 'false'}
      role="group"
      aria-label="Chat status example"
    >
      <div className="status-chat-body">
        <div className="status-chat-fragment">
          <p className="status-chat-bubble">{CHAT_FRAGMENT_COPY}</p>
        </div>

        <div className="status-chat-mid">
          <div
            className={`status-chat-status${livePhase === 'ready' ? ' is-hidden' : ''}`}
            data-chat-status=""
            aria-hidden={livePhase === 'ready' ? true : undefined}
          >
            <span className="status-chat-sprite" aria-hidden="true">
              <StatusSprite
                variant={step.variant}
                size={CHAT_SPRITE_SIZE}
                color={color}
                shape={shape}
                dotRadius={dotRadius}
                speed={speed}
                active={active}
              />
            </span>
            <ChatLabel text={label} shimmer={shimmer} />
          </div>
          <p
            className={`status-chat-bubble status-chat-done${livePhase === 'ready' ? ' is-shown' : ''}`}
            data-chat-done=""
            aria-hidden={livePhase === 'ready' ? undefined : true}
          >
            {CHAT_DONE_COPY}
          </p>
        </div>

        <div className="status-chat-input" aria-hidden="true" inert>
          <span className="status-chat-plus" aria-hidden="true">
            +
          </span>
          <span className="status-chat-placeholder">{CHAT_INPUT_PLACEHOLDER}</span>
        </div>
      </div>
    </div>
  )
}

function ChatLabel({ text, shimmer }: { text: string; shimmer: boolean }) {
  const [current, setCurrent] = useState(text)
  const [previous, setPrevious] = useState<string | null>(null)

  useEffect(() => {
    if (text === current) return
    setPrevious(current)
    setCurrent(text)
    const id = setTimeout(() => setPrevious(null), CHAT_LABEL_FADE_MS)
    return () => clearTimeout(id)
  }, [text, current])

  return (
    <span className="status-chat-label-copy">
      {previous != null && (
        <span className="status-chat-label is-leave" aria-hidden="true">
          {previous}
        </span>
      )}
      <span
        className={`status-chat-label${shimmer ? ' is-shimmer' : ''}`}
        data-chat-label={current}
      >
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
