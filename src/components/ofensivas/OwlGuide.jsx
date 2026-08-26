import React, { useMemo } from 'react';

const GREETINGS = [
  'Oi, {name}! Que bom te ver por aqui hoje 🥳',
  'Bem-vindo de volta, {name}! Vamos aquecer a mente? 🔥',
  'E aí, {name}! Preparado para a ofensiva de hoje? 💪',
  'Olá, {name}! Sua constância me deixa orgulhosa 🦉',
];

/**
 * Corujinha animada da ofensiva — pisca, balança e dá as boas-vindas em um
 * balãozinho de fala para quem está chegando.
 */
export default function OwlGuide({ name = 'aluno', status }) {
  const greeting = useMemo(() => {
    const pick = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    return pick.replace('{name}', String(name || 'aluno').split(' ')[0]);
  }, [name]);

  return (
    <div className="mb-5 flex flex-col items-center">
      <div className="ofensiva-bubble relative max-w-[240px] rounded-2xl border border-border bg-card px-3.5 py-2 text-center text-xs font-semibold text-foreground shadow-lg">
        {greeting}
        <span className="absolute left-1/2 -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-card" />
      </div>
      <div className="ofensiva-owl mt-3 text-5xl" role="img" aria-label="Corujinha guia">🦉</div>
      {status && (
        <div className="ofensiva-status mt-2 max-w-[220px] rounded-xl border border-border bg-card px-3 py-1.5 text-center text-xs font-semibold text-foreground shadow">
          {status}
        </div>
      )}
    </div>
  );
}