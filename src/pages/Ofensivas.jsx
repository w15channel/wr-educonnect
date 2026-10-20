import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { base44 } from '@/api/base44Client';
import {
  Flame, CheckCircle, Star, Zap, BookOpen, Loader2, Users, Calendar, Lock, Send, ClipboardList
} from 'lucide-react';
import GameModal from '@/components/ofensivas/GameModal';
import OwlGuide from '@/components/ofensivas/OwlGuide';
import TreasureChest from '@/components/ofensivas/TreasureChest';
import NextStepLink from '@/components/shared/NextStepLink';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MOD1 } from '@/lib/apostila/mod1';
import { MOD2 } from '@/lib/apostila/mod2';
import { MOD3 } from '@/lib/apostila/mod3';
import { MOD4 } from '@/lib/apostila/mod4';
import { MOD5 } from '@/lib/apostila/mod5';
import { MOD6 } from '@/lib/apostila/mod6';
import { MOD7 } from '@/lib/apostila/mod7';
import { MOD8 } from '@/lib/apostila/mod8';
import { MOD9 } from '@/lib/apostila/mod9';
import { MOD10 } from '@/lib/apostila/mod10';

// ─── Schema: 8 perguntas ──────────────────────────────────────────────────────
// q1(0.1) q2(0.1) q3-baú(0.2) q4(0.1) q5(0.1) q6-baú(0.2) q7(0.1) q8(0.1) = 1.0
const QUESTION_SCHEMA = [
  { id: 'q1', type: 'normal', points: 0.1, game: 'memory' },
  { id: 'q2', type: 'normal', points: 0.1 },
  { id: 'q3', type: 'chest',  points: 0.2 },
  { id: 'q4', type: 'normal', points: 0.1 },
  { id: 'q5', type: 'normal', points: 0.1, game: 'colors' },
  { id: 'q6', type: 'chest',  points: 0.2 },
  { id: 'q7', type: 'normal', points: 0.1 },
  { id: 'q8', type: 'normal', points: 0.1 },
];
const TOTAL_POINTS = 1.0;

// Zigzag X offsets for 8 nodes (px)
const TRAIL_X = [0, 70, 0, -70, 0, 70, 0, -70];

// Streak bonuses
const STREAK_BONUSES = [
  { days: 5,  bonus: 5,  label: '5 dias',  emoji: '🔥' },
  { days: 10, bonus: 15, label: '10 dias', emoji: '💎' },
  { days: 20, bonus: 30, label: '20 dias', emoji: '👑' },
];

const APOSTILA_MODULES = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10].map(mod => ({
  id: mod.id,
  title: mod.title,
  lessons: mod.lessons.map(lesson => ({ id: lesson.id, title: lesson.title })),
}));

const DURATION_OPTIONS = [
  { value: 1, label: '1 dia' },
  { value: 3, label: '3 dias' },
  { value: 5, label: '5 dias' },
  { value: 7, label: '7 dias' },
];

// ─── Fireworks ─────────────────────────────────────────────────────────────────
function Fireworks({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'];

    function burst(x, y) {
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 4,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.008,
        });
      }
    }

    const cx = canvas.width / 2, cy = canvas.height / 2;
    burst(cx, cy - 80);
    setTimeout(() => burst(cx - 100, cy - 140), 200);
    setTimeout(() => burst(cx + 100, cy - 140), 400);
    setTimeout(() => burst(cx - 60, cy - 60), 600);
    setTimeout(() => burst(cx + 60, cy - 60), 800);

    let raf;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (particles.length > 0) raf = requestAnimationFrame(animate);
      else setTimeout(onDone, 400);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" style={{ width: '100vw', height: '100vh' }} />;
}

