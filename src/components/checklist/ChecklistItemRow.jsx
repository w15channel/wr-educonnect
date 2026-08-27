import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

// Linha de um requisito: mostra o progresso do aluno e leva ao local da tarefa.
export default function ChecklistItemRow({ item, index, onGo }) {
  const pct = item.target > 0 ? Math.min(100, Math.round((item.current / item.target) * 100)) : 0;
  return (
    <div className={`rounded-2xl border p-3.5 ${item.done ? 'border-green-200 bg-green-50/50' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {item.done
            ? <CheckCircle2 size={18} className="text-green-600" />
            : <Circle size={18} className="text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${item.done ? 'text-green-700' : 'text-foreground'}`}>
            {index + 1}. {item.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full ${item.done ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground shrink-0">{item.current}/{item.target}</span>
          </div>
        </div>
        {!item.done && (
          <button
            type="button"
            onClick={() => onGo(item)}
            className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Cumprir <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}