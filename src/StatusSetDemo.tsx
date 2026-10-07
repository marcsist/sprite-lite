import { StatusSprite, type StatusVariant } from './StatusSprite'
import { StatusLifecycle } from './StatusLifecycle'
import { STATUS_VARIANTS } from './status'

export function StatusSetDemo({
  size,
  speed,
  active,
  color,
  shape,
  dotRadius,
  selected,
  onSelect,
}: {
  size: number
  speed: number
  active: boolean
  color: string | [string, string]
  shape: 'dot' | 'square'
  dotRadius: number
  selected?: StatusVariant
  onSelect: (variant: StatusVariant) => void
}) {
  return (
    <section className="status-set" id="status-set" aria-labelledby="status-set-title">
      <div className="status-set-header">
        <h2 id="status-set-title">3×3 status set</h2>
        <p>Five quiet status lights.</p>
      </div>
      <div className="status-row">
        <div className="status-states">
          {STATUS_VARIANTS.map((variant) => (
            <button
              key={variant}
              type="button"
              className={`status-item${selected === variant ? ' is-selected' : ''}`}
              data-status-variant={variant}
              aria-pressed={selected === variant}
              onClick={() => onSelect(variant)}
              onFocus={() => onSelect(variant)}
            >
              <StatusSprite
                variant={variant}
                size={size}
                color={color}
                shape={shape}
                dotRadius={dotRadius}
                speed={speed}
                active={active}
              />
              <span className="status-item-name">{variant}</span>
            </button>
          ))}
        </div>
        <StatusLifecycle
          size={size}
          speed={speed}
          active={active}
          color={color}
          shape={shape}
          dotRadius={dotRadius}
        />
      </div>
    </section>
  )
}
