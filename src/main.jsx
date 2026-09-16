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

// ──────────────────────────────────────────────────────────────────────────
// Dark theme contrast overrides
//
// Many components use Tailwind light-only classes (bg-red-50, text-yellow-600,
// etc.) without corresponding dark: variants. Rather than rewriting 50KB+
// of JSX, these CSS rules provide dark-mode overrides for those classes.
// The <style> tag is appended AFTER bundled CSS, so same-specificity rules
// here win by source order. Higher-specificity selectors (e.g. .dark .bg-*)
// always win regardless of order.
// ──────────────────────────────────────────────────────────────────────────
const darkThemeOverrides = document.createElement('style')
darkThemeOverrides.textContent = `
  /* Fix harsh dark:bg-white / dark:text-black overrides (Dashboard mural, ClassChat achievements) */
  .dark .dark\\:bg-white { background-color: hsl(var(--card)) !important; }
  .dark .dark\\:text-black { color: hsl(var(--card-foreground)) !important; }
  .dark .dark\\:border-white { border-color: hsl(var(--border)) !important; }
  .dark .dark\\:!text-black { color: hsl(var(--card-foreground)) !important; }
  .dark .dark\\:border-white\\/20 { border-color: hsl(var(--border) / 0.3) !important; }
  .dark .dark\\:bg-black { background-color: hsl(var(--card)) !important; }

  /* Light-only background colors → dark equivalents */
  .dark .bg-red-50 { background-color: hsl(0 62% 14%); }
  .dark .bg-red-50\\/50 { background-color: hsl(0 62% 14% / 0.5); }
  .dark .bg-yellow-50 { background-color: hsl(45 58% 14%); }
  .dark .bg-yellow-50\\/50 { background-color: hsl(45 58% 14% / 0.5); }
  .dark .bg-yellow-100 { background-color: hsl(45 58% 14%); }
  .dark .bg-green-50 { background-color: hsl(142 50% 14%); }
  .dark .bg-rose-50 { background-color: hsl(346 56% 14%); }
  .dark .bg-rose-50\\/40 { background-color: hsl(346 56% 14% / 0.4); }
  .dark .bg-rose-50\\/70 { background-color: hsl(346 56% 14% / 0.7); }
  .dark .bg-amber-50 { background-color: hsl(38 58% 14%); }
  .dark .bg-amber-50\\/80 { background-color: hsl(38 58% 14% / 0.8); }
  .dark .bg-amber-50\\/50 { background-color: hsl(38 58% 14% / 0.5); }
  .dark .bg-violet-50 { background-color: hsl(262 52% 14%); }
  .dark .bg-sky-50 { background-color: hsl(200 64% 14%); }
  .dark .bg-indigo-50 { background-color: hsl(239 64% 14%); }
  .dark .bg-indigo-50\\/95 { background-color: hsl(239 64% 14% / 0.95); }

  /* Light-only text colors → dark equivalents */
  .dark .text-yellow-600 { color: hsl(45 58% 60%); }
  .dark .text-yellow-700 { color: hsl(45 58% 55%); }
  .dark .text-yellow-800 { color: hsl(45 58% 60%); }
  .dark .text-rose-600 { color: hsl(346 56% 65%); }
  .dark .text-rose-700 { color: hsl(346 56% 60%); }
  .dark .text-green-700 { color: hsl(142 50% 55%); }
  .dark .text-violet-950 { color: hsl(262 30% 85%); }
  .dark .text-violet-700 { color: hsl(262 52% 70%); }
  .dark .text-violet-600 { color: hsl(262 52% 65%); }
  .dark .text-violet-800 { color: hsl(262 40% 70%); }
  .dark .text-amber-800 { color: hsl(38 58% 65%); }
  .dark .text-amber-700 { color: hsl(38 58% 60%); }
  .dark .text-sky-700 { color: hsl(200 64% 60%); }
  .dark .text-sky-800 { color: hsl(200 64% 55%); }
  .dark .text-indigo-800 { color: hsl(239 64% 65%); }
  .dark .text-slate-600 { color: hsl(215 16% 65%); }
  .dark .text-slate-500 { color: hsl(215 16% 60%); }
  .dark .text-slate-900 { color: hsl(215 28% 90%); }

  /* Light-only border colors → dark equivalents */
  .dark .border-red-100 { border-color: hsl(0 30% 25%); }
  .dark .border-red-200 { border-color: hsl(0 30% 25%); }
  .dark .border-rose-100 { border-color: hsl(346 30% 25%); }
  .dark .border-rose-200 { border-color: hsl(346 30% 25%); }
  .dark .border-green-200 { border-color: hsl(142 30% 25%); }
  .dark .border-violet-200 { border-color: hsl(262 30% 25%); }
  .dark .border-violet-300 { border-color: hsl(262 30% 30%); }
  .dark .border-amber-200 { border-color: hsl(38 30% 25%); }
  .dark .border-amber-300 { border-color: hsl(38 30% 30%); }
  .dark .border-sky-200 { border-color: hsl(200 30% 25%); }
  .dark .border-indigo-200 { border-color: hsl(239 30% 25%); }
  .dark .border-yellow-200 { border-color: hsl(45 30% 25%); }
  .dark .border-yellow-300 { border-color: hsl(45 30% 30%); }

  /* Gradients with light-only stops */
  .dark .from-rose-50 { --tw-gradient-from: hsl(346 56% 14%); }
  .dark .from-rose-50\\/40 { --tw-gradient-from: hsl(346 56% 14% / 0.4); }
  .dark .to-amber-50 { --tw-gradient-to: hsl(38 58% 14%); }
  .dark .from-sky-50 { --tw-gradient-from: hsl(200 64% 14%); }
  .dark .to-indigo-50 { --tw-gradient-to: hsl(239 64% 14%); }

  /* White-background elements that need dark variants */
  .dark .bg-white { background-color: hsl(var(--card)); }
  .dark .bg-white\\/70 { background-color: hsl(var(--card) / 0.7); }
  .dark .bg-white\\/90 { background-color: hsl(var(--card) / 0.9); }
  .dark .hover\\:bg-white:hover { background-color: hsl(var(--card)); }
  .dark .hover\\:bg-slate-100:hover { background-color: hsl(var(--secondary)); }
  .dark .hover\\:bg-rose-50:hover { background-color: hsl(346 56% 14%); }
  .dark .hover\\:bg-rose-100:hover { background-color: hsl(346 56% 14%); }
  .dark .hover\\:bg-amber-100:hover { background-color: hsl(38 58% 14%); }
  .dark .hover\\:bg-violet-100:hover { background-color: hsl(262 52% 14%); }
  .dark .hover\\:bg-yellow-50:hover { background-color: hsl(45 58% 14%); }
`
document.head.appendChild(darkThemeOverrides)

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