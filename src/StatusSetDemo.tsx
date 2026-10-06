import { useState } from 'react'
import { StatusSprite, type StatusVariant } from './StatusSprite'
import { STATUS_VARIANTS } from './status'

const LIGHT: [string, string] = ['#141414', '#d6d6d6']
const DARK: [string, string] = ['#ededed', '#3a3a3a']
const SIZES = [12, 16, 20] as const

const DEMO_MEANINGS: Record<StatusVariant, string> = {
  Wait: 'queued · waiting on input',
  Think: 'composing',
  Work: 'running tools',
  Sync: 'retraining · deploying',
  Ready: 'idle · done',
}

export function StatusSetDemo() {
  const [reducedMotion, setReducedMotion] = useState(false)

  return (
    <section className="status-set" id="status-set" aria-labelledby="status-set-title">
      <div className="status-set-header">
        <div>
          <h2 id="status-set-title">3×3 status set</h2>
          <p>
            Quiet lights for product chrome. Five states, no cycling. Motion carries the meaning;
            colour stays neutral.
          </p>
        </div>
        <label className="status-set-toggle">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
          Reduced motion
        </label>
      </div>

      {(['light', 'dark'] as const).map((theme) => (
        <div
          key={theme}
          className={`status-canvas ${theme}`}
          data-status-canvas={theme}
          data-reduced-motion={reducedMotion ? 'true' : 'false'}
        >
          <h3>{theme === 'light' ? 'Light' : 'Dark'}</h3>
          {SIZES.map((size) => (
            <div key={size} className="status-size-row" data-status-size={size}>
              <span className="status-size-label">{size}px</span>
              <div className="status-row">
                {STATUS_VARIANTS.map((variant) => (
                  <StatusCell
                    key={variant}
                    variant={variant}
                    size={size}
                    color={theme === 'light' ? LIGHT : DARK}
                    active={!reducedMotion}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

function StatusCell({
  variant,
  size,
  color,
  active,
}: {
  variant: StatusVariant
  size: number
  color: [string, string]
  active: boolean
}) {
  return (
    <div className="status-item" data-status-variant={variant} data-status-active={active ? 'true' : 'false'}>
      <StatusSprite variant={variant} size={size} color={color} active={active} />
      <span className="status-item-name">{variant}</span>
      <span className="status-item-meaning">{DEMO_MEANINGS[variant]}</span>
    </div>
  )
}
