import React from 'react';
import { Award, Gem } from 'lucide-react';
import ModuleTrophies from '@/components/achievements/ModuleTrophies';

const medal = (rank) => Number(rank) === 1 ? '🥇' : Number(rank) === 2 ? '🥈' : '🥉';

export default function AchievementShowcase({ trophies = [], monitorAwards = [], contributionAwards = [], dark = false }) {
  const isEmpty = !trophies.length && !monitorAwards.length && !contributionAwards.length;
  return (
    <div className={`mt-4 rounded-xl border p-3 ${dark ? 'border-white/15 bg-white/5' : 'border-border bg-secondary/30'}`}>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${dark ? 'text-white/70' : 'text-muted-foreground'}`}><Award size={13} /> Conquistas</p>
      {isEmpty ? <p className={`text-xs ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>As medalhas e troféus conquistados aparecerão aqui.</p> : <div className="flex flex-wrap items-center gap-2"><ModuleTrophies completions={trophies} />{monitorAwards.map((item) => <span key={item.id} title={`Monitor da turma · ${item.rank_position}º lugar`} className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/15 px-1 text-base">{medal(item.rank_position)}</span>)}{contributionAwards.map((item) => <span key={item.id} title="Diamante da Contribuição" aria-label="Diamante da Contribuição" className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-cyan-300 bg-cyan-100 px-1 text-cyan-800 shadow-sm dark:border-cyan-400/60 dark:bg-cyan-950 dark:text-cyan-200"><Gem size={15} /></span>)}</div>}
    </div>
  );
}
