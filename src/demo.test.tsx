import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Demo } from './demo'
import { VARIANTS } from './variants'

afterEach(() => {
  cleanup()
})

describe('simplified thinking demo', () => {
  it('shows one EKG preview and a static gallery', () => {
    render(<Demo />)

    expect(screen.getByRole('heading', { name: `All ${VARIANTS.length} variants.` })).toBeTruthy()
    expect(screen.queryByText('Lock variant')).toBeNull()
    expect(screen.queryByText('Subset cycling')).toBeNull()
    expect(screen.queryByText('Keyboard navigation')).toBeNull()
    expect(screen.queryByText(/locked:/)).toBeNull()
    expect(screen.queryByText(/cycling/)).toBeNull()

    const snippet = document.querySelector('[data-snippet-kind="thinking"]')
    expect(snippet?.textContent ?? '').not.toContain('variants')

    const tile = screen.getAllByText('DNA').find((el) => el.tagName === 'SPAN')?.parentElement as HTMLElement
    expect(tile.getAttribute('style') ?? '').not.toMatch(/pointer|00ff88/)
    fireEvent.click(tile)
    expect(screen.queryByText(/locked:/)).toBeNull()
    expect(screen.queryByText(/cycling/)).toBeNull()
    expect(tile.getAttribute('style') ?? '').not.toMatch(/00ff88/)
  })
})
