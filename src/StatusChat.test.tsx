import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StatusChat } from './StatusChat'
import { StatusSetDemo } from './StatusSetDemo'
import { formatSnippet, STATUS_DEFAULTS } from './demo-snippet'
import {
  CHAT_BUSY_STEPS,
  CHAT_DONE_COPY,
  CHAT_INPUT_PLACEHOLDER,
  chatHoldMs,
} from './status-chat'

const LIGHTS = {
  speed: 90,
  color: ['#ededed', '#3a3a3a'] as [string, string],
  shape: 'dot' as const,
  dotRadius: 0.38,
}

const SET_LIGHTS = {
  ...LIGHTS,
  size: 32,
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') && query.includes('reduce') ? matches : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

function chatOf(container: HTMLElement) {
  const root = container.querySelector('[data-chat]')
  return {
    variant: root?.getAttribute('data-chat-variant'),
    phase: root?.getAttribute('data-chat-phase'),
    shimmer: root?.getAttribute('data-chat-shimmer'),
    label: container.querySelector('[data-chat-label]')?.textContent,
    done: container.querySelector('[data-chat-done]')?.classList.contains('is-shown'),
    statusHidden: container.querySelector('[data-chat-status]')?.classList.contains('is-hidden'),
    labelShimmer: container.querySelector('[data-chat-label]')?.classList.contains('is-shimmer'),
  }
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  mockMatchMedia(false)
})

describe('StatusChat', () => {
  it('advances Queued → Thinking → Running tools → Retraining on each hold', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusChat {...LIGHTS} active />)
    expect(chatOf(container)).toMatchObject({
      variant: 'Wait',
      phase: 'busy',
      label: 'Queued',
      shimmer: 'true',
    })

    act(() => {
      vi.advanceTimersByTime(chatHoldMs('Wait') - 1)
    })
    expect(chatOf(container).label).toBe('Queued')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(chatOf(container)).toMatchObject({ variant: 'Think', label: 'Thinking' })

    act(() => {
      vi.advanceTimersByTime(chatHoldMs('Think'))
    })
    expect(chatOf(container)).toMatchObject({ variant: 'Work', label: 'Running tools' })

    act(() => {
      vi.advanceTimersByTime(chatHoldMs('Work'))
    })
    expect(chatOf(container)).toMatchObject({ variant: 'Sync', label: 'Retraining' })
  })

  it('scales the first hold when speed changes', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusChat {...LIGHTS} speed={45} active />)
    act(() => {
      vi.advanceTimersByTime(chatHoldMs('Wait', 45) - 1)
    })
    expect(chatOf(container).label).toBe('Queued')
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(chatOf(container).label).toBe('Thinking')
  })

  it('swaps the status line for the done bubble, then resets to Queued', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusChat {...LIGHTS} active />)
    act(() => {
      vi.advanceTimersByTime(
        chatHoldMs('Wait') + chatHoldMs('Think') + chatHoldMs('Work') + chatHoldMs('Sync')
      )
    })
    const ready = chatOf(container)
    expect(ready.phase).toBe('ready')
    expect(ready.variant).toBe('Ready')
    expect(ready.shimmer).toBe('false')
    expect(ready.done).toBe(true)
    expect(ready.statusHidden).toBe(true)
    expect(ready.labelShimmer).toBe(false)
    expect(container.querySelector('[data-chat-done]')?.textContent).toBe(CHAT_DONE_COPY)

    act(() => {
      vi.advanceTimersByTime(chatHoldMs('Ready') - 1)
    })
    expect(chatOf(container).phase).toBe('ready')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    const reset = chatOf(container)
    expect(reset.phase).toBe('busy')
    expect(reset.variant).toBe('Wait')
    expect(reset.label).toBe('Queued')
    expect(reset.done).toBe(false)
    expect(reset.statusHidden).toBe(false)
    expect(reset.shimmer).toBe('true')
  })

  it('freezes on Think with no shimmer when Active is off', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusChat {...LIGHTS} active={false} />)
    expect(chatOf(container)).toMatchObject({
      variant: 'Think',
      phase: 'busy',
      label: 'Thinking',
      shimmer: 'false',
      labelShimmer: false,
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(chatOf(container).label).toBe('Thinking')
    expect(chatOf(container).labelShimmer).toBe(false)
  })

  it('freezes on Think with no shimmer when prefers-reduced-motion is set', () => {
    mockMatchMedia(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<StatusChat {...LIGHTS} active />)
    expect(chatOf(container)).toMatchObject({
      variant: 'Think',
      label: 'Thinking',
      shimmer: 'false',
      labelShimmer: false,
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(chatOf(container).variant).toBe('Think')
    expect(chatOf(container).labelShimmer).toBe(false)
  })

  it('keeps the decorative input inert and unfocusable', () => {
    const { container } = render(<StatusChat {...LIGHTS} active />)
    const input = container.querySelector('.status-chat-input')
    expect(input).not.toBeNull()
    expect(input?.tagName).not.toBe('INPUT')
    expect(input?.getAttribute('aria-hidden')).toBe('true')
    expect(input?.hasAttribute('inert')).toBe(true)
    expect(input?.textContent).toContain(CHAT_INPUT_PLACEHOLDER)
    expect(container.querySelector('input')).toBeNull()
  })

  it('is labelled for assistive tech without a live region or focus target', () => {
    const { container, getByLabelText } = render(<StatusChat {...LIGHTS} active />)
    const example = getByLabelText('Chat status example')
    expect(example.getAttribute('aria-live')).toBeNull()
    expect(container.querySelector('[aria-live]')).toBeNull()
    expect(example.getAttribute('tabIndex')).toBeNull()
  })

  it('pins the sprite at 20px even when the playground size is larger', () => {
    const { container } = render(
      <StatusSetDemo {...SET_LIGHTS} active selected={undefined} onSelect={() => {}} />
    )
    const fragmentSvg = container.querySelector('.status-chat-sprite svg')
    expect(fragmentSvg?.getAttribute('width')).toBe('20')
    expect(fragmentSvg?.getAttribute('height')).toBe('20')
  })
})

describe('chat example vs CODE snippet', () => {
  it('does not change the selected StatusSprite snippet', () => {
    const onSelect = vi.fn()
    const { getByLabelText } = render(
      <StatusSetDemo {...SET_LIGHTS} active selected={undefined} onSelect={onSelect} />
    )
    fireEvent.click(getByLabelText('Chat status example'))
    fireEvent.focus(getByLabelText('Chat status example'))
    expect(onSelect).not.toHaveBeenCalled()

    const snippet = formatSnippet(
      'StatusSprite',
      {
        variant: 'Wait',
        size: 32,
        color: SET_LIGHTS.color,
        shape: 'dot',
        speed: 90,
        active: true,
        dotRadius: 0.38,
      },
      STATUS_DEFAULTS
    )
    expect(snippet).toContain('variant="Wait"')
    for (const { label } of CHAT_BUSY_STEPS) {
      expect(snippet).not.toContain(label)
    }
    expect(snippet).not.toContain(CHAT_INPUT_PLACEHOLDER)
    expect(snippet).not.toContain(CHAT_DONE_COPY)
  })
})
