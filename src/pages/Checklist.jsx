import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardCheck, Lock, Unlock, GraduationCap, ArrowRight } from 'lucide-react';
import useModuleChecklist from '@/hooks/useModuleChecklist';
import useLunaVoice from '@/hooks/useLunaVoice';
import ChecklistTrail from '@/components/checklist/ChecklistTrail';
import OwlStepGuide from '@/components/checklist/OwlStepGuide';
import ModuleUnlockRequestCard from '@/components/checklist/ModuleUnlockRequestCard';
import ModuleCompletionCard from '@/components/checklist/ModuleCompletionCard';
import { buildVoiceScript, buildFinishScript } from '@/lib/checklistGuide';

export default function Checklist() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const prefix = parts[0] === 'degree' ? '/degree/student' : (parts[0] === 'student' || parts[0] === 'adm' ? `/${parts[0]}` : '');
  const course = session?.course || 'tcc';
  const { modules, currentModule, isLoading, error, checklistAvailableModules } = useModuleChecklist({ course, session });
  const voice = useLunaVoice();

  const requestedModule = Number(new URLSearchParams(location.search).get('module')) || null;
  const [selected, setSelected] = useState(requestedModule || currentModule);
  useEffect(() => {
    if (!requestedModule) setSelected(currentModule);
  }, [currentModule, requestedModule]);

  const visibleModules = modules.filter((m) => checklistAvailableModules.includes(m.moduleNumber));
  const module = visibleModules.find((m) => m.moduleNumber === selected) || visibleModules.find((m) => m.moduleNumber === currentModule) || modules[0];

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
  const script = useMemo(() => {
    if (isLoading || error || !module) return '';
    if (module.complete && module.examDone) return '';
    if (module.complete) return buildFinishScript({ firstName, moduleNumber: module.moduleNumber });
    if (!focusItem) return '';
    return buildVoiceScript({ item: focusItem, index: focusIndex, total: items.length, moduleNumber: module.moduleNumber, firstName });
  }, [isLoading, error, module, focusItem, focusIndex, items.length, firstName]);

  // A corujinha fala a etapa atual sempre que o aluno muda de marco.
  useEffect(() => {
    if (script) voice.speak(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, voice.enabled]);

  // Ida: sai do checklist com checklist=<módulo>&checklistItem=<key>;
  // a barra de retorno traz de volta e oferece marcar como concluído.
  const goToRequirement = (item) => {
    voice.stop();
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

  if (error) return <div role="alert" className="app-page text-destructive">Não foi possível carregar seu progresso. Suas atividades não foram desmarcadas. <button onClick={() => window.location.reload()} className="underline">Tentar novamente</button></div>;

  return (
    <div className="app-page max-w-2xl mx-auto animate-fade-in-up space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shrink-0">
          <ClipboardCheck size={22} className="text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Trilha do Módulo</h2>
          <p className="text-sm text-muted-foreground">A Luna te guia passo a passo até liberar a prova</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {visibleModules.map((m) => (
          <button
            key={m.moduleNumber}
            onClick={() => { voice.stop(); setSelected(m.moduleNumber); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              m.moduleNumber === selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Módulo {m.moduleNumber} {m.complete ? '✓' : ''}
          </button>
        ))}
      </div>

      {isLoading || !module ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className={`rounded-2xl border p-4 ${module.complete ? 'border-green-200 bg-green-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
            <div className="flex items-center gap-2">
              {module.complete ? <Unlock size={16} className="text-green-600" /> : <Lock size={16} className="text-amber-600" />}
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
            <ModuleCompletionCard moduleNumber={module.moduleNumber} firstName={firstName} session={session} voice={voice} />
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
              />
              <ChecklistTrail items={items} focusIndex={focusIndex} onSelect={setFocusIndex} />
              <button
                type="button"
                disabled={!module.complete}
                onClick={() => { voice.stop(); navigate(`${prefix}/exams`); }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GraduationCap size={16} />
                {module.complete ? `Ir para as provas do Módulo ${module.moduleNumber}` : 'Prova bloqueada até concluir a trilha'}
                {module.complete && <ArrowRight size={14} />}
              </button>
              <ModuleUnlockRequestCard session={session} course={course} module={module} />
            </>
          )}
        </>
      )}
    </div>
  );
}
