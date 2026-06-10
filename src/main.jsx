import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { installBenignMediaErrorGuard } from '@/lib/ignoreBenignMediaErrors'

installBenignMediaErrorGuard()

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