import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker'

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
