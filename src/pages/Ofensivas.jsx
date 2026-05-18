import React, { useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Flame, CheckCircle, Star, RefreshCw, ChevronDown, ChevronUp,
  Send, Trophy, Zap, BookOpen, Loader2, Users, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const POINTS_PER_QUESTION = 0.1;
const MAX_QUESTIONS = 5;

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return '';
}

// Barra de progresso diária
function DailyBar({ answered }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={18} className={answered > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
          <span className="font-bold text-sm">Ofensiva de Hoje</span>
        </div>
        <span className="font-mono font-bold text-primary text-sm">{answered}/{MAX_QUESTIONS}</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
          <div key={i} className={`flex-1 h-3 rounded-full transition-all ${i < answered ? 'bg-orange-400' : 'bg-secondary'}`} />
        ))}
      </div>
      {answered >= MAX_QUESTIONS ? (
        <p className="text-xs text-orange-600 font-bold flex items-center gap-1.5">
          🔥 Ofensiva do dia completa! +{(answered * POINTS_PER_QUESTION).toFixed(1)} pts ganhos. Volte amanhã!
        </p>
      ) : answered > 0 ? (
        <p className="text-xs text-muted-foreground">
          {MAX_QUESTIONS - answered} pergunta{MAX_QUESTIONS - answered !== 1 ? 's' : ''} restante{MAX_QUESTIONS - answered !== 1 ? 's' : ''} ·
          +{((MAX_QUESTIONS - answered) * POINTS_PER_QUESTION).toFixed(1)} pts disponíveis
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Responda {MAX_QUESTIONS} perguntas hoje e ganhe +{(MAX_QUESTIONS * POINTS_PER_QUESTION).toFixed(1)} pts!</p>
      )}
    </div>
  );
}

