import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { installBenignMediaErrorGuard } from '@/lib/ignoreBenignMediaErrors'

installBenignMediaErrorGuard()

// ──────────────────────────────────────────────────────────────────────────
// Responsive tablet overrides (768–1023px)
//
// Injected at runtime so they override the bundled index.css rules.
// Provides intermediate font-size and content width between mobile and desktop.
// ──────────────────────────────────────────────────────────────────────────
const tabletOverrides = document.createElement('style')
tabletOverrides.textContent = `
  @media (min-width: 768px) and (max-width: 1023px) {
    html { font-size: 15.5px; }
    .app-page, .internal-page-shell { max-width: min(100%, 48rem); }
    .app-page--wide, .app-page--narrow, .app-page--compact, .internal-page-shell { max-width: min(100%, 56rem); }
  }
`
document.head.appendChild(tabletOverrides)

// Apply saved theme BEFORE first render to prevent flash
;(function() {
  const saved = localStorage.getItem('wr_theme') || 'dark';
  const root = document.documentElement;
  if (saved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)