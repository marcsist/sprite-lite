export type LaunchRoute = 'usage' | 'cast'

function basePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '')
}

export function launchPath(route: LaunchRoute): string {
  return `${basePath()}/launch/${route}`
}

export function currentLaunch(): LaunchRoute | null {
  const base = basePath()
  let path = window.location.pathname.replace(/\/$/, '')
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (path === '/launch/usage') return 'usage'
  if (path === '/launch/cast') return 'cast'
  return null
}
