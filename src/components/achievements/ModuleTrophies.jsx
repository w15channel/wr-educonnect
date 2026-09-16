import React from 'react';
import { Trophy } from 'lucide-react';
import { trophyForModule } from '@/lib/moduleAchievements';

export default function ModuleTrophies({ completions = [], compact = false }) {
  if (!completions.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1" aria-label={`${completions.length} troféus de módulo`}>
      {completions.map((item) => {
        const trophy = trophyForModule(item.moduleNumber);
        return <span key={item.moduleNumber} title={`Troféu do Módulo ${item.moduleNumber}`} className={`inline-flex items-center justify-center rounded-full border ${trophy.surface} ${compact ? 'h-5 w-5' : 'h-7 w-7'}`}><Trophy className={trophy.color} size={compact ? 12 : 15} /></span>;
      })}
    </span>
  );
}