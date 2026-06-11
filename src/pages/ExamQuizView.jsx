import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/customAuth';
import QuizView from '@/components/tasks/QuizView';

export default function ExamQuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = getSession();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => base44.entities.Exam.list('-created_date', 200),
  });

  const exam = exams.find(e => e.id === id);

  const handleBack = () => {
    queryClient.invalidateQueries({ queryKey: ['exam-submissions-mine'] });
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Prova não encontrada.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline mt-2 block mx-auto">
          Voltar
        </button>
      </div>
    );
  }

  // QuizView expects a task-like object with quiz_questions
  return <QuizView task={exam} user={session} onBack={handleBack} />;
}