import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, ArrowLeft, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';

export default function QuizView({ task, user, onBack }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const questions = task.quiz_questions || [];

  // Confetti animation on submit
  useEffect(() => {
    if (submitted) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#5b5ef4', '#1db89e', '#f59e0b', '#10b981'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#5b5ef4', '#1db89e', '#f59e0b', '#10b981'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Big burst in the center
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5b5ef4', '#1db89e', '#f59e0b', '#10b981', '#ec4899'],
      });
    }
  }, [submitted]);

  const handleSelect = (qIndex, optIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleText = (qIndex, text) => {
    setAnswers(prev => ({ ...prev, [qIndex]: { text } }));
  };

  const handleSubmit = async () => {
    if (questions.length === 0) { toast.info('Esta prova ainda não possui perguntas.'); return; }

    const choiceQuestions = questions.filter(q => q.answer_type !== 'text');
    let correct = 0;
    choiceQuestions.forEach((q, i) => {
      const origIndex = questions.indexOf(q);
      if (answers[origIndex] === q.correct_index) correct++;
    });

    const grade = choiceQuestions.length > 0
      ? roundScore((correct / choiceQuestions.length) * (50))
      : null;

    const hasTextQuestions = questions.some(q => q.answer_type === 'text');

    await base44.entities.TaskSubmission.create({
      task_id: task.id,
      student_email: user.email || user.code || '',
      student_name: user.name || user.full_name || '',
      course: user.course || task.course || 'tcc',
      quiz_answers: questions.map((q, i) => {
        const ans = answers[i];
        if (q.answer_type === 'text') return ans?.text ?? '';
        return ans !== undefined ? String(ans) : '';
      }),
      grade: grade !== null ? grade : undefined,
      status: hasTextQuestions ? 'submitted' : 'graded',
    });

    setScore(grade);
    setSubmitted(true);
    toast.success(grade !== null ? `Prova enviada! Nota parcial: ${formatScore(grade)}` : 'Prova enviada! O professor irá corrigir as respostas escritas.');
  };

  const allAnswered = questions.every((q, i) =>
    q.answer_type === 'text'
      ? (answers[i]?.text || '').trim().length > 0
      : answers[i] !== undefined
  );

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
      <h2 className="text-xl font-bold text-foreground mb-1">{task.title}</h2>
      {task.description && <p className="text-sm text-muted-foreground mb-5">{task.description}</p>}

      {submitted ? (
        <div className="bg-card p-8 rounded-2xl border border-border text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-emerald-500 to-amber-500"></div>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle size={64} className="text-green-500" />
              <PartyPopper size={32} className="text-yellow-500 absolute -top-4 -right-4 animate-bounce" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">🎉 Parabéns pela Entrega!</h3>
          {score !== null ? (
            <>
              <p className="text-muted-foreground text-sm mt-2">Nota parcial nas questões objetivas:</p>
              <p className="text-4xl font-black text-primary mt-2">{formatScore(score)} / {formatScore(50)}</p>
              {questions.some(q => q.answer_type === 'text') && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm text-amber-400 font-bold">📝 Questões dissertativas pendentes</p>
                  <p className="text-xs text-amber-300/70 mt-1">O professor irá corrigir suas respostas escritas em breve.</p>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Suas respostas foram enviadas com sucesso!
              </p>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-sm text-emerald-400 font-bold">⏳ Nota em breve</p>
                <p className="text-xs text-emerald-300/70 mt-1">
                  O professor irá corrigir sua prova e a nota será publicada em breve.
                </p>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground/60 mt-6">
            Você já pode fechar esta janela ou voltar para a lista de provas.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-card p-5 rounded-2xl border border-border">
              <p className="font-semibold text-foreground mb-4 text-sm leading-relaxed">
                {qIndex + 1}. {q.question}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${q.answer_type === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {q.answer_type === 'text' ? 'Dissertativa' : 'Objetiva'}
                </span>
              </p>
              {q.answer_type === 'text' ? (
                <Textarea
                  placeholder="Digite sua resposta aqui..."
                  value={answers[qIndex]?.text || ''}
                  onChange={e => handleText(qIndex, e.target.value)}
                  rows={4}
                />
              ) : (
                <div className="space-y-2">
                  {(q.options || []).map((opt, optIndex) => (
                    <button
                      key={optIndex}
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
          <Button className="w-full h-11" size="lg" onClick={handleSubmit} disabled={!allAnswered}>
            Finalizar e Enviar Prova
          </Button>
          {!allAnswered && <p className="text-xs text-muted-foreground text-center">Responda todas as questões para enviar</p>}
        </div>
      )}
    </div>
  );
}