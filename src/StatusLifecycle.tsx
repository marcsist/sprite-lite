import { useEffect, useState, useSyncExternalStore } from 'react'
import { StatusSprite } from './StatusSprite'
import {
  LIFECYCLE_LABEL_FADE_MS,
  LIFECYCLE_STEPS,
  lifecycleHoldMs,
} from './status-lifecycle'
const REDUCE_MQ = '(prefers-reduced-motion: reduce)'
const READY_INDEX = LIFECYCLE_STEPS.length - 1

export function StatusLifecycle({
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
  const [index, setIndex] = useState(0)
  const step = LIFECYCLE_STEPS[frozen ? READY_INDEX : index]

  useEffect(() => {
    if (frozen) {
      setIndex(0)
      return
    }
    const hold = lifecycleHoldMs(LIFECYCLE_STEPS[index].variant, speed)
    const id = setTimeout(() => {
      setIndex((current) => (current + 1) % LIFECYCLE_STEPS.length)
    }, hold)
    return () => clearTimeout(id)
  }, [frozen, index, speed])

  return (
    <div
      className="status-lifecycle"
      data-lifecycle=""
      data-lifecycle-variant={step.variant}
      role="group"
      aria-label="Status lifecycle example"
    >
      <span aria-hidden="true">
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
      <LifecycleLabel text={step.label} />
    </div>
  )
}

function LifecycleLabel({ text }: { text: string }) {
  const [current, setCurrent] = useState(text)
  const [previous, setPrevious] = useState<string | null>(null)

  useEffect(() => {
    if (text === current) return
    setPrevious(current)
    setCurrent(text)
    const id = setTimeout(() => setPrevious(null), LIFECYCLE_LABEL_FADE_MS)
    return () => clearTimeout(id)
  }, [text, current])

  return (
    <span className="status-lifecycle-copy">
      {previous != null && (
        <span className="status-lifecycle-label is-leave" aria-hidden="true">
          {previous}
        </span>
      )}
      <span className="status-lifecycle-label" data-lifecycle-label={current}>
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
