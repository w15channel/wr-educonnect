/**
 * ExamGrader - Componente para correção manual de provas pelo admin
 * Permite visualizar respostas dos alunos e atribuir notas manualmente
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import {
  CheckCircle, XCircle, Star, Award, ChevronLeft,
  FileText, MessageSquare, Save, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';

export default function ExamGrader({ submission, exam, onBack }) {
  const queryClient = useQueryClient();
  const [grade, setGrade] = useState(submission?.grade ?? null);
  const [feedback, setFeedback] = useState(submission?.feedback || '');

  const saveMutation = useMutation({
    mutationFn: (data) => adminApi.update('TaskSubmission', submission.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-submissions'] });
      toast.success('Correção salva com sucesso!');
      onBack();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const questions = exam?.quiz_questions || [];
  const answers = submission?.quiz_answers || [];

  const handleSave = () => {
    saveMutation.mutate({
      grade: grade !== null ? roundScore(Number(grade)) : null,
      feedback,
      status: 'graded',
    });
  };

  const questionTypes = {
    choice: questions.filter((q, i) => q.answer_type === 'choice' && answers[i] !== undefined).length,
    text: questions.filter((q, i) => q.answer_type === 'text' && answers[i]).length,
  };

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow">
            <Award size={16} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-foreground">Corrigir Prova</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User size={10} /> {submission.student_name} · {submission.student_email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Entregue em</p>
            <p className="text-xs font-bold text-foreground">
              {new Date(submission.created_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Questões Objetivas</p>
          <p className="text-lg font-black text-foreground">{questionTypes.choice}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Questões Discursivas</p>
          <p className="text-lg font-black text-foreground">{questionTypes.text}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Nota Máxima</p>
          <p className="text-lg font-black text-primary">{formatScore(exam.max_grade)}</p>
        </div>
      </div>

      {/* Questions & Answers */}
      <div className="space-y-3 mb-5">
        {questions.map((q, qi) => {
          const answer = answers[qi];
          const isChoice = q.answer_type === 'choice';
          const isCorrect = isChoice && answer !== undefined && Number(answer) === q.correct_index;

          return (
            <div key={qi} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Questão {qi + 1}</span>
                {isChoice && (
                  <Badge className={`text-[10px] py-0 px-1.5 ${isCorrect ? 'bg-accent text-primary border-primary' : 'bg-destructive text-destructive border-destructive'}`}>
                    {isCorrect ? <><CheckCircle size={9} className="inline mr-1" /> Correta</> : <><XCircle size={9} className="inline mr-1" /> Incorreta</>}
                  </Badge>
                )}
                {!isChoice && (
                  <Badge className="text-[10px] bg-accent text-primary border-primary py-0 px-1.5">
                    <FileText size={9} className="inline mr-1" /> Discursiva
                  </Badge>
                )}
              </div>

              <p className="font-semibold text-foreground mb-3 text-sm leading-relaxed">{q.question}</p>

              {isChoice ? (
                <div className="space-y-1.5">
                  {(q.options || []).map((opt, oi) => (
                    <div
                      key={oi}
                      className={`p-2.5 rounded-lg border text-sm flex items-center gap-2 ${
                        oi === q.correct_index
                          ? 'border-primary bg-accent text-primary font-medium'
                          : Number(answer) === oi
                          ? 'border-destructive bg-destructive text-destructive'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {oi === q.correct_index && <CheckCircle size={12} className="shrink-0" />}
                      {Number(answer) === oi && !isCorrect && <XCircle size={12} className="shrink-0" />}
                      {String.fromCharCode(65 + oi)}) {opt}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-secondary/40 rounded-xl p-3 mt-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <MessageSquare size={10} /> Resposta do Aluno:
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {answer || <span className="text-muted-foreground italic">Não respondida</span>}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grading Form */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-5">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <Star size={15} className="text-primary" /> Correção
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Nota Final (0-{exam.max_grade})</label>
            <Input
              type="number"
              min={0}
              max={exam.max_grade}
              step={0.1}
              value={grade ?? ''}
              onChange={e => setGrade(e.target.value ? Number(e.target.value) : null)}
              placeholder="Digite a nota..."
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Feedback para o Aluno</label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="Comentários, observações, pontos de melhoria..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft size={14} /> Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex-1 gap-2 h-11 font-black bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-primary-foreground"
        >
          <Save size={16} />
          {saveMutation.isPending ? 'Salvando...' : `Salvar Correção (${grade !== null ? formatScore(grade) + ' pts' : 'Sem nota'})`}
        </Button>
      </div>
    </div>
  );
}