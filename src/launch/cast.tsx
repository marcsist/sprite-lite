import { useEffect } from 'react'
import { ThinkingSprite } from '../ThinkingSprite'
import type { VariantName } from '../variants'
import { LaunchNav } from './nav'
import { usePrefersReducedMotion } from './reduced'
import './launch.css'

export function LaunchCast() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const previous = document.title
    document.title = 'Night shift — sprite-lite'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="launch">
      <main className="cast-stage" data-launch="cast" aria-labelledby="cast-title">
        <div className="cast-copy">
          <h1 id="cast-title">
            They keep
            <br />
            their own hours.
          </h1>
        </div>

        <div className="cast-room" aria-hidden="true">
          <div className="cast-window">
            <Actor name="Rain" size={96} color="#b7c4be" className="cast-rain" active={!reduced} />
            <Actor name="Spark" size={56} color="#e4f56a" className="cast-firefly" active={!reduced} speed={70} />
            <Actor name="Invader" size={120} color="#d5e2ea" className="cast-invader" active={!reduced} speed={110} />
          </div>

          <div className="cast-glow" />
          <div className="cast-desk" />

          <Actor name="Ghost" size={136} color="#ddd6ee" className="cast-ghost" active={!reduced} speed={120} />
          <Actor name="Tamagotchi" size={120} color="#f0d8c8" className="cast-tama" active={!reduced} speed={110} />
          <Actor name="Campfire" size={104} color="#ffb25a" className="cast-fire" active={!reduced} speed={80} />
          <Actor name="Hourglass" size={112} color="#e4d5c0" className="cast-glass" active={!reduced} speed={100} />
          <Actor name="Face" size={88} color="#f3f1ec" className="cast-face" active={!reduced} speed={150} />
        </div>
      </main>

      <LaunchNav current="cast" />
    </div>
  )
}

function Actor({
  name,
  size,
  color,
  className,
  active,
  speed = 100,
}: {
  name: VariantName
  size: number
  color: string
  className: string
  active: boolean
  speed?: number
}) {
  return (
    <div className={`cast-actor ${className}`}>
      <ThinkingSprite variant={name} size={size} color={color} speed={speed} active={active} shape="square" />
    </div>
  )
}
