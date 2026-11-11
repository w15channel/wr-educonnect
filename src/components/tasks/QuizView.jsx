import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, ArrowLeft, PartyPopper, Award, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { evaluateQuizOrExamSubmission, EXAM_PASS_MIN_PERCENT } from '@/lib/autoCorrectionResponses';

export default function QuizView({ task, user, onBack }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const questions = task.quiz_questions || [];

  useEffect(() => {
    if (submitted && result?.passed) {
      const duration = 2800;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#5b5ef4', '#1db89e', '#f59e0b', '#10b981'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#5b5ef4', '#1db89e', '#f59e0b', '#10b981'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 } });
    }
  }, [submitted, result?.passed]);

  const handleSelect = (qIndex, optIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleText = (qIndex, text) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { text } }));
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      toast.info('Esta prova ainda não possui perguntas.');
      return;
    }

    const evaluation = evaluateQuizOrExamSubmission({
      questions,
      answers,
      seed: `${task.id}:${user?.email || user?.code || ''}`,
    });

    setResult(evaluation);
    setSubmitted(true);

    if (evaluation.passed) {
      await base44.functions.invoke('saveStudentRecord', {
        action: 'create',
        entity: 'TaskSubmission',
        student_identifiers: [user?.email, user?.code].filter(Boolean),
        data: {
          task_id: task.id,
          student_email: user?.email || user?.code || '',
          student_name: user?.name || user?.full_name || '',
          course: user?.course || task.course || 'tcc',
          quiz_answers: questions.map((q, i) => {
            const ans = answers[i];
            if (q.answer_type === 'text') return ans?.text ?? '';
            return ans !== undefined ? String(ans) : '';
          }),
          grade: evaluation.accuracyPercent,
          feedback: evaluation.feedback,
          status: 'graded',
        },
      });
      toast.success(`Aprovado(a)! Você acertou ${evaluation.accuracyPercent}% da prova.`);
    } else {
      toast.error(`Você atingiu ${evaluation.accuracyPercent}% (mínimo ${EXAM_PASS_MIN_PERCENT}%). Repita a prova para aprovação.`);
    }
  };

  const allAnswered = questions.every((q, i) =>
    q.answer_type === 'text' ? (answers[i]?.text || '').trim().length > 0 : answers[i] !== undefined
  );

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
      <h2 className="text-xl font-bold text-foreground mb-1">{task.title}</h2>
      {task.description && <p className="text-sm text-muted-foreground mb-5">{task.description}</p>}

      {submitted && result ? (
        <div className="bg-card p-8 rounded-2xl border border-border text-center relative overflow-hidden space-y-4">
          <div className="flex justify-center">
            {result.passed ? (
              <div className="relative">
                <CheckCircle size={64} className="text-emerald-500" />
                <PartyPopper size={32} className="text-yellow-500 absolute -top-4 -right-4 animate-bounce" />
              </div>
            ) : (
              <XCircle size={64} className="text-amber-500" />
            )}
          </div>
          <h3 className="text-2xl font-black text-foreground">
            {result.passed ? '🎉 Aprovado(a)!' : `Aproveitamento abaixo de ${EXAM_PASS_MIN_PERCENT}%`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {result.correctCount} de {result.totalQuestions} questões corretas ({result.accuracyPercent}%)
          </p>
          <div
            className={`p-4 rounded-xl text-left space-y-1 border ${
              result.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/25'
            }`}
          >
            <p className="text-xs font-black flex items-center gap-1.5">
              <Award size={14} /> Resultado Instantâneo
            </p>
            <p className="text-xs text-foreground leading-relaxed">{result.feedback}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {!result.passed && (
              <Button onClick={handleRetry} className="gap-2 font-bold">
                <RotateCcw size={15} /> Repetir Prova Agora
              </Button>
            )}
            <Button variant={result.passed ? 'default' : 'outline'} onClick={onBack} className="gap-2">
              <ArrowLeft size={15} /> Voltar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-card p-5 rounded-2xl border border-border">
              <p className="font-semibold text-foreground mb-4 text-sm leading-relaxed">
                {qIndex + 1}. {q.question}
                <span
                  className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    q.answer_type === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {q.answer_type === 'text' ? 'Dissertativa' : 'Objetiva'}
                </span>
              </p>
              {q.answer_type === 'text' ? (
                <div className="flex items-start gap-2">
                  <Textarea
                    placeholder="Digite sua resposta completa aqui..."
                    value={answers[qIndex]?.text || ''}
                    onChange={(e) => handleText(qIndex, e.target.value)}
                    rows={4}
                  />
                  <VoiceDictationButton value={answers[qIndex]?.text || ''} onChange={(text) => handleText(qIndex, text)} className="mt-1" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(q.options || []).map((opt, optIndex) => (
                    <button
                      key={optIndex}
                      type="button"
                      onClick={() => handleSelect(qIndex, optIndex)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${
                        answers[qIndex] === optIndex
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:border-primary/30 text-foreground'
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}) {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button className="w-full h-11 font-bold" size="lg" onClick={handleSubmit} disabled={!allAnswered}>
            Finalizar Prova e Ver Resultado Instantâneo
          </Button>
          {!allAnswered && <p className="text-xs text-muted-foreground text-center">Responda todas as questões para enviar</p>}
        </div>
      )}
    </div>
  );
}