import React from 'react';
import { Award } from 'lucide-react';
import ModuleTrophies from '@/components/achievements/ModuleTrophies';

const medal = (rank) => Number(rank) === 1 ? '🥇' : Number(rank) === 2 ? '🥈' : '🥉';

export default function AchievementShowcase({ trophies = [], monitorAwards = [], dark = false }) {
  return (
    <div className={`mt-4 rounded-xl border p-3 ${dark ? 'border-white/15 bg-white/5' : 'border-border bg-secondary/30'}`}>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${dark ? 'text-white/70' : 'text-muted-foreground'}`}><Award size={13} /> Conquistas</p>
      {!trophies.length && !monitorAwards.length ? <p className={`text-xs ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>As medalhas e troféus conquistados aparecerão aqui.</p> : <div className="flex flex-wrap items-center gap-2"><ModuleTrophies completions={trophies} />{monitorAwards.map((item) => <span key={item.id} title={`Monitor da turma · ${item.rank_position}º lugar`} className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/15 px-1 text-base">{medal(item.rank_position)}</span>)}</div>}
    </div>
  );
}