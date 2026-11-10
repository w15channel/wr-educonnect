import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Circle,
  GraduationCap,
  Sparkles,
  Download,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import useModuleChecklist from '@/hooks/useModuleChecklist';
import {
  resolveChecklistPrefix,
  saveActiveChecklistGuide,
  markChecklistItemDone,
  downloadCompletedChecklistPDF,
} from '@/lib/checklistActions';

export default function ChecklistDashboardCard({ session, course, className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const prefix = resolveChecklistPrefix(location.pathname);
  const isDiplomaMode = location.pathname.startsWith('/degree');
  const { modules, currentModule, isLoading, error } = useModuleChecklist({
    course: course || 'tcc',
    session,
    includeOfensiva: !isDiplomaMode,
  });

  const [savingKey, setSavingKey] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const current = modules.find((m) => m.moduleNumber === currentModule);
  const items = current?.items || [];
  const doneCount = current?.doneCount || 0;
  const total = items.length || 5;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const handleMarkDone = async (e, item) => {
    e.stopPropagation();
    if (!item || item.done || savingKey || !current) return;
    setSavingKey(item.key);
    try {
      await markChecklistItemDone({
        session,
        moduleNumber: current.moduleNumber,
        itemKey: item.key,
        queryClient,
      });
      toast.success('Opção marcada como concluída!');
    } catch (err) {
      toast.error(err?.message || 'Não foi possível salvar a conclusão.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleGoToActivity = (e, item) => {
    e.stopPropagation();
    if (!item || !current) return;
    saveActiveChecklistGuide({ moduleNumber: current.moduleNumber, itemKey: item.key });
    const sep = item.to.includes('?') ? '&' : '?';
    navigate(`${prefix}${item.to}${sep}checklist=${current.moduleNumber}&checklistItem=${item.key}`);
  };

  const handleDownloadCompleted = async (e) => {
    e.stopPropagation();
    if (!current || downloading) return;
    if (doneCount === 0) {
      toast.info('Selecione ao menos uma opção como concluída antes de baixar.');
      return;
    }
    setDownloading(true);
    try {
      await downloadCompletedChecklistPDF({
        session,
        moduleNumber: current.moduleNumber,
        items: current.items,
        modules,
      });
      toast.success('Opções concluídas baixadas em PDF!');
    } catch (err) {
      toast.error(err?.message || 'Não foi possível baixar as opções concluídas.');
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <div role="alert" className={`rounded-2xl border border-border bg-card p-5 text-sm ${className}`}>
        Seu histórico está temporariamente indisponível; isso não significa que suas atividades estão pendentes.{' '}
        <button onClick={() => navigate(`${prefix}/checklist`)} className="text-primary underline">
          Recarregar checklist
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`${prefix}/checklist`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`${prefix}/checklist`);
      }}
      className={`cursor-pointer relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-card to-violet-50/60 p-5 dark:border-indigo-500/25 dark:from-indigo-950/40 dark:via-card dark:to-violet-950/30 ${className}`}
    >
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
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                current?.complete
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {current?.complete ? <Unlock size={10} /> : <Lock size={10} />}
              {current?.examDone ? 'Módulo concluído' : current?.complete ? 'Prova liberada' : 'Prova bloqueada'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Marque as opções concluídas, vá direto para cada atividade com o menu flutuante de acompanhamento ou baixe o comprovante das etapas concluídas.
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="text-2xl font-black text-foreground leading-none">
            {isLoading ? '—' : `${doneCount}/${total}`}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">etapas</span>
        </div>
      </div>

      {/* Progresso */}
      <div className="relative mt-4 flex items-center gap-2.5">
        <div className="h-2.5 flex-1 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              current?.complete
                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500'
            }`}
            style={{ width: `${isLoading ? 0 : pct}%` }}
          />
        </div>
        <span className="text-xs font-black text-foreground shrink-0">{isLoading ? '' : `${pct}%`}</span>
      </div>

      {/* Mini checklist funcional — espelho da ferramenta completa */}
      <div className="relative mt-4 space-y-1.5">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <div key={i} className="h-9 rounded-xl bg-muted animate-pulse" />)
          : items.map((item) => {
              const isSavingThis = savingKey === item.key;
              return (
                <div
                  key={item.key}
                  onClick={(e) => handleGoToActivity(e, item)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                    item.done
                      ? 'border-green-200/70 bg-green-50/60 dark:border-green-500/25 dark:bg-green-950/20'
                      : 'border-border bg-background/70 hover:border-indigo-300'
                  }`}
                >
                  <button
                    type="button"
                    disabled={item.done || isSavingThis}
                    onClick={(e) => handleMarkDone(e, item)}
                    className="shrink-0 disabled:cursor-default"
                    title={item.done ? 'Concluído' : 'Selecionar como concluído'}
                  >
                    {item.done ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground/60 hover:text-green-600" />
                    )}
                  </button>
                  <span
                    className={`flex-1 min-w-0 truncate text-[11.5px] font-semibold ${
                      item.done
                        ? 'text-green-700 line-through decoration-green-600/40 dark:text-green-400'
                        : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                  {!item.done ? (
                    <button
                      type="button"
                      disabled={isSavingThis}
                      onClick={(e) => handleMarkDone(e, item)}
                      className="shrink-0 rounded-lg bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-green-600"
                    >
                      {isSavingThis ? '...' : 'Concluir'}
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-black text-green-700 dark:text-green-300">
                      Concluído
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleGoToActivity(e, item)}
                    className="shrink-0 rounded-lg bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                    title="Ir para a atividade com o menu flutuante"
                  >
                    <ArrowRight size={11} />
                  </button>
                </div>
              );
            })}
      </div>

      {/* Ações */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`${prefix}/checklist`);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white/70 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-white transition-colors dark:border-indigo-500/30 dark:bg-white/10 dark:text-indigo-200"
        >
          <Sparkles size={12} /> Abrir checklist completo
        </button>

        <button
          type="button"
          disabled={downloading || isLoading}
          onClick={handleDownloadCompleted}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200"
        >
          <Download size={12} />
          {downloading ? 'Baixando...' : `Baixar concluídas (${doneCount})`}
        </button>

        {current?.complete && !current?.examDone && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${prefix}/exams`);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          >
            <GraduationCap size={12} /> Fazer a prova do Módulo {currentModule}
          </button>
        )}
      </div>
    </div>
  );
}