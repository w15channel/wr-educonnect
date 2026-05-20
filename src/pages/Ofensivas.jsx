import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { base44 } from '@/api/base44Client';
import {
  Flame, CheckCircle, Star, Zap, BookOpen, Loader2, Users, Calendar, Lock, Send, Trophy, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Pontuação por posição: 1=0.1, 2=0.1, 3=0.5(baú), 4=0.1, 5=0.1
const QUESTION_POINTS = [0.1, 0.1, 0.5, 0.1, 0.1];
const TOTAL_POINTS = QUESTION_POINTS.reduce((a, b) => a + b, 0); // 1.0

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return '';
}

// Posições em zigue-zague para as 5 bolinhas (centro, direita, centro, esquerda, centro)
const TRAIL_POSITIONS = [
  { x: 'center', offset: 0 },
  { x: 'right',  offset: 60 },
  { x: 'center', offset: 0 },   // baú
  { x: 'left',   offset: -60 },
  { x: 'center', offset: 0 },
];

// Mascote corujinha SVG simples
function Owl() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl select-none" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}>🦉</div>
    </div>
  );
}

// Bolinha da trilha
function TrailNode({ question, idx, answered, locked, isChest, onPress }) {
  const pts = QUESTION_POINTS[idx];

  // Bolinha do baú
  if (isChest) {
    return (
      <button
        onClick={() => !locked && onPress()}
        disabled={locked}
        className={`relative flex flex-col items-center group transition-transform active:scale-95 ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        style={{ marginLeft: TRAIL_POSITIONS[idx].offset }}
      >
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg border-4 transition-all ${
          answered
            ? 'bg-yellow-400 border-yellow-300 shadow-yellow-400/40'
            : locked
            ? 'bg-secondary border-border'
            : 'bg-amber-500 border-amber-400 shadow-amber-400/40'
        }`}>
          {answered ? (
            <CheckCircle size={32} className="text-white" />
          ) : locked ? (
            <Lock size={28} className="text-muted-foreground" />
          ) : (
            <span className="text-4xl">🗝️</span>
          )}
        </div>
        {!locked && !answered && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-amber-300 shadow">
            +{pts}
          </div>
        )}
        {answered && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-green-300 shadow">
            ✓
          </div>
        )}
        <span className={`mt-2 text-[11px] font-bold ${answered ? 'text-green-400' : locked ? 'text-muted-foreground' : 'text-amber-400'}`}>
          Baú do Saber
        </span>
        <span className="text-[10px] text-muted-foreground/70">+{pts} pts</span>
      </button>
    );
  }

  // Bolinha normal
  return (
    <button
      onClick={() => !locked && onPress()}
      disabled={locked}
      className={`relative flex flex-col items-center group transition-transform active:scale-95 ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      style={{ marginLeft: TRAIL_POSITIONS[idx].offset }}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all ${
        answered
          ? 'bg-green-500 border-green-400 shadow-green-400/40'
          : locked
          ? 'bg-secondary border-border'
          : 'bg-primary border-primary/70 shadow-primary/30'
      }`}>
        {answered ? (
          <CheckCircle size={26} className="text-white" />
        ) : locked ? (
          <Lock size={20} className="text-muted-foreground" />
        ) : (
          <Flame size={24} className="text-white" />
        )}
      </div>
      {!locked && !answered && (
        <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-primary/50 shadow">
          +{pts}
        </div>
      )}
      {answered && (
        <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
          ✓
        </div>
      )}
      <span className={`mt-1.5 text-[10px] font-bold ${answered ? 'text-green-400' : locked ? 'text-muted-foreground' : 'text-foreground/70'}`}>
        {answered ? 'Feita' : locked ? 'Bloqueada' : `Pergunta ${idx + 1}`}
      </span>
      <span className="text-[10px] text-muted-foreground/60">+{pts} pts</span>
    </button>
  );
}

// Conector vertical entre bolinhas
function Connector({ answered }) {
  return (
    <div className="flex justify-center my-1">
      <div className={`w-1 h-8 rounded-full ${answered ? 'bg-green-400' : 'bg-border'}`} />
    </div>
  );
}

