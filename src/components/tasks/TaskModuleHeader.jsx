import React from 'react';
import { Lock, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';

// Cabeçalho de cada módulo na tela de Tarefas: 5 trabalhos por módulo.
// Funciona como sanfona (igual às aulas): clicar abre/fecha o módulo.
export default function TaskModuleHeader({ module, total, done, locked, expanded, onToggle }) {
  const Wrapper = onToggle ? 'button' : 'div';
  return (
    <Wrapper
      type={onToggle ? 'button' : undefined}
      onClick={onToggle}
      className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${locked ? 'bg-muted/40 border-border' : 'bg-secondary/40 border-primary/20 hover:border-primary/40'}`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
        {locked ? <Lock size={15} /> : <FolderOpen size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm text-foreground">Módulo {module}</p>
        <p className="text-[11px] text-muted-foreground">
          {locked
            ? 'Bloqueado — aprove a prova de conclusão do módulo anterior para liberar'
            : `${done}/${total} trabalho${total !== 1 ? 's' : ''} entregue${done !== 1 ? 's' : ''}`}
        </p>
      </div>
      {onToggle && !locked && (
        <span className="shrink-0 text-muted-foreground">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      )}
    </Wrapper>
  );
}