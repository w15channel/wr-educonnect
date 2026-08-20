import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Award, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
// Inline formatScore to avoid import issues
const formatScore = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0';
  return num % 1 === 0 ? num.toString() : num.toFixed(1).replace('.0', '');
};

const roundScore = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
};

export default function ExamSubmissionGrader({ submission, exam, onBack }) {
  const queryClient = useQueryClient();

  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [discursiveGrades, setDiscursiveGrades] = useState({});
  const [feedback, setFeedback] = useState('');

  const questions = exam.quiz_questions || [];
  const studentAnswers = submission.quiz_answers || [];

  // Calculate objective score (auto-graded)
  const objectiveQuestions = questions.filter((q, i) => q.answer_type !== 'text');
  const correctCount = objectiveQuestions.reduce((acc, q, i) => {
    const origIdx = questions.findIndex(q2 => q2 === q);
    return acc + (Number(studentAnswers[origIdx]) === q.correct_index ? 1 : 0);
  }, 0);
  const objectiveScore = objectiveQuestions.length > 0 
    ? roundScore((correctCount / objectiveQuestions.length) * (50) * 0.5)
    : 0;

  // Discursive questions count
  const discursiveCount = questions.filter(q => q.answer_type === 'text').length;
  const discursivePoints = discursiveCount > 0 
    ? roundScore((50) * 0.5 / discursiveCount)
    : 0;

  // Total grade calculation
  const approvedDiscursive = Object.values(discursiveGrades).filter(v => v === true).length;
  const discursiveScore = approvedDiscursive * discursivePoints;
  const totalGrade = roundScore(objectiveScore + discursiveScore);

  const toggleExpand = (qi) => {
    setExpandedQuestions(prev => ({ ...prev, [qi]: !prev[qi] }));
  };

  const toggleDiscursive = (qi, approved) => {
    setDiscursiveGrades(prev => ({ ...prev, [qi]: approved }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveExamGrade', {
        exam_id: exam.id,
        student_email: submission.student_email,
        grade: totalGrade,
        feedback,
      });

      await base44.entities.ExamSubmission.update(submission.id, {
        grade: totalGrade,
        feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
        graded_by: (await base44.auth.me()).email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Correção salva com sucesso! Nota e pontuação atualizadas.');
      onBack();
    },
    onError: (err) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in-up">
      <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
        <ArrowLeft size={16} /> Voltar
      </Button>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <h2 className="text-xl font-bold text-foreground mb-3">{exam.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Aluno</p>
            <p className="font-bold text-foreground truncate">{submission.student_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-bold text-foreground truncate">{submission.student_email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Envio</p>
            <p className="font-bold text-foreground">{new Date(submission.submitted_at).toLocaleString('pt-BR')}</p>
          </div>
          {submission.time_spent_seconds && (
            <div>
              <p className="text-muted-foreground">Tempo</p>
              <p className="font-bold text-foreground">{Math.floor(submission.time_spent_seconds / 60)}min {submission.time_spent_seconds % 60}s</p>
            </div>
          )}
        </div>
        {submission.tab_switch_detected && (
          <div className="mt-3 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-2.5">
            <XCircle size={14} className="shrink-0" />
            <p className="text-xs font-bold">Saída de tela detectada durante a prova</p>
          </div>
        )}
      </div>

      {/* Score Summary */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/10 border border-primary/20 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-primary flex items-center gap-2">
            <Award size={16} /> Resumo da Correção
          </h3>
          <div className="text-right">
            <p className="text-xs text-primary font-bold">Nota Parcial</p>
            <p className="font-mono font-black text-3xl text-primary">{formatScore(totalGrade)} / {formatScore(50)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-card/50 rounded-xl p-3">
            <p className="text-muted-foreground mb-1">Questões Objetivas</p>
            <p className="font-bold text-foreground">
              {objectiveQuestions.length} questões · 
              <span className="text-primary ml-1">{formatScore(objectiveScore)} pts</span>
            </p>
          </div>
          <div className="bg-card/50 rounded-xl p-3">
            <p className="text-muted-foreground mb-1">Questões Discursivas</p>
            <p className="font-bold text-foreground">
              {discursiveCount} questões · 
              <span className="text-primary ml-1">
                {approvedDiscursive}/{discursiveCount} aprovadas ({formatScore(discursiveScore)} pts)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-6">
        {questions.map((q, qi) => {
          const studentAnswer = studentAnswers[qi];
          const isText = q.answer_type === 'text';
          const isExpanded = expandedQuestions[qi];
          const isCorrect = !isText && Number(studentAnswer) === q.correct_index;
          const discursiveApproved = discursiveGrades[qi];

          return (
            <div key={qi} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Question Header */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 border-b border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">Questão {qi + 1}</span>
                    {isText ? (
                      <span className="text-[9px] font-bold bg-accent text-primary px-1.5 py-0.5 rounded-full">Discursiva</span>
                    ) : (
                      <span className="text-[9px] font-bold bg-accent text-primary px-1.5 py-0.5 rounded-full">Objetiva</span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-sm">{q.question}</p>
                </div>
                {!isText && (
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ml-3 ${isCorrect ? 'bg-accent text-primary' : 'bg-destructive text-destructive'}`}>
                    {isCorrect ? '✓ Automática' : '✗ Automática'}
                  </span>
                )}
                {isText && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button
                      onClick={() => toggleDiscursive(qi, true)}
                      className={`p-1.5 rounded-lg transition-all ${discursiveApproved === true ? 'bg-accent text-primary-foreground' : 'bg-secondary hover:bg-accent/20 text-muted-foreground'}`}
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => toggleDiscursive(qi, false)}
                      className={`p-1.5 rounded-lg transition-all ${discursiveApproved === false ? 'bg-destructive text-primary-foreground' : 'bg-secondary hover:bg-destructive/20 text-muted-foreground'}`}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Expandable Content */}
              <div className={`transition-all ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'} overflow-hidden`}>
                <div className="p-4 space-y-3 bg-background">
                  {isText ? (
                    <>
                      <div className="bg-secondary/40 border border-border rounded-xl p-3">
                        <p className="text-xs font-bold text-muted-foreground mb-1">Resposta do aluno:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{studentAnswer || <span className="italic text-muted-foreground">Não respondida</span>}</p>
                      </div>
                      {q.options && (
                        <div className="bg-accent/10 border border-primary/20 rounded-xl p-3">
                          <p className="text-xs font-bold text-primary mb-2">Gabarito sugerido:</p>
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="text-xs text-primary mb-1">{String.fromCharCode(65 + oi)}) {opt}</div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      {q.options?.map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${oi === q.correct_index ? 'bg-accent/10 border border-primary/30' : oi === Number(studentAnswer) ? 'bg-accent/10 border border-primary/30' : 'bg-secondary/30'}`}>
                          <span className="font-bold">{String.fromCharCode(65 + oi)})</span>
                          <span className="flex-1">{opt}</span>
                          {oi === q.correct_index && <CheckCircle size={12} className="text-primary" />}
                          {oi === Number(studentAnswer) && oi !== q.correct_index && <XCircle size={12} className="text-destructive" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Expand Button */}
              <button
                onClick={() => toggleExpand(qi)}
                className="w-full px-4 py-2 bg-secondary/50 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 border-t border-border"
              >
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feedback & Save */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-6">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2"><Award size={15} /> Feedback Final</h3>
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Comentários para o aluno</label>
          <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Feedback sobre o desempenho..." />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft size={14} /> Cancelar</Button>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending} 
          className="flex-1 gap-2 h-12 font-black bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-primary-foreground shadow-lg"
        >
          <CheckCircle size={18} /> 
          {saveMutation.isPending ? 'Salvando...' : `Salvar Correção (${formatScore(totalGrade)}/${50} pts)`}
        </Button>
      </div>
    </div>
  );
}