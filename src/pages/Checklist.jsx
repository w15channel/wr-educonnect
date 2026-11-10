import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Lock,
  Unlock,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import useModuleChecklist from '@/hooks/useModuleChecklist';
import useLunaVoice from '@/hooks/useLunaVoice';
import ChecklistTrail from '@/components/checklist/ChecklistTrail';
import OwlStepGuide from '@/components/checklist/OwlStepGuide';
import ModuleCompletionCard from '@/components/checklist/ModuleCompletionCard';
import { buildVoiceScript, buildFinishScript } from '@/lib/checklistGuide';
import {
  resolveChecklistPrefix,
  saveActiveChecklistGuide,
  markChecklistItemDone,
  downloadCompletedChecklistPDF,
} from '@/lib/checklistActions';

export default function Checklist() {
  const { user: session, isDiplomaMode = false } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const prefix = resolveChecklistPrefix(location.pathname);
  const course = session?.course || 'tcc';
  const { modules, currentModule, isLoading, error, checklistAvailableModules } = useModuleChecklist({
    course,
    session,
    includeOfensiva: !isDiplomaMode,
  });
  const voice = useLunaVoice();

  const requestedModule = Number(new URLSearchParams(location.search).get('module')) || null;
  const [selected, setSelected] = useState(requestedModule || currentModule);
  useEffect(() => {
    if (!requestedModule) setSelected(currentModule);
  }, [currentModule, requestedModule]);

  const visibleModules = modules.filter((m) => checklistAvailableModules.includes(m.moduleNumber));
  const module =
    visibleModules.find((m) => m.moduleNumber === selected) ||
    visibleModules.find((m) => m.moduleNumber === currentModule) ||
    modules[0];

  const items = module?.items || [];
  const firstName = String(session?.name || session?.full_name || 'aluno').split(' ')[0];
  const firstPending = items.findIndex((item) => !item.done);
  const [focusIndex, setFocusIndex] = useState(0);

  // A trilha sempre abre no marco em que o aluno está agora.
  useEffect(() => {
    if (isLoading || !items.length) return;
    setFocusIndex(firstPending >= 0 ? firstPending : items.length - 1);
  }, [isLoading, firstPending, items.length, module?.moduleNumber]);

  const focusItem = items[focusIndex];
  const [savingKey, setSavingKey] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const script = useMemo(() => {
    if (isLoading || error || !module) return '';
    if (module.complete && module.examDone) return '';
    if (module.complete) return buildFinishScript({ firstName, moduleNumber: module.moduleNumber });
    if (!focusItem) return '';
    return buildVoiceScript({
      item: focusItem,
      index: focusIndex,
      total: items.length,
      moduleNumber: module.moduleNumber,
      firstName,
    });
  }, [isLoading, error, module, focusItem, focusIndex, items.length, firstName]);

  // A corujinha fala a etapa atual sempre que o aluno muda de marco.
  useEffect(() => {
    if (script) voice.speak(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, voice.enabled]);

  // Ida: sai do checklist com checklist=<módulo>&checklistItem=<key> e grava no
  // sessionStorage para o menu flutuante acompanhar o aluno até a atividade.
  const goToRequirement = (item) => {
    if (!item || !module) return;
    voice.stop();
    saveActiveChecklistGuide({ moduleNumber: module.moduleNumber, itemKey: item.key });
    const sep = item.to.includes('?') ? '&' : '?';
    navigate(`${prefix}${item.to}${sep}checklist=${module.moduleNumber}&checklistItem=${item.key}`);
  };

  const nextPendingFrom = (from) => {
    for (let step = 1; step <= items.length; step += 1) {
      const candidate = (from + step) % items.length;
      if (!items[candidate].done) return candidate;
    }
    return from;
  };

  const markActivityComplete = async (targetItem = focusItem) => {
    if (!targetItem || targetItem.done || savingKey || !module) return;
    setSavingKey(targetItem.key);
    try {
      await markChecklistItemDone({
        session,
        moduleNumber: module.moduleNumber,
        itemKey: targetItem.key,
        queryClient,
      });
      toast.success('Opção marcada como concluída!');
      const idx = items.findIndex((i) => i.key === targetItem.key);
      if (idx >= 0) setFocusIndex(nextPendingFrom(idx));
    } catch (err) {
      toast.error(err?.message || 'Não foi possível salvar a conclusão. Tente novamente.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleDownloadCompleted = async () => {
    if (!module || downloading) return;
    const totalDoneAcrossVisible = visibleModules.reduce((acc, m) => acc + (m.doneCount || 0), 0);
    if ((module.doneCount || 0) === 0 && totalDoneAcrossVisible === 0) {
      toast.info('Selecione ao menos uma opção como concluída antes de baixar.');
      return;
    }
    setDownloading(true);
    try {
      await downloadCompletedChecklistPDF({
        session,
        moduleNumber: module.moduleNumber,
        items: module.items,
        modules: visibleModules,
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
      <div role="alert" className="app-page text-destructive">
        Não foi possível carregar seu progresso. Suas atividades não foram desmarcadas.{' '}
        <button onClick={() => window.location.reload()} className="underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="app-page max-w-2xl mx-auto animate-fade-in-up space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shrink-0">
            <ClipboardCheck size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Trilha do Módulo</h2>
            <p className="text-sm text-muted-foreground">
              A Luna te guia passo a passo até liberar a prova
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadCompleted}
          disabled={isLoading || downloading}
          className="inline-flex items-center gap-2 rounded-2xl border border-indigo-300 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200"
        >
          <Download size={15} />
          {downloading ? 'Gerando PDF...' : `Baixar concluídas (${module?.doneCount || 0})`}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {visibleModules.map((m) => (
          <button
            key={m.moduleNumber}
            onClick={() => {
              voice.stop();
              setSelected(m.moduleNumber);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              m.moduleNumber === selected
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Módulo {m.moduleNumber} {m.complete ? '✓' : ''}
          </button>
        ))}
      </div>

      {isLoading || !module ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div
            className={`rounded-2xl border p-4 ${
              module.complete ? 'border-green-200 bg-green-50/60' : 'border-amber-200 bg-amber-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              {module.complete ? (
                <Unlock size={16} className="text-green-600" />
              ) : (
                <Lock size={16} className="text-amber-600" />
              )}
              <p className={`text-sm font-bold ${module.complete ? 'text-green-800' : 'text-amber-800'}`}>
                {module.complete
                  ? `Trilha do Módulo ${module.moduleNumber} concluída — solicite sua prova.`
                  : `Faltam ${module.items.length - module.doneCount} etapa(s) para liberar a prova do Módulo ${module.moduleNumber}`}
              </p>
            </div>
            <div className="mt-2.5 h-2 w-full rounded-full bg-white/70 overflow-hidden">
              <div
                className={`h-full rounded-full ${module.complete ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.round((module.doneCount / module.items.length) * 100)}%` }}
              />
            </div>
          </div>

          {module.complete && module.examDone ? (
            <ModuleCompletionCard
              moduleNumber={module.moduleNumber}
              firstName={firstName}
              session={session}
              voice={voice}
            />
          ) : (
            <>
              <OwlStepGuide
                item={focusItem}
                index={focusIndex}
                total={items.length}
                firstName={firstName}
                moduleNumber={module.moduleNumber}
                complete={module.complete}
                voice={voice}
                onGo={() => focusItem && goToRequirement(focusItem)}
                onSkip={() => setFocusIndex((prev) => nextPendingFrom(prev))}
                onRepeat={() => voice.speak(script, { force: true })}
                onMarkComplete={() => focusItem && markActivityComplete(focusItem)}
                savingCompletion={savingKey === focusItem?.key}
              />

              {/* Lista interativa de opções do checklist */}
              <div className="rounded-3xl border border-border bg-card p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                    Opções do Checklist · Módulo {module.moduleNumber}
                  </p>
                  <span className="text-xs font-bold text-foreground">
                    {module.doneCount}/{items.length} concluídas
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const isSavingThis = savingKey === item.key;
                    const isFocused = idx === focusIndex;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setFocusIndex(idx)}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-2xl border p-3 transition-all cursor-pointer ${
                          item.done
                            ? 'border-green-300/80 bg-green-50/60 dark:border-green-600/30 dark:bg-green-950/20'
                            : isFocused
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border bg-background/60 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            disabled={item.done || isSavingThis}
                            onClick={(e) => {
                              e.stopPropagation();
                              markActivityComplete(item);
                            }}
                            className="mt-0.5 shrink-0 text-left disabled:cursor-default"
                            aria-label={item.done ? 'Opção concluída' : `Marcar ${item.label} como concluída`}
                          >
                            {item.done ? (
                              <CheckCircle2 size={18} className="text-green-600" />
                            ) : (
                              <Circle size={18} className="text-muted-foreground hover:text-green-600" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs sm:text-sm font-bold leading-snug ${
                                item.done ? 'text-green-800 dark:text-green-300 line-through' : 'text-foreground'
                              }`}
                            >
                              {idx + 1}. {item.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Progresso: {item.current}/{item.target} {item.hint ? `· ${item.hint}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            disabled={item.done || isSavingThis}
                            onClick={(e) => {
                              e.stopPropagation();
                              markActivityComplete(item);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                              item.done
                                ? 'bg-green-500/15 text-green-700 dark:text-green-300 cursor-default'
                                : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            {isSavingThis ? 'Salvando...' : item.done ? 'Concluído' : 'Concluir'}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToRequirement(item);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                          >
                            Ir à atividade <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ChecklistTrail items={items} focusIndex={focusIndex} onSelect={setFocusIndex} />

              {focusItem && (
                <button
                  type="button"
                  onClick={() => markActivityComplete(focusItem)}
                  disabled={focusItem.done || !!savingKey || isLoading}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed ${
                    focusItem.done
                      ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300'
                      : 'border-green-300 bg-green-500 text-white shadow-lg hover:bg-green-600 disabled:opacity-60'
                  }`}
                >
                  <CheckCircle2 size={17} />
                  {savingKey === focusItem.key
                    ? 'Salvando...'
                    : focusItem.done
                    ? 'Atividade concluída'
                    : 'Marcar atividade selecionada como concluída'}
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadCompleted}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200"
              >
                <Download size={16} />
                {downloading
                  ? 'Gerando arquivo das opções concluídas...'
                  : `Baixar opções concluídas (${module.doneCount}/${items.length})`}
              </button>

              <button
                type="button"
                disabled={!module.complete}
                onClick={() => {
                  voice.stop();
                  navigate(`${prefix}/exams`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GraduationCap size={16} />
                {module.complete
                  ? `Ir para as provas do Módulo ${module.moduleNumber}`
                  : 'Prova bloqueada até concluir a trilha'}
                {module.complete && <ArrowRight size={14} />}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}