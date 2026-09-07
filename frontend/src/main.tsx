import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import L from './lib/leafletSetup'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker'

if (typeof window !== 'undefined') {
  ;(window as any).L = L
  ;(window as any).global = window
  ;(globalThis as any).L = L
}

registerServiceWorker()

// Handle stale chunk hash 404s on new deployment deployments automatically
window.addEventListener('vite:preloadError', () => {
  console.warn('New version detected. Reloading page to fetch latest application assets...')
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
