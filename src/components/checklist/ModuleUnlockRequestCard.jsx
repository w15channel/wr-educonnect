import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import useModuleAccess from '@/hooks/useModuleAccess';

export default function ModuleUnlockRequestCard({ session, course = 'tcc' }) {
  const { schedule, availableModules, isLoading, error } = useModuleAccess(course, session);
  const next = schedule.find(r => !availableModules.includes(Number(r.module_number)));
  const prefix = session?.role === 'admin' ? '/adm' : '/student';
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-bold"><CalendarDays size={15} className="text-primary" /> Liberação por calendário</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {isLoading ? 'Carregando calendário...' : error ? 'Não foi possível carregar as liberações.' : next
          ? `O Módulo ${next.module_number} será liberado em ${new Date(next.release_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}, às 00:00 de Brasília, independentemente da nota ou do checklist.`
          : 'Todos os módulos já estão disponíveis.'}
      </p>
      <Link to={`${prefix}/calendar`} className="mt-3 inline-block text-xs font-semibold text-primary underline">Ver calendário de liberações</Link>
    </div>
  );
}