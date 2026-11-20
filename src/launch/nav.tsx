import { launchPath, type LaunchRoute } from './routes'

const LABEL: Record<LaunchRoute, string> = {
  usage: 'Usage',
  cast: 'Cast',
  led: 'LED',
}

export function LaunchNav({ current }: { current: LaunchRoute }) {
  const others = (Object.keys(LABEL) as LaunchRoute[]).filter((route) => route !== current)

  return (
    <footer className="launch-credit">
      <span>sprite-lite</span>
      <nav aria-label="Launch demos">
        {others.map((route) => (
          <a key={route} href={launchPath(route)}>
            {LABEL[route]}
          </a>
        ))}
      </nav>
    </footer>
  )
}
