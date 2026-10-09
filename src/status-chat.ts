import {
  STATUS_DURATION,
  STATUS_SPEED_DEFAULT,
  resolveStatusDuration,
  type StatusVariant,
} from './status'

export const CHAT_SPRITE_SIZE = 20
export const CHAT_BUSY_LOOPS = 2
export const CHAT_READY_HOLD_MS = 2000
export const CHAT_LABEL_FADE_MS = 150

export const CHAT_BUSY_STEPS: readonly { variant: StatusVariant; label: string }[] = [
  { variant: 'Wait', label: 'Queued' },
  { variant: 'Think', label: 'Thinking' },
  { variant: 'Work', label: 'Running tools' },
  { variant: 'Sync', label: 'Retraining' },
]

export const CHAT_FROZEN_STEP = 1

export const CHAT_FRAGMENT_COPY =
  'Looks like a race in the session store. I serialised the cart writes.\n…and the checkout test passes locally now. I\'ll run the full suite next.'

export const CHAT_DONE_COPY = 'Done — all 214 tests pass.'
export const CHAT_INPUT_PLACEHOLDER = 'Message your bot'

export function chatHoldMs(
  variant: StatusVariant,
  speed: number = STATUS_SPEED_DEFAULT
): number {
  if (variant === 'Ready') return CHAT_READY_HOLD_MS
  const loop = resolveStatusDuration(variant, undefined, speed) ?? STATUS_DURATION[variant]
  return CHAT_BUSY_LOOPS * loop
}