// ─── Trail Node ────────────────────────────────────────────────────────────────
function TrailNode({ question, idx, answered, locked, isChest, onPress, points, game }) {
  const offsetX = TRAIL_X[idx] ?? 0;

  if (isChest) {
    return (
      <button
        onClick={() => !locked && onPress()}
        disabled={locked}
        style={{ marginLeft: offsetX }}
        className={`relative flex flex-col items-center transition-transform active:scale-95 ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}`}
      >
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl border-4 transition-all ${
          answered ? 'bg-yellow-400/20 border-yellow-300 shadow-yellow-400/40'
          : locked ? 'bg-secondary border-border'
          : 'bg-amber-500/15 border-amber-400 shadow-amber-400/50'
        }`}>
          <TreasureChest state={answered ? 'done' : locked ? 'locked' : 'open'} />
        </div>
        {!locked && !answered && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-amber-300 shadow-lg">+{points}</div>
        )}
        {answered && <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-green-300">✓</div>}
        <span className={`mt-1.5 text-[11px] font-bold ${answered ? 'text-green-400' : locked ? 'text-muted-foreground' : 'text-amber-400'}`}>Baú do Saber</span>
        <span className="text-[10px] text-muted-foreground/60">+{points} pts</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => !locked && onPress()}
      disabled={locked}
      style={{ marginLeft: offsetX }}
      className={`relative flex flex-col items-center transition-transform active:scale-95 ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all ${
        answered ? 'bg-green-500 border-green-400 shadow-green-400/40 ofensiva-node-done'
        : locked ? 'bg-secondary border-border'
        : 'bg-primary border-primary/70 shadow-primary/30 ofensiva-node-ready'
      }`}>
        {answered ? <CheckCircle size={24} className="text-white" />
         : locked ? <Lock size={18} className="text-muted-foreground" />
         : <Flame size={22} className="text-white" />}
      </div>
      {!locked && !answered && (
        <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-primary/50 shadow">+{points}</div>
      )}
      {answered && <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">✓</div>}
      <span className={`mt-1 text-[10px] font-bold ${answered ? 'text-green-400' : locked ? 'text-muted-foreground' : 'text-foreground/60'}`}>
      {answered ? 'Feita' : locked ? 'Bloqueada' : game === 'memory' ? '🧠 Memória' : game === 'colors' ? '🎨 Cores' : `Nº ${idx + 1}`}
      </span>
      <span className="text-[10px] text-muted-foreground/50">+{points}</span>
    </button>
  );
}

function Connector({ answered }) {
  return (
    <div className="flex justify-center my-0.5">
      <div className={`w-1 h-7 rounded-full transition-colors ${answered ? 'bg-green-400' : 'bg-border'}`} />
    </div>
  );
}

// ─── Question Modal ────────────────────────────────────────────────────────────
function QuestionModal({ question, idx, isChest, points, answered, savedAnswer, open, onClose, onSubmit, isPending }) {
  const [answer, setAnswer] = useState('');
  useEffect(() => { if (open) setAnswer(''); }, [open]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isChest ? <span className="text-xl">🗝️</span> : <Flame size={16} className="text-orange-500" />}
            {isChest ? 'Baú do Saber' : `Pergunta ${idx + 1}`}
            <span className="ml-auto text-xs font-bold text-yellow-500 flex items-center gap-0.5">
              <Star size={11} className="fill-yellow-400" /> +{points} pts
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          {isChest && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-500 font-semibold flex items-center gap-1.5">
              🗝️ Pergunta desafio! Reflita com cuidado — vale mais pontos.
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
              <div className="flex items-start gap-2">
                <Textarea
                  placeholder="Escreva sua reflexão aqui... Não precisa ser perfeita!"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={4}
                  className="text-sm"
                  autoFocus
                />
                <VoiceDictationButton value={answer} onChange={setAnswer} className="mt-1" />
              </div>
              <Button className="w-full gap-2" disabled={!answer.trim() || isPending} onClick={() => onSubmit(answer)}>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Registrar · +{points} pts
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Streak Badge ──────────────────────────────────────────────────────────────
function StreakBadge({ streak }) {
  const nextBonus = STREAK_BONUSES.find(b => b.days > streak);
  return (
    <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3">
      <div className="flex flex-col items-center shrink-0">
        <span className="text-2xl">🔥</span>
        <span className="text-[10px] font-bold text-orange-500 mt-0.5">{streak}d</span>
      </div>
      <div className="flex-1 min-w-0">
        {nextBonus ? (
          <p className="text-xs text-muted-foreground">
            Mais {nextBonus.days - streak} dia{nextBonus.days - streak !== 1 ? 's' : ''} para ganhar
            <span className="font-bold text-yellow-500"> +{nextBonus.bonus} pts {nextBonus.emoji}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Sequência máxima desbloqueada! 👑</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Ofensivas() {
  const ctx = useOutletContext() || {};
  const { session: authSession } = useCustomAuth();
  const session = ctx.user || authSession;
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const userCourse = session?.course || ctx.course || 'tcc';

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const [submitting, setSubmitting] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [bonusEarned, setBonusEarned] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(APOSTILA_MODULES[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState(APOSTILA_MODULES[0].lessons[0].id);
  const [durationDays, setDurationDays] = useState(1);

  const selectedModule = APOSTILA_MODULES.find(module => module.id === selectedModuleId) || APOSTILA_MODULES[0];
  const selectedLesson = selectedModule.lessons.find(lesson => lesson.id === selectedLessonId) || selectedModule.lessons[0];

  useEffect(() => {
    if (!selectedModule.lessons.some(lesson => lesson.id === selectedLessonId)) {
      setSelectedLessonId(selectedModule.lessons[0].id);
    }
  }, [selectedModuleId, selectedLessonId, selectedModule.lessons]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['daily-challenge', userCourse, today],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse, date: today }, '-created_date', 30),
    staleTime: 60000,
  });
  const { data: myModuleUnlocks = [] } = useQuery({
    queryKey: ['ofensiva-module-unlocks', session?.email],
    queryFn: () => base44.entities.StudentModuleUnlock.filter({ student_email: session?.email || '' }, '-unlocked_at', 20),
    enabled: !isTeacher && !!session?.email,
  });
  const currentModuleNumber = myModuleUnlocks.reduce((highest, item) => Math.max(highest, Number(item.module_number) || 1), 1);
  const challenge = isTeacher ? (challenges[0] || null) : (challenges.find((item) => Number(item.module_number || 1) === currentModuleNumber) || null);

  const { data: myResponse } = useQuery({
    queryKey: ['daily-response', challenge?.id, session?.email],
    queryFn: () => base44.entities.DailyChallengeResponse.filter(
      { challenge_id: challenge.id, student_email: session?.email || '' },
      '-created_date', 1
    ),
    enabled: !!challenge?.id && !!session?.email,
  });

  const { data: recentResponses = [] } = useQuery({
    queryKey: ['all-my-responses', session?.email, userCourse],
    queryFn: () => base44.entities.DailyChallengeResponse.filter(
      { student_email: session?.email || '', course: userCourse },
      '-created_date', 60
    ),
    enabled: !!session?.email && !isTeacher,
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ['all-responses-today', challenge?.id],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ challenge_id: challenge.id }, '-created_date', 200),
    enabled: isTeacher && !!challenge?.id,
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['all-challenges', userCourse],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse }, '-created_date', 30),
    enabled: isTeacher,
  });

  const myResponseRecord = myResponse?.[0] || null;
  const answeredMap = {};
  (myResponseRecord?.answers || []).forEach(a => { answeredMap[a.question_id] = a.answer; });
  const answeredCount = Object.keys(answeredMap).length;
  const isComplete = answeredCount >= 8;

  // ── Streak ───────────────────────────────────────────────────────────────
  const streak = useMemo(() => {
    const completedDates = new Set(
      recentResponses.filter(r => (r.questions_answered || 0) >= 8).map(r => r.date)
    );
    let count = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (completedDates.has(dateStr)) {
        count++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else break;
    }
    return count;
  }, [recentResponses]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmitAnswer = async (questionId, answer) => {
    if (!answer?.trim() || !challenge) return;
    setSubmitting(prev => ({ ...prev, [questionId]: true }));
    try {
      const currentAnswers = myResponseRecord?.answers || [];
      const updatedAnswers = [...currentAnswers.filter(a => a.question_id !== questionId), { question_id: questionId, answer }];
      const newCount = updatedAnswers.length;

      const questions = challenge?.questions || [];
      let pts = 0;
      updatedAnswers.forEach(a => {
        const qIdx = questions.findIndex(q => q.id === a.question_id);
        if (qIdx >= 0) pts += QUESTION_SCHEMA[qIdx]?.points ?? questions[qIdx]?.points ?? 0.1;
      });
      pts = Math.round(pts * 1000) / 1000;

      const saved = myResponseRecord
        ? await base44.entities.DailyChallengeResponse.update(myResponseRecord.id, { answers: updatedAnswers, questions_answered: newCount, points_earned: pts })
        : await base44.entities.DailyChallengeResponse.create({
          challenge_id: challenge.id, date: today, course: userCourse,
          student_email: session?.email || '', student_name: session?.name || session?.full_name || '',
          answers: updatedAnswers, questions_answered: newCount, points_earned: pts,
        });
      // Credita a pontuação diretamente, sem automação.
      base44.functions.invoke('saveStudentRecord', { action: 'creditOfensiva', response_id: saved?.id || myResponseRecord?.id }).catch(() => null);

      await queryClient.invalidateQueries({ queryKey: ['daily-response'] });
      await queryClient.invalidateQueries({ queryKey: ['all-my-responses'] });

      const qIdx = questions.findIndex(q => q.id === questionId);
      const pointsEarned = QUESTION_SCHEMA[qIdx]?.points ?? 0.1;
      toast.success(`🔥 +${pointsEarned} pts!`);
      setActiveQuestion(null);

      if (newCount >= 8) {
        setJustCompleted(true);
        setShowFireworks(true);
        const newStreak = streak + 1;
        const bonus = STREAK_BONUSES.slice().reverse().find(b => newStreak === b.days);
        if (bonus) { setBonusEarned(bonus); toast.success(`${bonus.emoji} Bônus de sequência: +${bonus.bonus} pts!`); }
      }
    } catch (err) {
      toast.error('Erro: ' + (err.message || 'tente novamente'));
    } finally {
      setSubmitting(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // ── Admin generate ────────────────────────────────────────────────────────
  const handleGenerate = async (force = false) => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('createDailyChallenge', {
        course: userCourse,
        force,
        module_id: selectedModuleId,
        lesson_id: selectedLesson?.id,
        duration_days: durationDays,
      });
      await queryClient.invalidateQueries({ queryKey: ['daily-challenge'] });
      const payload = result?.data || result || {};
      const created = payload.created || 0;
      const updated = payload.updated || 0;
      const skipped = payload.skipped || 0;
      const themeLabel = payload.theme ? ` · ${payload.theme}` : '';
      toast.success(`🔥 Ofensiva gerada${themeLabel}: ${created} criada(s), ${updated} atualizada(s), ${skipped} mantida(s).`);
    } catch (err) {
      toast.error('Erro: ' + (err?.response?.data?.error || err.message || 'tente novamente'));
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  }

  const questions = challenge?.questions || [];
  const generationControls = (
    <div className="grid gap-3 text-left">
      <label className="grid gap-1.5">
        <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">1. Módulo</span>
        <select
          value={selectedModuleId}
          onChange={e => setSelectedModuleId(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-orange-400"
        >
          {APOSTILA_MODULES.map(module => (
            <option key={module.id} value={module.id}>{module.title}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">2. Tema</span>
        <select
          value={selectedLesson?.id || ''}
          onChange={e => setSelectedLessonId(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-orange-400"
        >
          {selectedModule.lessons.map(lesson => (
            <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">3. Duração</span>
        <select
          value={durationDays}
          onChange={e => setDurationDays(Number(e.target.value))}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-orange-400"
        >
          {DURATION_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-muted-foreground">
        O gerador analisa o conteúdo da aula/módulo selecionado e cria 8 perguntas exclusivas do tema (fáceis: 1, 2, 4, 5, 7 e 8; medianas/baú: 3 e 6), sem consumo de créditos de IA. A duração cria uma ofensiva por dia a partir de hoje, variando as perguntas para não repetir.
      </p>
    </div>
  );

  return (
    <div className="app-page max-w-[560px] mx-auto animate-fade-in-up">
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame size={22} className="text-orange-500" /> Ofensivas Diárias
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5 capitalize">{todayLabel}</p>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <Button onClick={() => handleGenerate(false)} disabled={generating} size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white shrink-0">
              {generating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              {challenge ? 'Gerar período' : 'Gerar'}
            </Button>
            {challenge && (
              <Button onClick={() => handleGenerate(true)} disabled={generating} size="sm" variant="outline" className="shrink-0">
                Regenerar período
              </Button>
            )}
          </div>
        )}
      </div>

      {/* No challenge */}
      {!challenge && (
        <div className="text-center py-12 px-4 text-muted-foreground bg-card border border-border rounded-2xl">
          <Flame size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-bold">Nenhuma ofensiva para hoje</p>
          {isTeacher ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground/70">Escolha o módulo, o tema e a duração. Ao gerar, o algoritmo compreende o conteúdo da aula e cria perguntas exclusivas do tema para cada dia do período.</p>
              {generationControls}
            </div>
          ) : (
            <p className="text-sm mt-1 text-muted-foreground/70">A ofensiva será gerada automaticamente. Volte mais tarde!</p>
          )}
        </div>
      )}

      {/* ── STUDENT VIEW ── */}
      {!isTeacher && challenge && (
        <div>
          {streak > 0 && <div className="mb-4"><StreakBadge streak={streak} /></div>}

          {/* Streak milestone chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {STREAK_BONUSES.map(b => (
              <div key={b.days} className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-center transition-all ${streak >= b.days ? 'bg-yellow-500/15 border-yellow-400/30' : 'bg-card border-border opacity-50'}`}>
                <span className="text-lg">{b.emoji}</span>
                <span className="text-[10px] font-bold text-foreground">{b.label}</span>
                <span className="text-[10px] text-yellow-500 font-bold">+{b.bonus} pts</span>
                {streak >= b.days && <span className="text-[9px] text-green-500">Ganho ✓</span>}
              </div>
            ))}
          </div>

          {/* Topic */}
          {challenge.lesson_ref && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-500 font-semibold mb-4">
              <BookOpen size={13} /> {challenge.lesson_ref}
            </div>
          )}

          {/* Complete banner */}
          {isComplete && (
            <div className="bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border border-yellow-400/30 rounded-2xl p-5 text-center mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-black text-xl text-foreground">{justCompleted ? 'Parabéns! Ofensiva Completa! 🔥' : 'Ofensiva do Dia Concluída! ✅'}</p>
              <p className="text-sm text-muted-foreground mt-1">+{TOTAL_POINTS.toFixed(1)} pts ganhos · Sequência: <span className="font-bold text-orange-500">{streak} dia{streak !== 1 ? 's' : ''} 🔥</span></p>
              {bonusEarned && (
                <div className="mt-3 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-4 py-2 inline-block">
                  <p className="font-black text-yellow-500 text-sm">{bonusEarned.emoji} Bônus: +{bonusEarned.bonus} pts!</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">Volte amanhã para manter sua sequência!</p>
              <div className="mt-4 text-left">
                <NextStepLink
                  to="/tasks"
                  icon={ClipboardList}
                  title="Agora vá para as Tarefas"
                  description="Você acabou de revisar o conteúdo na ofensiva — aproveite o embalo e entregue a tarefa do módulo agora."
                />
              </div>
            </div>
          )}

          {/* Progress dots */}
          {!isComplete && (
            <div className="flex items-center justify-center gap-1.5 mb-5 flex-wrap">
              {QUESTION_SCHEMA.map((s, i) => {
                const q = questions[i];
                const isAnswered = q && !!answeredMap[q?.id];
                return (
                  <div key={i} className={`flex flex-col items-center gap-0.5 ${s.type === 'chest' ? 'mx-1' : ''}`}>
                    <div className={`rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-all ${s.type === 'chest' ? 'w-9 h-9 rounded-xl' : 'w-7 h-7'} ${isAnswered ? 'bg-green-500 border-green-400 text-white' : 'bg-secondary border-border text-muted-foreground'}`}>
                      {isAnswered ? '✓' : s.type === 'chest' ? '🗝️' : i + 1}
                    </div>
                    <span className={`text-[9px] font-bold ${s.type === 'chest' ? 'text-amber-400' : 'text-muted-foreground/60'}`}>{s.points}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trail */}
          <div className="relative flex flex-col items-center py-4 select-none" style={{ minHeight: 680 }}>
            <OwlGuide
              name={session?.name || session?.full_name || 'aluno'}
              status={isComplete
                ? null
                : answeredCount === 0
                  ? 'Toque no primeiro desafio! 🔥'
                  : `${8 - answeredCount} desafio${8 - answeredCount !== 1 ? 's' : ''} restante${8 - answeredCount !== 1 ? 's' : ''}`}
            />

            {questions.slice(0, 8).map((q, idx) => {
              const isAnswered = !!answeredMap[q.id];
              const isLocked = idx > 0 && !answeredMap[questions[idx - 1]?.id];
              const schema = QUESTION_SCHEMA[idx];

              return (
                <React.Fragment key={q.id}>
                  <TrailNode
                    question={q}
                    idx={idx}
                    answered={isAnswered}
                    locked={isLocked}
                    isChest={schema?.type === 'chest'}
                    points={schema?.points ?? q.points ?? 0.1}
                    game={schema?.game}
                    onPress={() => setActiveQuestion(idx)}
                  />
                  {idx < Math.min(questions.length, 8) - 1 && <Connector answered={isAnswered} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Question / game modal */}
          {activeQuestion !== null && questions[activeQuestion] && QUESTION_SCHEMA[activeQuestion]?.game && (
            <GameModal
              gameType={QUESTION_SCHEMA[activeQuestion].game}
              idx={activeQuestion}
              points={QUESTION_SCHEMA[activeQuestion]?.points ?? 0.1}
              answered={!!answeredMap[questions[activeQuestion]?.id]}
              open={activeQuestion !== null}
              onClose={() => setActiveQuestion(null)}
              onComplete={(result) => handleSubmitAnswer(questions[activeQuestion].id, result)}
              isPending={!!submitting[questions[activeQuestion]?.id]}
            />
          )}
          {activeQuestion !== null && questions[activeQuestion] && !QUESTION_SCHEMA[activeQuestion]?.game && (
            <QuestionModal
              question={questions[activeQuestion]}
              idx={activeQuestion}
              isChest={QUESTION_SCHEMA[activeQuestion]?.type === 'chest'}
              points={QUESTION_SCHEMA[activeQuestion]?.points ?? questions[activeQuestion]?.points ?? 0.1}
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

      {/* ── TEACHER VIEW ── */}
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
                <span>{allResponses.length} participante{allResponses.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {challenge.lesson_ref && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                <BookOpen size={11} /> <span className="font-semibold text-foreground">{challenge.lesson_ref}</span>
              </p>
            )}
            <div className="space-y-2">
              {(challenge.questions || []).map((q, i) => {
                const schema = QUESTION_SCHEMA[i];
                const isChest = schema?.type === 'chest';
                return (
                  <div key={q.id} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${isChest ? 'bg-amber-500/10 border border-amber-400/20' : 'bg-secondary/30'}`}>
                    <span className={`font-black shrink-0 ${isChest ? 'text-amber-400' : 'text-primary'}`}>{isChest ? '🗝️' : `${i + 1}.`}</span>
                    <div className="flex-1">
                      <span className="text-foreground">{q.text}</span>
                      <span className={`ml-1 font-bold text-[10px] ${isChest ? 'text-amber-400' : 'text-muted-foreground'}`}>(+{schema?.points ?? 0.1}pts)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-bold text-sm mb-2">Próxima geração</h3>
            <p className="text-xs text-muted-foreground mb-3">Selecione módulo, tema e duração. O botão "Gerar período" mantém dias já existentes; "Regenerar período" substitui as ofensivas do período.</p>
            {generationControls}
          </div>

          {allResponses.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Users size={14} /> Participações</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allResponses.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 bg-secondary/40 rounded-xl text-xs">
                    <span className="font-semibold text-foreground truncate">{r.student_name || r.student_email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">{r.questions_answered || 0}/8</span>
                      <span className="text-yellow-500 font-bold flex items-center gap-0.5">
                        <Star size={9} className="fill-yellow-400" /> +{(r.points_earned || 0).toFixed(2)}
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
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allChallenges.map(c => (
                  <div key={c.id} className={`flex items-center justify-between p-2 rounded-xl text-xs ${c.date === today ? 'bg-orange-500/10 border border-orange-400/20' : 'bg-secondary/30'}`}>
                    <span className="font-semibold">{c.date}</span>
                    <span className="font-bold text-primary shrink-0">Módulo {c.module_number || (String(c.lesson_id || '').match(/\d+/)?.[0] ?? '—')}</span>
                    <span className="text-muted-foreground truncate max-w-[140px]">{c.lesson_ref || '—'}</span>
                    <span className="text-muted-foreground shrink-0">{(c.questions || []).length}q</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}