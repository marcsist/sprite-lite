import {
  STATUS_DURATION,
  STATUS_SPEED_DEFAULT,
  resolveStatusDuration,
  type StatusVariant,
} from './status'

export const LIFECYCLE_STEPS: readonly { variant: StatusVariant; label: string }[] = [
  { variant: 'Wait', label: 'Queued' },
  { variant: 'Think', label: 'Thinking' },
  { variant: 'Work', label: 'Running tools' },
  { variant: 'Sync', label: 'Retraining' },
  { variant: 'Ready', label: 'Ready' },
]

export const LIFECYCLE_BUSY_LOOPS = 2
export const LIFECYCLE_READY_HOLD_MS = 2000
export const LIFECYCLE_LABEL_FADE_MS = 150

export function lifecycleHoldMs(
  variant: StatusVariant,
  speed: number = STATUS_SPEED_DEFAULT
): number {
  if (variant === 'Ready') return LIFECYCLE_READY_HOLD_MS
  const loop = resolveStatusDuration(variant, undefined, speed) ?? STATUS_DURATION[variant]
  return LIFECYCLE_BUSY_LOOPS * loop
}
