import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker'

registerServiceWorker()

// Handle stale chunk hash 404s on new deployments gracefully without rapid reload loops
window.addEventListener('vite:preloadError', (event: any) => {
  event?.preventDefault?.()
  const lastReload = parseInt(sessionStorage.getItem('vite-preload-reload') || '0', 10)
  const now = Date.now()
  if (now - lastReload > 30000) {
    sessionStorage.setItem('vite-preload-reload', String(now))
    console.warn('New asset version detected. Reloading page once...')
    window.location.reload()
  } else {
    console.warn('Preload retry suppressed to prevent reload loop.')
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
