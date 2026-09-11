import React from 'react';

/** Conteúdo de uma etapa do tutorial da Luna — letras grandes e itens diretos. */
export default function LunaTutorialStep({ step }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">{step.subtitle}</p>
      <h2 className="mt-1 text-lg font-black leading-snug text-foreground">
        {step.emoji} {step.title}
      </h2>
      <ul className="mt-3 space-y-2.5">
        {step.bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/60 p-3">
            <span className="text-lg leading-none">{bullet.icon}</span>
            <span className="text-[13px] font-semibold leading-snug text-foreground">{bullet.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}