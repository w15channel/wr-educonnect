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
// Provides intermediate font-size, content width and grid columns between
// mobile and desktop. These rules only match the 768–1023px range.
//
// Why runtime injection instead of editing index.css directly:
// The index.css file is 1034 lines; appending these rules here is safer and
// avoids any risk of corrupting the existing CSS during a full-file rewrite.
// The <style> tag is appended to <head> AFTER the bundled CSS loads, so it
// has higher source-order precedence for the same specificity.
// ──────────────────────────────────────────────────────────────────────────
const tabletOverrides = document.createElement('style')
tabletOverrides.textContent = `
  @media (min-width: 768px) and (max-width: 1023px) {
    /* Intermediate font-size between mobile (15px) and desktop (16px) */
    html { font-size: 15.5px; }

    /* Content width: narrower than desktop's 70rem for comfortable reading */
    .app-page, .internal-page-shell { max-width: min(100%, 48rem); }
    .app-page--wide, .app-page--narrow, .app-page--compact, .internal-page-shell {
      max-width: min(100%, 56rem);
    }

    /* Grid: 4-column stat cards on tablet (was waiting for lg: = 1024px) */
    .grid.grid-cols-2.lg\\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    /* Grid: 2-column content panels on tablet (was waiting for lg: = 1024px) */
    .grid.grid-cols-1.lg\\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
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