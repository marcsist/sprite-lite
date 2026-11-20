import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Demo } from './demo'
import { LaunchCast } from './launch/cast'
import { LaunchLed } from './launch/led'
import { LaunchUsage } from './launch/usage'
import { currentLaunch } from './launch/routes'

function Root() {
  const route = currentLaunch()
  if (route === 'usage') return <LaunchUsage />
  if (route === 'cast') return <LaunchCast />
  if (route === 'led') return <LaunchLed />
  return <Demo />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
