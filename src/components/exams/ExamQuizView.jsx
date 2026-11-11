/**
 * ExamQuizView — Prova com timer, detecção de troca de aba e correção instantânea (mínimo 50% para aprovação)
 */
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, ArrowLeft, PartyPopper, Clock, AlertTriangle, Award, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { evaluateQuizOrExamSubmission, EXAM_PASS_MIN_PERCENT } from '@/lib/autoCorrectionResponses';

const EXAM_DURATION_SECONDS = 60 * 60;

export default function ExamQuizView({ exam, user, onBack }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [tabSwitchDetected, setTabSwitchDetected] = useState(false);

  const questions = exam.quiz_questions || [];

  // Timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  // Tab switch detection
  useEffect(() => {
    if (submitted) return;
    const handleVisibilityChange = () => {
      if (document.hidden && !tabSwitchDetected) {
        setTabSwitchDetected(true);
        const cleared = {};
        questions.forEach((q, i) => {
          cleared[i] = q.answer_type === 'text' ? { text: '' } : answers[i];
        });
        setAnswers(cleared);
        toast.error('⚠️ Saída da tela detectada! Respostas escritas zeradas.', { duration: 8000 });
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [submitted, tabSwitchDetected, answers, questions]);

  // Confetti apenas quando aprovado (>= 50%)
  useEffect(() => {
    if (!submitted || !autoResult?.passed) return;
    const end = Date.now() + 2800;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#5b5ef4', '#1db89e', '#f59e0b'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#5b5ef4', '#1db89e', '#f59e0b'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 } });
  }, [submitted, autoResult?.passed]);

  const handleRetry = () => {
    setAnswers({});
    setAutoResult(null);
    setSubmitted(false);
    setTabSwitchDetected(false);
    setTimeLeft(EXAM_DURATION_SECONDS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (timeUp = false) => {
    if (questions.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const evaluation = evaluateQuizOrExamSubmission({
        questions,
        answers,
        seed: `${exam.id}:${user?.email || user?.code || ''}`,
      });

      // Mostra o resultado instantaneamente no ato da conclusão
      setAutoResult(evaluation);
      setSubmitted(true);

      await base44.functions.invoke('saveStudentRecord', {
        action: 'create',
        entity: 'ExamSubmission',
        student_identifiers: [user?.email, user?.code].filter(Boolean),
        data: {
          exam_id: exam.id,
          student_email: user?.email || user?.code || '',
          student_name: user?.name || user?.full_name || '',
          course: user?.course || exam.course || 'tcc',
          quiz_answers: questions.map((q, i) => (q.answer_type === 'text' ? answers[i]?.text || '' : String(answers[i] ?? ''))),
          passed: evaluation.passed,
          correct_count: evaluation.correctCount,
          total_questions: evaluation.totalQuestions,
          accuracy_percent: evaluation.accuracyPercent,
          grade: evaluation.accuracyPercent,
          feedback: evaluation.feedback,
          status: 'graded',
          submitted_at: new Date().toISOString(),
          graded_at: new Date().toISOString(),
          time_spent_seconds: EXAM_DURATION_SECONDS - timeLeft,
          tab_switch_detected: tabSwitchDetected,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['exam-submissions'] }),
        queryClient.invalidateQueries({ queryKey: ['student-learning-records', 'ExamSubmission'] }),
        queryClient.invalidateQueries({ queryKey: ['module-trophy-submissions'] }),
      ]);

      if (evaluation.passed) {
        toast.success(
          timeUp
            ? `Tempo encerrado! Você atingiu ${evaluation.accuracyPercent}% e foi aprovado(a)!`
            : `Parabéns! Você atingiu ${evaluation.accuracyPercent}% de acerto e está aprovado(a)!`
        );
      } else {
        toast.error(
          `Você obteve ${evaluation.accuracyPercent}% de acerto (mínimo ${EXAM_PASS_MIN_PERCENT}%). Será necessário repetir a prova.`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.every((q, i) =>
    q.answer_type === 'text' ? (answers[i]?.text || '').trim().length > 0 : answers[i] !== undefined
  );
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (questions.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </Button>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Esta prova ainda não possui perguntas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar
      </Button>

      {/* Timer Header */}
      {!submitted && (
        <div
          className={`sticky top-0 z-50 mb-4 p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${
            tabSwitchDetected ? 'bg-red-500/10 border-red-500' : 'bg-card border-border'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock size={20} className={tabSwitchDetected ? 'text-red-500' : 'text-primary'} />
            <span className={`font-mono font-black text-xl ${tabSwitchDetected ? 'text-red-500' : 'text-foreground'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            Mínimo para aprovação: {EXAM_PASS_MIN_PERCENT}% de acertos
          </span>
          {tabSwitchDetected && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
              <AlertTriangle size={14} /> Saída da tela detectada
            </div>
          )}
        </div>
      )}

      <h2 className="text-xl font-bold text-foreground mb-1">{exam.title}</h2>
      {exam.description && <p className="text-sm text-muted-foreground mb-5">{exam.description}</p>}

      {submitted && autoResult ? (
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border text-center space-y-5">
          {autoResult.passed ? (
            <>
              <div className="flex justify-center relative">
                <CheckCircle size={64} className="text-emerald-500" />
                <PartyPopper size={30} className="text-yellow-500 absolute -mt-3 ml-16 animate-bounce" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                  ✓ Aprovado(a) na Prova
                </span>
                <h3 className="text-2xl font-black text-foreground">Parabéns pela Aprovação!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Você acertou <strong>{autoResult.correctCount} de {autoResult.totalQuestions}</strong> questões (<strong>{autoResult.accuracyPercent}%</strong> de aproveitamento).
                </p>
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-left">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1.5">
                  <Award size={16} /> Resultado Instantâneo · Aprovado(a)
                </p>
                <p className="text-xs text-foreground leading-relaxed">{autoResult.feedback}</p>
              </div>
              <div className="flex justify-center pt-2">
                <Button onClick={onBack} className="gap-2 font-bold">
                  <ArrowLeft size={15} /> Voltar para Provas
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <XCircle size={64} className="text-amber-500" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                  Necessário Repetir a Prova
                </span>
                <h3 className="text-2xl font-black text-foreground">Aproveitamento abaixo de {EXAM_PASS_MIN_PERCENT}%</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Você acertou <strong>{autoResult.correctCount} de {autoResult.totalQuestions}</strong> questões (<strong>{autoResult.accuracyPercent}%</strong>). Para ser aprovado(a), é preciso atingir pelo menos <strong>{EXAM_PASS_MIN_PERCENT}%</strong> de respostas corretas.
                </p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2 text-left">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-black flex items-center gap-1.5">
                  <AlertTriangle size={16} /> Orientação de Correção Instantânea
                </p>
                <p className="text-xs text-foreground leading-relaxed">{autoResult.feedback}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <Button onClick={handleRetry} className="gap-2 font-bold bg-primary text-primary-foreground">
                  <RotateCcw size={15} /> Repetir a Prova Agora
                </Button>
                <Button variant="outline" onClick={onBack} className="gap-2">
                  <ArrowLeft size={15} /> Revisar Conteúdo e Tentar Depois
                </Button>
              </div>
            </>
          )}

          {tabSwitchDetected && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400 font-bold">⚠️ Registro de saída da tela</p>
              <p className="text-[10px] text-red-300/70 mt-1">
                Sua saída da tela foi registrada e as respostas escritas anteriores foram zeradas.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="bg-card p-5 rounded-2xl border border-border">
              <p className="font-semibold text-foreground mb-4 text-sm">
                {qi + 1}. {q.question}
                <span
                  className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    q.answer_type === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {q.answer_type === 'text' ? 'Dissertativa' : 'Objetiva'}
                </span>
              </p>
              {q.answer_type === 'text' ? (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Textarea
                      placeholder="Desenvolva sua resposta com clareza..."
                      value={answers[qi]?.text || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [qi]: { text: e.target.value } }))}
                      rows={4}
                    />
                    <VoiceDictationButton
                      value={answers[qi]?.text || ''}
                      onChange={(text) => setAnswers((prev) => ({ ...prev, [qi]: { text } }))}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Escreva uma resposta completa explicando seu raciocínio clínico.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(q.options || []).map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                      className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-colors ${
                        answers[qi] === oi
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}) {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button
            className="w-full h-11 font-bold"
            size="lg"
            onClick={() => handleSubmit(false)}
            disabled={!allAnswered || submitting}
          >
            {submitting ? 'Corrigindo prova...' : 'Finalizar Prova e Ver Resultado Instantâneo'}
          </Button>
          {!allAnswered && <p className="text-xs text-muted-foreground text-center">Responda todas as questões para concluir</p>}
        </div>
      )}
    </div>
  );
}