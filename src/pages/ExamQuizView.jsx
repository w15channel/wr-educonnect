import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import ExamQuizRenderer from '@/components/exams/ExamQuizView';
import useModuleAccess from '@/hooks/useModuleAccess';
import { parseModuleNumber } from '@/lib/examChecklistRules';

export default function ExamQuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Use outlet context (same pattern as all other pages) so session works on published site
  const { user: session } = useOutletContext();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => base44.entities.Exam.list('-created_date', 200),
  });

  const exam = exams.find(e => e.id === id);
  const access = useModuleAccess(exam?.course || session?.course || 'tcc', session);
  const moduleNumber = parseModuleNumber(exam?.module_ref);
  const isAdmin = session?.role === 'admin';
  const isHiddenForStudent = exam?.is_hidden && !isAdmin;

  const handleBack = () => {
    queryClient.invalidateQueries({ queryKey: ['exam-submissions-mine'] });
    navigate(-1);
  };

  if (isLoading || access.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam || isHiddenForStudent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Prova não encontrada.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline mt-2 block mx-auto">
          Voltar
        </button>
      </div>
    );
  }

  if (moduleNumber && !access.moduleUnlocked[moduleNumber - 1]) return <div className="p-6 text-center text-muted-foreground"><p>Este módulo será liberado na data prevista no calendário.</p><button onClick={handleBack} className="mt-3 text-primary underline">Voltar</button></div>;
  return <ExamQuizRenderer exam={exam} user={session} onBack={handleBack} />;
}