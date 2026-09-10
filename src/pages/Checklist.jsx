import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardCheck, Lock, Unlock, GraduationCap, ArrowRight } from 'lucide-react';
import useModuleChecklist from '@/hooks/useModuleChecklist';
import ChecklistItemRow from '@/components/checklist/ChecklistItemRow';
import ModuleUnlockRequestCard from '@/components/checklist/ModuleUnlockRequestCard';

export default function Checklist() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const prefix = parts[0] === 'student' || parts[0] === 'adm' ? `/${parts[0]}` : '';
  const course = session?.course || 'tcc';
  const { modules, currentModule, isLoading } = useModuleChecklist({ course, session });

  const requestedModule = Number(new URLSearchParams(location.search).get('module')) || null;
  const [selected, setSelected] = useState(requestedModule || currentModule);
  useEffect(() => {
    if (!requestedModule) setSelected(currentModule);
  }, [currentModule, requestedModule]);

  const module = modules.find((m) => m.moduleNumber === selected) || modules[0];
  // O aluno só vê os módulos até o que está cursando — cada um no seu tempo.
  const visibleModules = modules.filter((m) => m.moduleNumber <= currentModule);

  // Ida: sai do checklist com checklist=<módulo>; a barra de retorno traz de volta.
  const goToRequirement = (item) => navigate(`${prefix}${item.to}${item.to.includes('?') ? '&' : '?'}checklist=${module.moduleNumber}`);

  return (
    <div className="app-page max-w-3xl mx-auto animate-fade-in-up space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shrink-0">
          <ClipboardCheck size={22} className="text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Checklist do Módulo</h2>
          <p className="text-sm text-muted-foreground">Cumpra a sequência para liberar a prova do seu módulo</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {visibleModules.map((m) => (
          <button
            key={m.moduleNumber}
            onClick={() => setSelected(m.moduleNumber)}
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
                  ? `Módulo ${module.moduleNumber} concluído — prova liberada!`
                  : `Faltam ${module.items.length - module.doneCount} requisito(s) para liberar a prova do Módulo ${module.moduleNumber}`}
              </p>
            </div>
            <div className="mt-2.5 h-2 w-full rounded-full bg-white/70 overflow-hidden">
              <div
                className={`h-full rounded-full ${module.complete ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.round((module.doneCount / module.items.length) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {module.items.map((item, index) => (
              <ChecklistItemRow key={item.key} item={item} index={index} onGo={goToRequirement} />
            ))}
          </div>

          <button
            type="button"
            disabled={!module.complete}
            onClick={() => navigate(`${prefix}/exams`)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GraduationCap size={16} />
            {module.complete ? `Fazer a prova do Módulo ${module.moduleNumber}` : 'Prova bloqueada até concluir o checklist'}
            {module.complete && <ArrowRight size={14} />}
          </button>

          <ModuleUnlockRequestCard session={session} course={course} module={module} />
        </>
      )}
    </div>
  );
}