// Card de pergunta individual
function QuestionCard({ question, idx, answered, answerValue, onChangeAnswer, onSubmit, isPending }) {
  const [expanded, setExpanded] = useState(!answered);

  return (
    <div className={`bg-card rounded-2xl border overflow-hidden transition-all ${answered ? 'border-green-200' : 'border-border hover:shadow-md'}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 ${
          answered ? 'bg-green-500 border-green-400 text-white' : 'bg-secondary border-border text-foreground'
        }`}>
          {answered ? <CheckCircle size={17} /> : idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-snug">{question.text}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {answered
              ? <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 py-0 px-1.5">✓ Respondida · +{POINTS_PER_QUESTION} pts</Badge>
              : <span className="text-[10px] text-yellow-600 font-semibold flex items-center gap-0.5"><Star size={9} className="fill-yellow-500" /> +{POINTS_PER_QUESTION} pts ao responder</span>
            }
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 bg-secondary/10">
          {question.hint && (
            <p className="text-xs text-muted-foreground italic">💡 {question.hint}</p>
          )}
          {answered ? (
            <div className="bg-green-50/10 border border-green-200/30 rounded-xl p-3">
              <p className="text-xs font-bold text-green-600 mb-1 flex items-center gap-1"><CheckCircle size={11} /> Sua resposta foi registrada!</p>
              {answerValue && <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{answerValue}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Escreva sua resposta aqui... Não precisa ser perfeita, o que importa é refletir!"
                value={answerValue || ''}
                onChange={e => onChangeAnswer(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button
                size="sm"
                className="w-full gap-1.5"
                disabled={!answerValue?.trim() || isPending}
                onClick={onSubmit}
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Registrar Resposta · +{POINTS_PER_QUESTION} pts
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
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
        prompt: `Você é um professor de psicologia/comportamento humano. Gere exatamente 5 perguntas de reflexão rápida para alunos de um curso online.

Tema da aula de referência: "${topic}"
${lessonDesc ? `Descrição da aula: "${lessonDesc}"` : ''}

Regras:
- Linguagem simples e acessível (não acadêmica)
- Perguntas abertas para reflexão pessoal ou observação do cotidiano
- Curtas: máximo 2 linhas por pergunta
- Cada pergunta deve ter uma dica curta (hint) de como pensar sobre ela
- Não repita temas entre as 5 perguntas

Retorne em JSON com este formato exato:
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
      toast.success('🔥 Nova ofensiva gerada com sucesso!');
      onGenerated();
    } catch (err) {
      toast.error('Erro ao gerar: ' + (err.message || 'tente novamente'));
    } finally {
      setGenerating(false);
    }
  };

  const courseLessons = lessons.filter(l => l.course === course);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-foreground mb-1">Aula de referência (opcional)</p>
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
        <p className="text-xs font-bold text-foreground mb-1">Ou descreva o tema (livre)</p>
        <Textarea
          placeholder="Ex: emoções e comportamento, relacionamentos, autoconhecimento..."
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
        {generating ? <><Loader2 size={14} className="animate-spin" /> Gerando perguntas com IA...</> : <><Zap size={14} /> Gerar 5 Perguntas com IA</>}
      </Button>
    </div>
  );
}

export default function Ofensivas() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const userCourse = session?.course || 'tcc';

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewingDate, setViewingDate] = useState(today);

  // Buscar desafio do dia
  const { data: challenges = [], isLoading: loadingChallenge } = useQuery({
    queryKey: ['daily-challenge', userCourse, today],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse, date: today }, '-created_date', 5),
    staleTime: 60000,
  });

  const challenge = challenges[0] || null;

  // Buscar minha resposta de hoje
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

  // Admin: histórico de desafios
  const { data: allChallenges = [] } = useQuery({
    queryKey: ['all-challenges', userCourse],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse }, '-created_date', 30),
    enabled: isTeacher,
  });

  // Admin: respostas do dia
  const { data: allResponses = [] } = useQuery({
    queryKey: ['all-responses-today', challenge?.id],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ challenge_id: challenge.id }, '-created_date', 200),
    enabled: isTeacher && !!challenge?.id,
  });

  // Aulas para referência
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons-ref', userCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 100),
    enabled: isTeacher,
  });

  // Submeter uma resposta
  const handleSubmitAnswer = async (question) => {
    const answer = answers[question.id]?.trim();
    if (!answer) return;

    setSubmitting(prev => ({ ...prev, [question.id]: true }));
    try {
      const newAnswer = { question_id: question.id, answer };
      const currentAnswers = myResponseRecord?.answers || [];
      const updatedAnswers = [...currentAnswers.filter(a => a.question_id !== question.id), newAnswer];
      const newCount = updatedAnswers.length;
      const newPoints = newCount * POINTS_PER_QUESTION;

      if (myResponseRecord) {
        await base44.entities.DailyChallengeResponse.update(myResponseRecord.id, {
          answers: updatedAnswers,
          questions_answered: newCount,
          points_earned: newPoints,
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
          points_earned: newPoints,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['daily-response'] });
      toast.success(`🔥 +${POINTS_PER_QUESTION} pts registrados!`);
    } catch (err) {
      toast.error('Erro ao registrar: ' + (err.message || 'tente novamente'));
    } finally {
      setSubmitting(prev => ({ ...prev, [question.id]: false }));
    }
  };

  if (loadingChallenge) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-5 max-w-[820px] mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame size={22} className="text-orange-500" /> Ofensivas Diárias
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5 capitalize">{todayLabel}</p>
        </div>

        {isTeacher && (
          <Button
            onClick={() => setShowGenerate(true)}
            className="gap-2 h-9 text-sm shrink-0 bg-orange-500 hover:bg-orange-600"
          >
            <Zap size={15} /> Atualizar Ofensiva
          </Button>
        )}
      </div>

      {/* Barra de progresso — alunos */}
      {!isTeacher && challenge && <DailyBar answered={answeredCount} />}

      {/* SEM DESAFIO */}
      {!challenge && (
        <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-2xl">
          <Flame size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-bold">Nenhuma ofensiva para hoje</p>
          <p className="text-sm mt-1 text-muted-foreground/70">
            {isTeacher ? 'Clique em "Atualizar Ofensiva" para gerar as perguntas do dia.' : 'O professor ainda não liberou a ofensiva de hoje. Volte mais tarde!'}
          </p>
        </div>
      )}

      {/* DESAFIO DO DIA — alunos */}
      {!isTeacher && challenge && (
        <div className="space-y-3">
          {challenge.lesson_ref && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-600 font-semibold mb-4">
              <BookOpen size={13} /> Tema: {challenge.lesson_ref}
            </div>
          )}

          {answeredCount >= MAX_QUESTIONS && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5 text-center mb-4">
              <Trophy size={30} className="mx-auto mb-2 text-yellow-500" />
              <p className="font-black text-base text-foreground">Ofensiva completa! 🔥</p>
              <p className="text-sm text-muted-foreground mt-1">Você ganhou +{(MAX_QUESTIONS * POINTS_PER_QUESTION).toFixed(1)} pts hoje. Volte amanhã!</p>
            </div>
          )}

          {(challenge.questions || []).map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              idx={idx}
              answered={!!answeredMap[q.id]}
              answerValue={answeredMap[q.id] || answers[q.id] || ''}
              onChangeAnswer={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
              onSubmit={() => handleSubmitAnswer(q)}
              isPending={!!submitting[q.id]}
            />
          ))}
        </div>
      )}

      {/* VISÃO PROFESSOR */}
      {isTeacher && challenge && (
        <div className="space-y-4">
          {/* Info do desafio ativo */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span className="font-bold text-sm">Ofensiva Ativa — {today}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={12} />
                <span>{allResponses.length} aluno{allResponses.length !== 1 ? 's' : ''} responderam</span>
              </div>
            </div>
            {challenge.lesson_ref && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BookOpen size={11} /> Tema: <span className="font-semibold text-foreground">{challenge.lesson_ref}</span>
              </p>
            )}
            <div className="mt-3 space-y-2">
              {(challenge.questions || []).map((q, i) => (
                <div key={q.id} className="flex items-start gap-2 text-xs">
                  <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                  <span className="text-foreground">{q.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Respostas dos alunos */}
          {allResponses.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Users size={14} /> Participações de Hoje</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {allResponses.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 bg-secondary/40 rounded-xl text-xs">
                    <span className="font-semibold text-foreground truncate">{r.student_name || r.student_email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">{r.questions_answered || 0}/{MAX_QUESTIONS}</span>
                      <span className="text-yellow-600 font-bold flex items-center gap-0.5">
                        <Star size={9} className="fill-yellow-500" /> +{((r.points_earned || 0)).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de desafios */}
          {allChallenges.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-3">Histórico de Ofensivas</h3>
              <div className="space-y-1.5">
                {allChallenges.map(c => (
                  <div key={c.id} className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${c.date === today ? 'bg-orange-50/10 border border-orange-200/30' : 'bg-secondary/30'}`}>
                    <span className="font-semibold">{c.date}</span>
                    <span className="text-muted-foreground truncate max-w-[200px]">{c.lesson_ref || '—'}</span>
                    <Badge variant="outline" className="text-[9px]">{(c.questions || []).length} perguntas</Badge>
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
          <div className="text-xs text-muted-foreground mb-3">
            Selecione uma aula ou descreva o tema. A IA vai gerar 5 perguntas de reflexão rápida para os alunos responderem hoje.
          </div>
          <GenerateChallengePanel
            lessons={lessons}
            course={userCourse}
            onGenerated={() => setShowGenerate(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}