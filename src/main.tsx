import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AppProvider } from './store/AppContext'
import './styles.css'
import './pages.css'
import './extras.css'
import './responsive.css'
import './share.css'
import './motion.css'
import './moki.css'
import './moki-correction.css'
import './incense.css'
import './incense-timing.css'
import './incense-sequence.css'
import './incense-window-fix.css'
import './firebase.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider><App /></AppProvider>
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js')
