import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, Lock, Unlock } from 'lucide-react';
import useModuleChecklist from '@/hooks/useModuleChecklist';

// Mini espaço do Checklist na dashboard — acompanha o módulo atual do aluno.
export default function ChecklistDashboardCard({ session, course }) {
  const navigate = useNavigate();
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const prefix = parts[0] === 'student' || parts[0] === 'adm' ? `/${parts[0]}` : '';
  const { modules, currentModule, isLoading } = useModuleChecklist({ course: course || 'tcc', session });
  const current = modules.find((m) => m.moduleNumber === currentModule);
  const doneCount = current?.doneCount || 0;
  const total = current?.items.length || 7;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <button
      type="button"
      onClick={() => navigate(`${prefix}/checklist`)}
      className="bg-card rounded-2xl border border-border p-5 text-left hover:border-primary/40 hover:shadow-lg transition-all w-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
          <ClipboardCheck size={16} className="text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-foreground">Checklist</h3>
          <p className="text-xs text-muted-foreground truncate">Requisitos para liberar a prova do Módulo {currentModule}</p>
        </div>
      </div>

      <p className="text-2xl font-black text-foreground">{isLoading ? '—' : `${doneCount}/${total}`}</p>
      <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${current?.complete ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${isLoading ? 0 : pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border ${current?.complete ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
          {current?.complete ? <Unlock size={11} /> : <Lock size={11} />}
          {current?.complete ? 'Prova liberada' : 'Prova bloqueada'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          Abrir checklist <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}