import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, Lock, Unlock, CheckCircle2, Circle, GraduationCap, Sparkles } from 'lucide-react';
import useModuleChecklist from '@/hooks/useModuleChecklist';

// Mini Checklist da dashboard — espelho funcional da ferramenta completa:
// mostra cada requisito do módulo atual, o progresso real do aluno e o atalho
// direto para cumprir o item que falta.
export default function ChecklistDashboardCard({ session, course, className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const prefix = parts[0] === 'student' || parts[0] === 'adm' ? `/${parts[0]}` : '';
  const { modules, currentModule, isLoading } = useModuleChecklist({ course: course || 'tcc', session });

  const current = modules.find((m) => m.moduleNumber === currentModule);
  const items = current?.items || [];
  const doneCount = current?.doneCount || 0;
  const total = items.length || 7;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-card to-violet-50/60 p-5 dark:border-indigo-500/25 dark:from-indigo-950/40 dark:via-card dark:to-violet-950/30 ${className}`}>
      <div className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-indigo-400/15 blur-2xl" />

      {/* Cabeçalho + descrição da ferramenta */}
      <div className="relative flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
          <ClipboardCheck size={21} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-base text-foreground">Meu Checklist de Estudos</h3>
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200">
              Etapa atual · Módulo {currentModule}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${current?.complete ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {current?.complete ? <Unlock size={10} /> : <Lock size={10} />}
              {current?.complete ? 'Prova liberada' : 'Prova bloqueada'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Seu roteiro de estudos do módulo: cada etapa cumprida é marcada automaticamente pelo seu histórico.
            Ao concluir todas, a prova do módulo é liberada e o próximo módulo se abre.
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="text-2xl font-black text-foreground leading-none">{isLoading ? '—' : `${doneCount}/${total}`}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">etapas</span>
        </div>
      </div>

      {/* Progresso */}
      <div className="relative mt-4 flex items-center gap-2.5">
        <div className="h-2.5 flex-1 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${current?.complete ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
            style={{ width: `${isLoading ? 0 : pct}%` }}
          />
        </div>
        <span className="text-xs font-black text-foreground shrink-0">{isLoading ? '' : `${pct}%`}</span>
      </div>

      {/* Mini checklist funcional — espelho da ferramenta completa */}
      <div className="relative mt-4 space-y-1.5">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <div key={i} className="h-9 rounded-xl bg-muted animate-pulse" />)
          : items.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${item.done ? 'border-green-200/70 bg-green-50/60 dark:border-green-500/25 dark:bg-green-950/20' : 'border-border bg-background/70'}`}
              >
                {item.done
                  ? <CheckCircle2 size={15} className="shrink-0 text-green-600" />
                  : <Circle size={15} className="shrink-0 text-muted-foreground/60" />}
                <span className={`flex-1 min-w-0 truncate text-[11.5px] font-semibold ${item.done ? 'text-green-700 line-through decoration-green-600/40 dark:text-green-400' : 'text-foreground'}`}>
                  {item.label}
                </span>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-muted-foreground">
                  {item.current}/{item.target}
                </span>
                {!item.done && (
                  <button
                    type="button"
                    onClick={() => navigate(`${prefix}${item.to}?checklist=${currentModule}`)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Cumprir <ArrowRight size={10} />
                  </button>
                )}
              </div>
            ))}
      </div>

      {/* Ações */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`${prefix}/checklist`)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white/70 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-white transition-colors dark:border-indigo-500/30 dark:bg-white/10 dark:text-indigo-200"
        >
          <Sparkles size={12} /> Abrir checklist completo
        </button>
        {current?.complete && (
          <button
            type="button"
            onClick={() => navigate(`${prefix}/exams`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          >
            <GraduationCap size={12} /> Fazer a prova do Módulo {currentModule}
          </button>
        )}
      </div>
    </div>
  );
}