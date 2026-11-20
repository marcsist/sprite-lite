import { useSyncExternalStore } from 'react'

const REDUCE_MQ = '(prefers-reduced-motion: reduce)'

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(REDUCE_MQ).matches
}

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(REDUCE_MQ)
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }
  mq.addListener(onChange)
  return () => mq.removeListener(onChange)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
}
