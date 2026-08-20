/**
 * ExamQuizView — Prova com timer e detecção de troca de aba
 */
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, ArrowLeft, PartyPopper, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const EXAM_DURATION_SECONDS = 60 * 60;

export default function ExamQuizView({ exam, user, onBack }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [tabSwitchDetected, setTabSwitchDetected] = useState(false);

  const questions = exam.quiz_questions || [];
  const hasTextQuestions = questions.some(q => q.answer_type === 'text');

  // Timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
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

  // Confetti
  useEffect(() => {
    if (!submitted) return;
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#5b5ef4', '#1db89e', '#f59e0b'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#5b5ef4', '#1db89e', '#f59e0b'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }, [submitted]);

  const handleSubmit = async (timeUp = false) => {
    if (questions.length === 0) return;
    await base44.entities.ExamSubmission.create({
      exam_id: exam.id,
      student_email: user.email || '',
      student_name: user.full_name || '',
      course: user.course || exam.course || 'tcc',
      quiz_answers: questions.map((q, i) => q.answer_type === 'text' ? (answers[i]?.text || '') : String(answers[i] ?? '')),
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      time_spent_seconds: EXAM_DURATION_SECONDS - timeLeft,
      tab_switch_detected: tabSwitchDetected,
    });
    setSubmitted(true);
    toast.success(timeUp ? 'Tempo esgotado! Prova enviada.' : 'Prova enviada com sucesso!');
  };

  const allAnswered = questions.every((q, i) => q.answer_type === 'text' ? (answers[i]?.text || '').trim() : answers[i] !== undefined);
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (questions.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}><ArrowLeft size={16} /> Voltar</Button>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Esta prova ainda não possui perguntas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}><ArrowLeft size={16} /> Voltar</Button>
      
      {/* Timer Header */}
      <div className={`sticky top-0 z-50 mb-4 p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${tabSwitchDetected ? 'bg-destructive/10 border-destructive' : 'bg-card border-border'}`}>
        <div className="flex items-center gap-2">
          <Clock size={20} className={tabSwitchDetected ? 'text-destructive' : 'text-primary'} />
          <span className={`font-mono font-black text-xl ${tabSwitchDetected ? 'text-destructive' : 'text-foreground'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        {tabSwitchDetected && (
          <div className="flex items-center gap-2 text-destructive text-xs font-bold">
            <AlertTriangle size={14} /> Saída da tela detectada
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-1">{exam.title}</h2>
      {exam.description && <p className="text-sm text-muted-foreground mb-5">{exam.description}</p>}

      {submitted ? (
        <div className="bg-card p-8 rounded-2xl border border-border text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-primary" />
            <PartyPopper size={32} className="text-primary absolute -mt-8 ml-16 animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">🎉 Parabéns pela Conclusão!</h3>
          <p className="text-sm text-muted-foreground mb-4">Sua prova foi enviada com sucesso.</p>
          {hasTextQuestions ? (
            <div className="p-4 bg-accent/10 border border-primary/20 rounded-xl">
              <p className="text-sm text-primary font-bold">⏳ Nota em breve</p>
              <p className="text-xs text-primary/70 mt-1">O professor irá corrigir sua prova.</p>
            </div>
          ) : (
            <div className="p-4 bg-accent/10 border border-primary/20 rounded-xl">
              <p className="text-sm text-primary font-bold">📋 Aguarde a correção</p>
              <p className="text-xs text-primary/70 mt-1">Sua nota será publicada em breve.</p>
            </div>
          )}
          {tabSwitchDetected && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-xs text-destructive font-bold">⚠️ Registro de saída da tela</p>
              <p className="text-[10px] text-destructive/70 mt-1">Sua saída da tela foi registrada. Suas respostas escritas foram zeradas.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="bg-card p-5 rounded-2xl border border-border">
              <p className="font-semibold text-foreground mb-4 text-sm">
                {qi + 1}. {q.question}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${q.answer_type === 'text' ? 'bg-accent text-primary' : 'bg-accent text-primary'}`}>
                  {q.answer_type === 'text' ? 'Dissertativa' : 'Objetiva'}
                </span>
              </p>
              {q.answer_type === 'text' ? (
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={answers[qi]?.text || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [qi]: { text: e.target.value } }))}
                  rows={4}
                />
              ) : (
                <div className="space-y-2">
                  {(q.options || []).map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                      className={`w-full text-left p-3 rounded-xl border-2 text-sm ${answers[qi] === oi ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-primary/30'}`}
                    >
                      {String.fromCharCode(65 + oi)}) {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button className="w-full h-11" size="lg" onClick={() => handleSubmit()} disabled={!allAnswered}>
            Finalizar e Enviar Prova
          </Button>
          {!allAnswered && <p className="text-xs text-muted-foreground text-center">Responda todas as questões</p>}
        </div>
      )}
    </div>
  );
}