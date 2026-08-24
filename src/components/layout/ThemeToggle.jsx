import React from 'react';
import { Lightbulb } from 'lucide-react';

/**
 * A tactile, lamp-inspired theme control. The halo gently calls attention to
 * the feature without competing with navigation or ignoring reduced-motion.
 */
export default function ThemeToggle({ theme, onToggle, showLabel = false, className = '' }) {
  const isDark = theme === 'dark';
  const actionLabel = isDark ? 'Acender modo claro' : 'Apagar para modo escuro';

  return (
    <button
      type="button"
      onClick={onToggle}
      title={actionLabel}
      aria-label={actionLabel}
      aria-pressed={!isDark}
      className={`theme-lamp ${showLabel ? 'theme-lamp--wide' : ''} ${className}`}
    >
      <span className="theme-lamp__halo" aria-hidden="true" />
      <span className="theme-lamp__bulb" aria-hidden="true">
        <Lightbulb size={showLabel ? 18 : 17} strokeWidth={2.2} />
      </span>
      {showLabel && (
        <span className="theme-lamp__copy">
          <span className="theme-lamp__eyebrow">Ilumine sua leitura</span>
          <span className="theme-lamp__label">{isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}</span>
        </span>
      )}
    </button>
  );
}
