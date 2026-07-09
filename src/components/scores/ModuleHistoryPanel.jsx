import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Archive, ChevronDown, ChevronUp, Star, Trophy } from 'lucide-react';
import { formatScore } from '@/lib/scoreUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Exibe os módulos encerrados de um curso, com a pontuação geral congelada de cada aluno.
export default function ModuleHistoryPanel({ course, filterEmail = null }) {
  const [expanded, setExpanded] = useState(null);

  const { data: closures = [], isLoading } = useQuery({
    queryKey: ['module-closures', course],
    queryFn: () => base44.entities.ModuleClosure.filter({ course }, '-closed_at', 100),
  });

  if (isLoading) {
    return <div className="h-20 bg-muted rounded-2xl animate-pulse" />;
  }

  if (closures.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <Archive size={32} className="mx-auto mb-2 opacity-20 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum módulo encerrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {closures.map((closure) => {
        const isOpen = expanded === closure.id;
        const snapshot = Array.isArray(closure.snapshot) ? closure.snapshot : [];
        const rows = filterEmail
          ? snapshot.filter((s) => s.student_email === filterEmail)
          : snapshot;
        const closedDate = closure.closed_at ? format(new Date(closure.closed_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : '—';
        const rangeLabel = closure.period_start && closure.period_end
          ? `${format(new Date(closure.period_start + 'T00:00:00'), "dd/MM/yyyy")} a ${format(new Date(closure.period_end + 'T00:00:00'), "dd/MM/yyyy")}`
          : null;

        return (
          <div key={closure.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : closure.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <Archive size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">{closure.module_label || `Módulo ${closure.module_number}`}</p>
                {rangeLabel && <p className="text-xs text-muted-foreground font-semibold">{rangeLabel}</p>}
                <p className="text-xs text-muted-foreground">Encerrado em {closedDate} · {snapshot.length} aluno(s)</p>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-1.5">
                {rows.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhum registro para este aluno neste módulo.</p>
                ) : (
                  rows.map((s) => {
                    const medal = s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : null;
                    return (
                      <div key={s.student_email} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-3 py-2">
                        <span className="w-7 text-center shrink-0">
                          {medal || <span className="text-xs font-bold text-muted-foreground">#{s.rank}</span>}
                        </span>
                        <span className="text-sm text-foreground flex-1 truncate">{s.student_name || s.student_email}</span>
                        <div className="flex items-center gap-1.5 shrink-0 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-lg">
                          <Star size={11} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-black text-yellow-700">{formatScore(s.points)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}