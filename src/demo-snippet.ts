export const THINKING_DEFAULTS: Record<string, unknown> = {
  size: 16,
  active: true,
  speed: 90,
  shape: 'square',
  dotRadius: 0.38,
}

export const WRITE_DEFAULTS: Record<string, unknown> = {
  text: 'HELLO',
  size: 16,
  speed: 90,
  active: true,
  shape: 'square',
  dotRadius: 0.38,
}

export const STATUS_DEFAULTS: Record<string, unknown> = {
  size: 16,
  active: true,
  speed: 90,
  shape: 'dot',
  dotRadius: 0.32,
}

export function formatSnippet(
  componentName: string,
  props: Record<string, unknown>,
  defaults: Record<string, unknown>
): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue
    if (key in defaults && JSON.stringify(value) === JSON.stringify(defaults[key])) continue
    lines.push(typeof value === 'string' ? `  ${key}="${value}"` : `  ${key}={${JSON.stringify(value)}}`)
  }
  return lines.length === 0 ? `<${componentName} />` : `<${componentName}\n${lines.join('\n')}\n/>`
}
