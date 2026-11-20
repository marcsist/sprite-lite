import { useEffect } from 'react'
import { ThinkingSprite } from '../ThinkingSprite'
import type { VariantName } from '../variants'
import { LaunchNav } from './nav'
import { usePrefersReducedMotion } from './reduced'
import './launch.css'

const PHOSPHOR: [string, string] = ['#dcff6a', '#0c1a10']

export function LaunchLed() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const previous = document.title
    document.title = 'CRT — sprite-lite'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="launch led-stage">
      <main className="crt" data-launch="led" aria-label="A CRT showing lite-brite sprites">
        <div className="crt-glass">
          <div className="crt-picture">
            <Led name="Rain" size={112} className="crt-rain" active={!reduced} speed={80} />
            <Led name="Face" size={320} className="crt-face" active={!reduced} speed={140} />
            <Led name="Invader" size={148} className="crt-invader" active={!reduced} speed={100} />
          </div>
          <div className="crt-scan" aria-hidden="true" />
          <div className="crt-glare" aria-hidden="true" />
        </div>
        <div className="crt-chin">
          <span className="crt-power" aria-hidden="true" />
          <span>CH 03</span>
        </div>
      </main>
      <LaunchNav current="led" />
    </div>
  )
}

function Led({
  name,
  size,
  className,
  active,
  speed,
}: {
  name: VariantName
  size: number
  className: string
  active: boolean
  speed: number
}) {
  return (
    <div className={`crt-led ${className}`}>
      <ThinkingSprite
        variant={name}
        size={size}
        shape="dot"
        dotRadius={0.32}
        color={PHOSPHOR}
        speed={speed}
        active={active}
      />
    </div>
  )
}
