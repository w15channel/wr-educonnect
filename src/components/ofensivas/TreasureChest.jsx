import React from 'react';

/**
 * Baú do Saber — baú desenhado em SVG com tampa animada, brilho dourado e
 * moedinhas saltando quando está disponível.
 */
export default function TreasureChest({ state = 'open' }) {
  const isDone = state === 'done';
  const isLocked = state === 'locked';

  return (
    <div className={`ofensiva-chest ${isDone ? 'ofensiva-chest--done' : isLocked ? 'ofensiva-chest--locked' : 'ofensiva-chest--ready'}`}>
      <svg viewBox="0 0 64 56" className="h-14 w-16" aria-hidden="true">
        {/* Tampa */}
        <g className="ofensiva-chest__lid">
          <path d="M6 24C6 14 17 7 32 7s26 7 26 17v3H6v-3Z" fill="#b4671f" />
          <path d="M6 24C6 14 17 7 32 7s26 7 26 17H6Z" fill="#d98b32" />
          <rect x="6" y="22" width="52" height="5" rx="2" fill="#f2c14e" />
        </g>
        {/* Corpo */}
        <rect x="6" y="27" width="52" height="24" rx="4" fill="#b4671f" />
        <rect x="6" y="31" width="52" height="4" fill="#f2c14e" />
        <rect x="26" y="24" width="12" height="16" rx="3" fill="#f2c14e" />
        <circle cx="32" cy="33" r="3" fill="#7a3d09" />
        <rect x="30.5" y="33" width="3" height="6" rx="1.5" fill="#7a3d09" />
      </svg>
      {!isLocked && !isDone && (
        <>
          <span className="ofensiva-coin ofensiva-coin--1">✨</span>
          <span className="ofensiva-coin ofensiva-coin--2">🪙</span>
        </>
      )}
    </div>
  );
}