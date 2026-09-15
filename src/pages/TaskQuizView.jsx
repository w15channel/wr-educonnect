import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/customAuth';
import QuizView from '@/components/tasks/QuizView';
import useModuleAccess from '@/hooks/useModuleAccess';

export default function TaskQuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = getSession();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const task = tasks.find(t => t.id === id);
  const access = useModuleAccess(task?.course || session?.course || 'tcc', session);
  const moduleLocked = !!task?.module_number && !access.moduleUnlocked[Number(task.module_number) - 1];
  const isAdmin = session?.role === 'admin';
  const isHiddenForStudent = task?.is_hidden && !isAdmin;

  const handleBack = () => {
    queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
    navigate('/tasks');
  };

  if (isLoading || access.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!task || isHiddenForStudent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Prova não encontrada.</p>
        <button onClick={() => navigate('/tasks')} className="text-primary text-sm hover:underline mt-2 block mx-auto">
          Voltar para Tarefas
        </button>
      </div>
    );
  }

  if (moduleLocked) return <div className="p-6 text-center text-muted-foreground"><p>Este módulo será liberado na data prevista no calendário.</p><button onClick={handleBack} className="mt-3 text-primary underline">Voltar para Tarefas</button></div>;
  return <QuizView task={task} user={session} onBack={handleBack} />;
}