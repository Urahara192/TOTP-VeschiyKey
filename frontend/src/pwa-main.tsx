import React from 'react'
import ReactDOM from 'react-dom/client'
import PWAApp from '@/pwa/PWAApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PWAApp />
  </React.StrictMode>
)