// Popup de pergunta
function QuestionModal({ question, idx, isChest, pointsValue, answered, savedAnswer, open, onClose, onSubmit, isPending }) {
  const [answer, setAnswer] = useState('');

  React.useEffect(() => {
    if (open) setAnswer('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isChest ? <span className="text-xl">🗝️</span> : <Flame size={16} className="text-orange-500" />}
            {isChest ? 'Baú do Saber' : `Pergunta ${idx + 1}`}
            <span className="ml-auto text-xs font-bold text-yellow-500 flex items-center gap-0.5">
              <Star size={11} className="fill-yellow-400" /> +{pointsValue} pts
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {isChest && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-500 font-semibold flex items-center gap-1.5">
              🗝️ Pergunta desafio! Vale mais pontos — reflita com cuidado.
            </div>
          )}

          <p className="text-sm font-semibold text-foreground leading-relaxed">{question?.text}</p>

          {question?.hint && (
            <p className="text-xs text-muted-foreground italic flex gap-1.5">
              <span>💡</span> {question.hint}
            </p>
          )}

          {answered ? (
            <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle size={11} /> Resposta registrada!</p>
              {savedAnswer && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{savedAnswer}</p>}
            </div>
          ) : (
            <>
              <Textarea
                placeholder="Escreva sua reflexão aqui... Não precisa ser perfeita!"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={4}
                className="text-sm"
                autoFocus
              />
              <Button
                className="w-full gap-2"
                disabled={!answer.trim() || isPending}
                onClick={() => onSubmit(answer)}
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Registrar · +{pointsValue} pts
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Painel admin para gerar novo desafio
function GenerateChallengePanel({ lessons, course, onGenerated }) {
  const [selectedLesson, setSelectedLesson] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleGenerate = async () => {
    const lesson = lessons.find(l => l.id === selectedLesson);
    const topic = customTopic.trim() || lesson?.title || 'comportamento humano e emoções';
    const lessonDesc = lesson?.description || '';
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é professor de psicologia/comportamento humano. Gere 5 perguntas de reflexão para alunos de curso online.

Tema: "${topic}"
${lessonDesc ? `Descrição: "${lessonDesc}"` : ''}

Regras:
- Linguagem simples, acessível, cotidiana
- Perguntas 1, 2, 4 e 5: reflexão rápida e leve (fáceis)
- Pergunta 3 (BAÚ): mais reflexiva, exige mais elaboração, maior dificuldade
- Cada pergunta: máximo 2 linhas
- Cada pergunta tem uma dica curta (hint)
- Não repita temas

JSON exato:
{
  "questions": [
    { "id": "q1", "text": "...", "hint": "..." },
    { "id": "q2", "text": "...", "hint": "..." },
    { "id": "q3", "text": "...", "hint": "..." },
    { "id": "q4", "text": "...", "hint": "..." },
    { "id": "q5", "text": "...", "hint": "..." }
  ]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' },
                  hint: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const questions = result?.questions || [];
      if (questions.length < 3) throw new Error('IA retornou perguntas insuficientes');

      await base44.entities.DailyChallenge.create({
        date: today,
        course,
        lesson_ref: lesson?.title || topic,
        lesson_id: selectedLesson || null,
        questions: questions.slice(0, 5),
      });

      await queryClient.invalidateQueries({ queryKey: ['daily-challenge'] });
      toast.success('🔥 Nova ofensiva gerada!');
      onGenerated();
    } catch (err) {
      toast.error('Erro: ' + (err.message || 'tente novamente'));
    } finally {
      setGenerating(false);
    }
  };

  const courseLessons = lessons.filter(l => l.course === course);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-foreground mb-1">Aula de referência</p>
        <Select value={selectedLesson} onValueChange={setSelectedLesson}>
          <SelectTrigger><SelectValue placeholder="Selecionar aula..." /></SelectTrigger>
          <SelectContent>
            {courseLessons.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs font-bold text-foreground mb-1">Ou tema livre</p>
        <Textarea
          placeholder="Ex: emoções, autoconhecimento, relacionamentos..."
          value={customTopic}
          onChange={e => setCustomTopic(e.target.value)}
          rows={2}
          className="text-sm"
        />
      </div>
      <Button
        onClick={handleGenerate}
        disabled={generating || (!selectedLesson && !customTopic.trim())}
        className="w-full gap-2"
      >
        {generating
          ? <><Loader2 size={14} className="animate-spin" /> Gerando com IA...</>
          : <><Zap size={14} /> Gerar 5 Perguntas com IA</>}
      </Button>
    </div>
  );
}

export default function Ofensivas() {
  const ctx = useOutletContext() || {};
  const { session: authSession } = useCustomAuth();
  const session = ctx.user || authSession;
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const userCourse = session?.course || ctx.course || 'tcc';

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null); // idx of open modal

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['daily-challenge', userCourse, today],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse, date: today }, '-created_date', 5),
    staleTime: 60000,
  });
  const challenge = challenges[0] || null;

  const { data: myResponse } = useQuery({
    queryKey: ['daily-response', challenge?.id, session?.email],
    queryFn: () => base44.entities.DailyChallengeResponse.filter(
      { challenge_id: challenge.id, student_email: session?.email || '' },
      '-created_date', 1
    ),
    enabled: !!challenge?.id && !!session?.email,
  });

  const myResponseRecord = myResponse?.[0] || null;
  const answeredMap = {};
  (myResponseRecord?.answers || []).forEach(a => { answeredMap[a.question_id] = a.answer; });
  const answeredCount = Object.keys(answeredMap).length;

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['all-challenges', userCourse],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse }, '-created_date', 30),
    enabled: isTeacher,
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ['all-responses-today', challenge?.id],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ challenge_id: challenge.id }, '-created_date', 200),
    enabled: isTeacher && !!challenge?.id,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons-ref', userCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 100),
    enabled: isTeacher,
  });

  const handleSubmitAnswer = async (questionId, answer) => {
    if (!answer?.trim()) return;
    setSubmitting(prev => ({ ...prev, [questionId]: true }));
    try {
      const currentAnswers = myResponseRecord?.answers || [];
      const updatedAnswers = [...currentAnswers.filter(a => a.question_id !== questionId), { question_id: questionId, answer }];
      const newCount = updatedAnswers.length;
      // Calcular pontos baseados nas posições respondidas
      const questions = challenge?.questions || [];
      let pts = 0;
      updatedAnswers.forEach(a => {
        const qIdx = questions.findIndex(q => q.id === a.question_id);
        if (qIdx >= 0) pts += QUESTION_POINTS[qIdx] || 0.1;
      });

      if (myResponseRecord) {
        await base44.entities.DailyChallengeResponse.update(myResponseRecord.id, {
          answers: updatedAnswers,
          questions_answered: newCount,
          points_earned: pts,
        });
      } else {
        await base44.entities.DailyChallengeResponse.create({
          challenge_id: challenge.id,
          date: today,
          course: userCourse,
          student_email: session?.email || '',
          student_name: session?.name || session?.full_name || '',
          answers: updatedAnswers,
          questions_answered: newCount,
          points_earned: pts,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['daily-response'] });
      const pointsEarned = QUESTION_POINTS[activeQuestion] || 0.1;
      toast.success(`🔥 +${pointsEarned} pts!`);
      setActiveQuestion(null);
    } catch (err) {
      toast.error('Erro: ' + (err.message || 'tente novamente'));
    } finally {
      setSubmitting(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  const questions = challenge?.questions || [];

  return (
    <div className="p-3 md:p-5 max-w-[560px] mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame size={22} className="text-orange-500" /> Ofensivas Diárias
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5 capitalize">{todayLabel}</p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowGenerate(true)} className="gap-2 h-9 text-sm shrink-0 bg-orange-500 hover:bg-orange-600">
            <Zap size={15} /> Atualizar Ofensiva
          </Button>
        )}
      </div>

      {/* SEM DESAFIO */}
      {!challenge && (
        <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-2xl">
          <Flame size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-bold">Nenhuma ofensiva para hoje</p>
          <p className="text-sm mt-1 text-muted-foreground/70">
            {isTeacher
              ? 'Clique em "Atualizar Ofensiva" para gerar as perguntas do dia.'
              : 'O professor ainda não liberou a ofensiva de hoje. Volte mais tarde!'}
          </p>
        </div>
      )}

      {/* TRILHA DO TESOURO — alunos */}
      {!isTeacher && challenge && (
        <div>
          {/* Tema da ofensiva */}
          {challenge.lesson_ref && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-500 font-semibold mb-6">
              <BookOpen size={13} /> {challenge.lesson_ref}
            </div>
          )}

          {/* Pontuação total */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {[0,1,2,3,4].map(i => {
              const q = questions[i];
              const isAnswered = q && !!answeredMap[q?.id];
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                    isAnswered ? 'bg-green-500 border-green-400 text-white' : 'bg-secondary border-border text-muted-foreground'
                  }`}>
                    {isAnswered ? '✓' : i + 1}
                  </div>
                  <span className="text-[9px] text-muted-foreground">{QUESTION_POINTS[i]}</span>
                </div>
              );
            })}
          </div>

          {/* MAPA DO TESOURO */}
          {answeredCount >= 5 && (
            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-400/30 rounded-2xl p-5 text-center mb-6">
              <Trophy size={36} className="mx-auto mb-2 text-yellow-400" />
              <p className="font-black text-lg text-foreground">Ofensiva Completa! 🔥</p>
              <p className="text-sm text-muted-foreground mt-1">+{TOTAL_POINTS.toFixed(1)} pts ganhos hoje. Volte amanhã!</p>
            </div>
          )}

          <div className="relative flex flex-col items-center py-4 select-none" style={{ minHeight: 480 }}>
            {/* Mascote no topo */}
            <div className="mb-4">
              <Owl />
              {answeredCount < 5 && (
                <div className="mt-2 bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground text-center shadow">
                  {answeredCount === 0 ? 'Toque numa bolinha para começar!' : `${5 - answeredCount} pergunta${5 - answeredCount !== 1 ? 's' : ''} restante${5 - answeredCount !== 1 ? 's' : ''}`}
                </div>
              )}
            </div>

            {/* Trilha */}
            {questions.map((q, idx) => {
              const isAnswered = !!answeredMap[q.id];
              const isLocked = idx > 0 && !answeredMap[questions[idx - 1]?.id];
              const isChest = idx === 2;
              const pts = QUESTION_POINTS[idx];

              return (
                <React.Fragment key={q.id}>
                  <TrailNode
                    question={q}
                    idx={idx}
                    answered={isAnswered}
                    locked={isLocked}
                    isChest={isChest}
                    onPress={() => setActiveQuestion(idx)}
                  />
                  {idx < questions.length - 1 && (
                    <Connector answered={isAnswered} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Modal da pergunta ativa */}
          {activeQuestion !== null && questions[activeQuestion] && (
            <QuestionModal
              question={questions[activeQuestion]}
              idx={activeQuestion}
              isChest={activeQuestion === 2}
              pointsValue={QUESTION_POINTS[activeQuestion]}
              answered={!!answeredMap[questions[activeQuestion]?.id]}
              savedAnswer={answeredMap[questions[activeQuestion]?.id]}
              open={activeQuestion !== null}
              onClose={() => setActiveQuestion(null)}
              onSubmit={(answer) => handleSubmitAnswer(questions[activeQuestion].id, answer)}
              isPending={!!submitting[questions[activeQuestion]?.id]}
            />
          )}
        </div>
      )}

      {/* VISÃO PROFESSOR */}
      {isTeacher && challenge && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span className="font-bold text-sm">Ofensiva Ativa — {today}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={12} />
                <span>{allResponses.length} aluno{allResponses.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {challenge.lesson_ref && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                <BookOpen size={11} /> <span className="font-semibold text-foreground">{challenge.lesson_ref}</span>
              </p>
            )}
            <div className="space-y-2">
              {(challenge.questions || []).map((q, i) => (
                <div key={q.id} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${i === 2 ? 'bg-amber-500/10 border border-amber-400/20' : 'bg-secondary/30'}`}>
                  <span className={`font-black shrink-0 ${i === 2 ? 'text-amber-400' : 'text-primary'}`}>{i === 2 ? '🗝️' : `${i + 1}.`}</span>
                  <div className="flex-1">
                    <span className="text-foreground">{q.text}</span>
                    {i === 2 && <span className="ml-1 text-amber-400 font-bold">(Baú · +0.5pts)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {allResponses.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Users size={14} /> Participações</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allResponses.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 bg-secondary/40 rounded-xl text-xs">
                    <span className="font-semibold text-foreground truncate">{r.student_name || r.student_email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">{r.questions_answered || 0}/5</span>
                      <span className="text-yellow-500 font-bold flex items-center gap-0.5">
                        <Star size={9} className="fill-yellow-400" /> +{(r.points_earned || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allChallenges.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-3">Histórico</h3>
              <div className="space-y-1.5">
                {allChallenges.map(c => (
                  <div key={c.id} className={`flex items-center justify-between p-2 rounded-xl text-xs ${c.date === today ? 'bg-orange-500/10 border border-orange-400/20' : 'bg-secondary/30'}`}>
                    <span className="font-semibold">{c.date}</span>
                    <span className="text-muted-foreground truncate max-w-[160px]">{c.lesson_ref || '—'}</span>
                    <span className="text-muted-foreground shrink-0">{(c.questions || []).length}q</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog: Gerar nova ofensiva */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={16} className="text-orange-500" /> Gerar Nova Ofensiva
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2 mb-1">A IA vai gerar 5 perguntas (posição 3 = Baú, mais difícil, +0.5pts).</p>
          <GenerateChallengePanel lessons={lessons} course={userCourse} onGenerated={() => setShowGenerate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}