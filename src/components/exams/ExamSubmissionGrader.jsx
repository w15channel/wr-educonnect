/**
 * ExamSubmissionGrader — Interface de correção de provas
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, ArrowLeft, Award, Eye, EyeOff, HelpCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatScore } from '@/lib/scoreUtils';

export default function ExamSubmissionGrader({ submission, exam, onBack }) {
  const queryClient = useQueryClient();
  const [grade, setGrade] = useState(submission.grade ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [showAnswers, setShowAnswers] = useState({});

  const saveMutation = useMutation({
    mutationFn: () => adminApi.update('ExamSubmission', submission.id, {
      grade: Number(grade),
      feedback,
      status: 'graded',
      graded_at: new Date().toISOString(),
      graded_by: 'admin',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-submissions'] });
      toast.success('Correção salva com sucesso!');
      onBack();
    },
    onError: (err) => toast.error(`Erro ao salvar: ${err.message}`),
  });

  const toggleAnswer = (qi) => setShowAnswers(prev => ({ ...prev, [qi]: !prev[qi] }));

  const questions = exam.quiz_questions || [];
  const studentAnswers = submission.quiz_answers || [];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}><ArrowLeft size={16} /> Voltar</Button>
      
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <h2 className="text-lg font-bold text-foreground mb-2">{exam.title}</h2>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-muted-foreground">Aluno: <strong className="text-foreground">{submission.student_name}</strong></span>
          <span className="text-muted-foreground">Email: <strong className="text-foreground">{submission.student_email}</strong></span>
          <span className="text-muted-foreground">Envio: <strong className="text-foreground">{new Date(submission.submitted_at).toLocaleString('pt-BR')}</strong></span>
          {submission.time_spent_seconds && (
            <span className="text-muted-foreground">Tempo: <strong className="text-foreground">{Math.floor(submission.time_spent_seconds / 60)}min {submission.time_spent_seconds % 60}s</strong></span>
          )}
          {submission.tab_switch_detected && (
            <span className="text-red-500 font-bold flex items-center gap-1">⚠️ Saída da tela detectada</span>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, qi) => {
          const studentAnswer = studentAnswers[qi];
          const isText = q.answer_type === 'text';
          const isCorrect = !isText && Number(studentAnswer) === q.correct_index;

          return (
            <div key={qi} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-foreground text-sm">{qi + 1}. {q.question}</p>
                {!isText && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? '✓ Correta' : '✗ Incorreta'}
                  </span>
                )}
              </div>

              {isText ? (
                <div className="space-y-2">
                  <div className="bg-secondary/40 border border-border rounded-xl p-3">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Resposta do aluno:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{studentAnswer || <span className="italic text-muted-foreground">Não respondida</span>}</p>
                  </div>
                  {q.options && (
                    <button onClick={() => toggleAnswer(qi)} className="flex items-center gap-1.5 text-xs text-primary">
                      <HelpCircle size={11} /> {showAnswers[qi] ? 'Ocultar' : 'Ver'} gabarito
                    </button>
                  )}
                  {showAnswers[qi] && q.options && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold text-emerald-600 mb-2">Gabarito esperado:</p>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="text-xs text-emerald-700">{String.fromCharCode(65 + oi)}) {opt}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {q.options?.map((opt, oi) => (
                    <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${oi === q.correct_index ? 'bg-emerald-500/10 border border-emerald-500/30' : oi === Number(studentAnswer) ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-secondary/30'}`}>
                      <span className="font-bold">{String.fromCharCode(65 + oi)})</span>
                      <span className="flex-1">{opt}</span>
                      {oi === q.correct_index && <CheckCircle size={12} className="text-emerald-500" />}
                      {oi === Number(studentAnswer) && oi !== q.correct_index && <XCircle size={12} className="text-red-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-6">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2"><Award size={15} /> Atribuir Nota</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Nota (0-{exam.max_grade || 10})</label>
            <Input type="number" min={0} max={exam.max_grade || 10} step={0.1} value={grade} onChange={e => setGrade(e.target.value)} className="font-mono font-bold text-lg" />
          </div>
          <div className="flex items-end">
            <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Nota atual</p>
              <p className="font-mono font-black text-2xl">{submission.grade != null ? formatScore(submission.grade) : '--'}</p>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Feedback</label>
          <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Feedback para o aluno..." />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft size={14} /> Cancelar</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || grade === ''} className="flex-1 gap-2 h-11 font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          <CheckCircle size={16} /> {saveMutation.isPending ? 'Salvando...' : `Salvar (${formatScore(Number(grade) || 0)}/${exam.max_grade || 10} pts)`}
        </Button>
      </div>
    </div>
  );
}