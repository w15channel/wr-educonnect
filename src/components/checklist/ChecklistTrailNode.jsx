import React from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import { getStepGuide } from '@/lib/checklistGuide';

// Offsets em zigue-zague, no mesmo espírito da trilha da Ofensiva.
const TRAIL_X = [0, 62, 0, -62, 0, 62, 0, -62];

/** Um marco da trilha do checklist: concluído, atual (pulsando) ou bloqueado. */
export default function ChecklistTrailNode({ item, index, state, onPress }) {
  const guide = getStepGuide(item.key);
  const done = state === 'done';
  const current = state === 'current';

  return (
    <button
      type="button"
      onClick={onPress}
      style={{ marginLeft: TRAIL_X[index % TRAIL_X.length] }}
      className={`relative flex flex-col items-center transition-transform active:scale-95 ${state === 'locked' ? 'opacity-45' : 'hover:scale-105'}`}
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 text-2xl shadow-lg ${
        done ? 'bg-green-500 border-green-400 shadow-green-400/40 ofensiva-node-done'
        : current ? 'bg-primary border-primary/70 shadow-primary/30 ofensiva-node-ready'
        : 'bg-secondary border-border'
      }`}>
        {done ? <CheckCircle size={26} className="text-white" />
          : current ? <span>{guide.emoji}</span>
          : <Lock size={18} className="text-muted-foreground" />}
      </div>
      <span className={`mt-1 max-w-[92px] text-center text-[10.5px] font-bold leading-tight ${
        done ? 'text-green-600' : current ? 'text-foreground' : 'text-muted-foreground'
      }`}>
        {index + 1}. {guide.short}
      </span>
      <span className="text-[10px] font-bold text-muted-foreground/70">{item.current}/{item.target}</span>
      {current && (
        <span className="absolute -top-2 -right-1 rounded-full border-2 border-primary/40 bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground">
          AQUI
        </span>
      )}
    </button>
  );
}