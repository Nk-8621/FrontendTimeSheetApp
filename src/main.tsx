import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/theme-new.css'
import App from './App.tsx'
import { applyTheme, getSavedTheme } from './lib/theme'

// NEW LOOK (Nov 2026): show the look this browser chose last time, before the first paint.
applyTheme(getSavedTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
