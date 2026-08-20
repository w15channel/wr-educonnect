/**
 * DashboardMobile — Dashboard exclusiva para mobile.
 * Otimizada para Moto G53 (720x1600, Android 13+).
 *
 * Layout:
 * - Cards em grid 2 colunas, sem scroll horizontal
 * - Live banner com tap de tela cheia
 * - Ranking compacto em lista
 * - Pendências em acordeão (evita scroll excessivo)
 * - Não tem painel de ranking administrativo (usa ScoreControl)
 */
import React, { useState } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  FileText, Users, Trophy, Star, Bell, BookOpen,
  ArrowRight, ClipboardList, GraduationCap,
  Heart, ChevronDown, ChevronUp, TrendingUp, RefreshCw
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { capScore, formatScore } from '@/lib/scoreUtils';
import { getAvatarPrefixedName, getInitials, resolveAvatarEmoji } from '@/lib/avatarUtils';
import { toast } from 'sonner';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';

function getScopedPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return '';
}

const extractSeq = (item = {}) => {
  const n = Number(item.order ?? item.sequence ?? item.lesson_number);
  if (Number.isFinite(n) && n > 0) return n;
  const m = (item.title || '').match(/(?:aula|tarefa)\s*(\d+)/i);
  return m ? Number(m[1]) : null;
};
const sortBySeq = (arr = []) => [...arr].sort((a, b) => {
  const an = extractSeq(a), bn = extractSeq(b);
  if (an !== null && bn !== null) return an - bn;
  if (an !== null) return -1;
  if (bn !== null) return 1;
  return 0;
});

const getUnlockedLessonCount = (rules = []) => {
  const lessonUnlockRule = rules.find((r) => r.scope === 'lessons');
  return Math.max(10, Number(lessonUnlockRule?.unlock_until || 10));
};

const isTaskAvailable = (task, moduleUnlocked = []) =>
  !task.module_number || moduleUnlocked[Number(task.module_number) - 1];

export default function DashboardMobile() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const prefix = getScopedPrefix(location.pathname);
  const scoped = (p) => prefix + p;
  const isTeacher = session?.role === 'admin';
  const userCourse = session?.course;
  const [pendingOpen, setPendingOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = (session?.name || 'Usuário').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', userCourse],
    queryFn: () => userCourse
      ? base44.entities.Task.filter({ course: userCourse }, '-created_date', 200)
      : base44.entities.Task.list('-created_date', 200),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.TaskSubmission.filter(
      isTeacher ? {} : { student_email: session?.email || '' },
      '-created_date',
      isTeacher ? 1000 : 50
    ),
    enabled: !!session,
  });

  const { data: allScoreItems = [] } = useQuery({
    queryKey: ['all-score-items-rank'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const { data: publishedScores = [] } = useQuery({
    queryKey: ['student-profiles-score-overview'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 10000),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 2000),
  });

  const { data: unlockRules = [] } = useQuery({
    queryKey: ['unlock-rules-lessons', userCourse],
    queryFn: () => userCourse
      ? base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20)
      : base44.entities.Announcement.filter({ type: 'unlock_rule' }, '-updated_date', 20),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', userCourse],
    queryFn: () => userCourse
      ? base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 200)
      : base44.entities.RecordedLesson.list('order', 200),
  });

  const { data: progresses = [] } = useQuery({
    queryKey: ['lesson-progress', session?.email],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: session?.email }, '-created_date', 200),
    enabled: !isTeacher && !!session?.email,
  });

  const { moduleUnlocked } = useApostilaModuleUnlocks(userCourse, session);

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 5),
  });

  const { data: therapistPairings = [] } = useQuery({
    queryKey: ['therapist-pairings-dashboard'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 300),
    enabled: !isTeacher,
  });

  const visibleTasks = isTeacher ? tasks : tasks.filter((task) => !task.is_hidden);
  const visibleLessons = isTeacher ? lessons : lessons.filter((lesson) => !lesson.is_hidden);

  const pendingTasks = isTeacher
    ? submissions.filter(s => s.status === 'submitted' && !allScoreItems.find(si => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length
    : visibleTasks.filter(t => isTaskAvailable(t, moduleUnlocked) && !submissions.find(s => s.task_id === t.id)).length;

  const studentCount = accessCodes.filter(c => {
    if (!c.is_active) return false;
    if (!userCourse) return true;
    return c.course === userCourse || (userCourse === 'tcc' && !c.course);
  }).length;

  const publishedScoreMap = {};
  publishedScores.forEach(p => {
    if (!p.student_email) return;
    if (typeof p.points === 'number' && publishedScoreMap[p.student_email] === undefined) {
      publishedScoreMap[p.student_email] = p.points;
    }
  });

  const currentAccessCode = accessCodes.find(c => c.student_email === session?.email);
  const totalPoints = capScore(currentAccessCode?.pontuacao_total ?? publishedScoreMap[session?.email] ?? 0);
  const watchedCount = progresses.filter(p => p.watched && visibleLessons.some((lesson) => lesson.id === p.lesson_id)).length;
  const progressPct = visibleLessons.length > 0 ? Math.round(watchedCount / visibleLessons.length * 100) : 0;

  // Ranking
  const COURSE_PREFIX = { tcc: 'EDU-', psicanalise: 'PSI-', sexologia: 'SEX-' };
  const expectedPrefix = COURSE_PREFIX[userCourse];
  const courseCodes = accessCodes.filter(c => {
    if (!c.student_email) return false;
    if (userCourse && c.course !== userCourse && !(userCourse === 'tcc' && !c.course)) return false;
    if (expectedPrefix && !(c.code || '').startsWith(expectedPrefix)) return false;
    return true;
  });

  const publishedRankMap = {};
  publishedScores.forEach(p => {
    if (typeof p.dashboard_rank === 'number' && publishedRankMap[p.student_email] === undefined) {
      publishedRankMap[p.student_email] = p.dashboard_rank;
    }
  });

  const participationMap = {};
  allScoreItems.forEach((s) => {
    if (!s.student_email) return;
    participationMap[s.student_email] = (participationMap[s.student_email] || 0) + 1;
  });

  const rankingFull = courseCodes.map(c => ({
    email: c.student_email,
    total: capScore(c.pontuacao_total ?? publishedScoreMap[c.student_email] ?? 0),
    publishedRank: publishedRankMap[c.student_email] || Number.MAX_SAFE_INTEGER,
    count: participationMap[c.student_email] || 0,
    name: (c.profile_name || c.student_name || c.student_email || ''),
    avatarColor: c.profile_avatar_color || '#5b5ef4',
    photoUrl: c.profile_photo_url || '',
    avatarEmoji: resolveAvatarEmoji(c.profile_avatar_emoji),
  })).sort((a, b) => {
    if (a.total >= 100 && b.total >= 100 && b.count !== a.count) return b.count - a.count;
    if (a.publishedRank !== b.publishedRank) return a.publishedRank - b.publishedRank;
    return b.total - a.total;
  });

  const studentPublishedRanking = rankingFull.filter(r => Number.isFinite(r.publishedRank) && r.publishedRank !== Number.MAX_SAFE_INTEGER);
  const visibleRanking = studentPublishedRanking.length > 0 ? studentPublishedRanking : rankingFull;
  const myRank = visibleRanking.findIndex(r => r.email === session?.email) + 1;
  const myGrades = submissions.filter(s => s.grade !== undefined && s.grade !== null);

  // Pendências
  const today = new Date();
  const todayYmd = format(today, 'yyyy-MM-dd');
  const periodStart = format(addDays(today, -4), 'yyyy-MM-dd');
  const unlockedLessonCount = getUnlockedLessonCount(unlockRules);
  const availableLessons = sortBySeq(visibleLessons).slice(0, unlockedLessonCount);
  const unwatchedLessons = sortBySeq(availableLessons.filter(l => !progresses.find(p => p.lesson_id === l.id && p.watched)));
  const pendingTasksList = sortBySeq(visibleTasks.filter(t => t.type === 'upload' && isTaskAvailable(t, moduleUnlocked) && !submissions.find(s => s.task_id === t.id)));
  const pendingQuizzes = visibleTasks.filter(t => t.type === 'quiz' && isTaskAvailable(t, moduleUnlocked) && !submissions.find(s => s.task_id === t.id));
  const therapistPending = therapistPairings.filter(p => {
    if (p.pairing_date < periodStart || p.pairing_date > todayYmd) return false;
    if (p.therapist_email === session?.email) return !p.therapist_submitted;
    if (p.patient_email === session?.email) return !p.patient_submitted;
    return false;
  });
  const totalPending = therapistPending.length + Math.min(unwatchedLessons.length, 1) + Math.min(pendingTasksList.length, 1) + Math.min(pendingQuizzes.length, 1);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => { setRefreshing(false); toast.success('Atualizado!'); }, 700);
  };

  return (
    <div className="px-3.5 py-4 space-y-4 min-h-full">

      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#c8bfa8]/35 uppercase tracking-[0.25em] font-light">{format(new Date(), "EEE, dd MMM", { locale: ptBR })}</p>
          <h2 className="text-lg font-light text-[#e8dfc8] tracking-wide mt-0.5">
            {greeting}, <span className="text-[#d4b96a]">{firstName}</span>
          </h2>
        </div>
        <button onClick={handleRefresh} className="w-9 h-9 flex items-center justify-center border border-[#1e2540] rounded-full text-[#c8bfa8]/40 active:scale-95 transition-all">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stat Cards — 2 colunas */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          {
            label: isTeacher ? 'Para Corrigir' : 'Tarefas',
            value: pendingTasks,
            icon: FileText,
            color: 'bg-accent/15',
            iconColor: 'text-primary',
            path: isTeacher ? '/scorecontrol' : '/tasks',
          },
          {
            label: isTeacher ? 'Alunos' : 'Pontos',
            value: isTeacher ? studentCount : formatScore(totalPoints),
            icon: isTeacher ? Users : Star,
            color: isTeacher ? 'bg-accent/15' : 'bg-accent/15',
            iconColor: isTeacher ? 'text-primary' : 'text-primary',
            path: isTeacher ? '/students' : '/dashboard',
          },
          {
            label: isTeacher ? 'Aulas' : 'Aulas Assistidas',
            value: isTeacher ? lessons.length : `${watchedCount}/${visibleLessons.length}`,
            icon: BookOpen,
            color: 'bg-accent/15',
            iconColor: 'text-primary',
            path: '/lessons',
          },
          {
            label: 'Meu Rank',
            value: myRank > 0 ? `#${myRank}` : '—',
            icon: Trophy,
            color: 'bg-accent/15',
            iconColor: 'text-primary',
            path: '/ranking',
            hideAdmin: true,
          },
        ].filter(c => !(isTeacher && c.hideAdmin)).map((card, i) => (
          <button
            key={i}
            onClick={() => navigate(scoped(card.path))}
            className="bg-[#0d1120] border border-[#1e2540] rounded-2xl p-4 flex flex-col gap-2.5 text-left active:scale-95 transition-all"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={17} className={card.iconColor} />
            </div>
            <div>
              <p className="text-[10px] text-[#c8bfa8]/35 uppercase tracking-[0.15em] font-light leading-tight">{card.label}</p>
              <p className="text-xl font-light text-[#e8dfc8] mt-0.5">{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Progresso — apenas aluno */}
      {!isTeacher && (
        <button
          onClick={() => navigate(scoped('/lessons'))}
          className="w-full bg-[#0d1120] border border-[#1e2540] rounded-2xl p-4 text-left active:scale-[0.99] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
                <TrendingUp size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-[12px] font-light text-[#e8dfc8]/80">Progresso</p>
                <p className="text-[10px] text-[#c8bfa8]/30">{watchedCount} de {visibleLessons.length} aulas</p>
              </div>
            </div>
            <span className="text-lg font-light text-[#d4b96a]">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-[#161c32] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5b5ef4] to-[#d4b96a] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {myGrades.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {myGrades.slice(0, 3).map((s, i) => {
                const task = tasks.find(t => t.id === s.task_id);
                return (
                  <div key={i} className="bg-[#161c32] rounded-xl p-2 text-center">
                    <p className="text-base font-light text-[#e8dfc8]">{formatScore(s.grade)}</p>
                    <p className="text-[9px] text-[#c8bfa8]/30 truncate mt-0.5">{task?.title || 'Tarefa'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </button>
      )}

      {/* Ranking compacto — apenas aluno */}
      {!isTeacher && visibleRanking.length > 0 && (
        <div className="bg-[#0d1120] border border-[#1e2540] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
                <Trophy size={15} className="text-primary" />
              </div>
              <p className="text-[12px] font-light text-[#e8dfc8]/80">Ranking</p>
            </div>
            {myRank > 0 && (
              <span className="text-[10px] font-light border border-[#d4b96a]/20 text-[#d4b96a] px-2 py-0.5 rounded-full">#{myRank}</span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto pr-1 space-y-1">
            {visibleRanking.map((r, i) => {
              const isMe = r.email === session?.email;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              const nameWithAvatar = getAvatarPrefixedName(r.name, r.avatarEmoji);
              return (
                <div key={r.email} className={`flex items-center gap-2.5 p-2 rounded-xl ${isMe ? 'bg-[#d4b96a]/8 border border-[#d4b96a]/12' : ''}`}>
                  <span className="w-5 text-center text-sm shrink-0">
                    {medal || <span className="text-[11px] text-[#c8bfa8]/30 font-light">{i + 1}</span>}
                  </span>
                  {r.photoUrl
                    ? <img src={r.photoUrl} alt={r.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    : r.avatarEmoji
                    ? <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: r.avatarColor }}>{r.avatarEmoji}</div>
                    : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-light text-primary-foreground shrink-0" style={{ background: r.avatarColor }}>{getInitials(r.name)}</div>
                  }
                  <span className={`flex-1 text-[12px] font-light truncate ${isMe ? 'text-[#d4b96a]' : 'text-[#e8dfc8]/70'}`}>{nameWithAvatar}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={10} className="text-primary fill-yellow-400" />
                    <span className="text-[11px] font-light text-[#e8dfc8]/60">{formatScore(r.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Painel admin — quick stats */}
      {isTeacher && (
        <div className="bg-[#0d1120] border border-[#1e2540] rounded-2xl p-4">
          <p className="text-[10px] text-[#c8bfa8]/30 uppercase tracking-[0.25em] font-light mb-3">Turma · Resumo</p>
          <div className="space-y-2">
            <button onClick={() => navigate(scoped('/students'))} className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#0a0c18] active:scale-[0.98] transition-all">
              <div className="flex items-center gap-2.5">
                <Users size={15} className="text-primary" />
                <span className="text-[12px] font-light text-[#e8dfc8]/70">Alunos ativos</span>
              </div>
              <span className="text-sm font-light text-[#d4b96a]">{studentCount}</span>
            </button>
            <button onClick={() => navigate(scoped('/scorecontrol'))} className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#0a0c18] active:scale-[0.98] transition-all">
              <div className="flex items-center gap-2.5">
                <FileText size={15} className="text-primary" />
                <span className="text-[12px] font-light text-[#e8dfc8]/70">Entregas para corrigir</span>
              </div>
              <span className="text-sm font-light text-[#d4b96a]">{pendingTasks}</span>
            </button>
            <button onClick={() => navigate(scoped('/lessons'))} className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#0a0c18] active:scale-[0.98] transition-all">
              <div className="flex items-center gap-2.5">
                <BookOpen size={15} className="text-primary" />
                <span className="text-[12px] font-light text-[#e8dfc8]/70">Total de aulas</span>
              </div>
              <span className="text-sm font-light text-[#d4b96a]">{lessons.length}</span>
            </button>
          </div>
        </div>
      )}

      {/* Pendências — acordeão mobile */}
      {!isTeacher && totalPending > 0 && (
        <div className="bg-[#0d1120] border border-primary/20 rounded-2xl overflow-hidden">
          <button
            onClick={() => setPendingOpen(v => !v)}
            className="w-full flex items-center gap-2.5 p-4 active:bg-card/4 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <ClipboardList size={15} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[12px] font-light text-[#e8dfc8]/80">Minhas Pendências</p>
              <p className="text-[10px] text-primary/70">{totalPending} {totalPending === 1 ? 'item' : 'itens'} aguardando</p>
            </div>
            {pendingOpen ? <ChevronUp size={16} className="text-[#c8bfa8]/30 shrink-0" /> : <ChevronDown size={16} className="text-[#c8bfa8]/30 shrink-0" />}
          </button>

          {pendingOpen && (
            <div className="px-4 pb-4 space-y-2 border-t border-[#1e2540]">
              {therapistPending.slice(0, 2).map(p => {
                const isTherapist = p.therapist_email === session?.email;
                return (
                  <button key={p.id} onClick={() => navigate(scoped('/terapeuta'))}
                    className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-accent/8 border border-primary/15 active:scale-[0.98] text-left transition-all">
                    <Heart size={13} className="text-primary shrink-0" />
                    <span className="text-[11px] text-primary/80 flex-1 truncate">{isTherapist ? 'Atender' : 'Ser atendido por'}: {p.patient_name || p.therapist_name}</span>
                    <ArrowRight size={12} className="text-primary/40 shrink-0" />
                  </button>
                );
              })}
              {unwatchedLessons.slice(0, 1).map(l => (
                <button key={l.id} onClick={() => navigate(scoped('/lessons'))}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-accent/8 border border-primary/15 active:scale-[0.98] text-left transition-all">
                  <BookOpen size={13} className="text-primary shrink-0" />
                  <span className="text-[11px] text-primary/80 flex-1 truncate">{extractSeq(l) ? `Aula ${extractSeq(l)} · ` : ''}{l.title}</span>
                  <ArrowRight size={12} className="text-primary/40 shrink-0" />
                </button>
              ))}
              {pendingTasksList.slice(0, 1).map(t => (
                <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-accent/8 border border-primary/15 active:scale-[0.98] text-left transition-all">
                  <ClipboardList size={13} className="text-primary shrink-0" />
                  <span className="text-[11px] text-primary/80 flex-1 truncate">{extractSeq(t) ? `Tarefa ${extractSeq(t)} · ` : ''}{t.title}</span>
                  <ArrowRight size={12} className="text-primary/40 shrink-0" />
                </button>
              ))}
              {pendingQuizzes.slice(0, 1).map(t => (
                <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-accent/8 border border-primary/15 active:scale-[0.98] text-left transition-all">
                  <GraduationCap size={13} className="text-primary shrink-0" />
                  <span className="text-[11px] text-primary/80 flex-1 truncate">{t.title}</span>
                  <ArrowRight size={12} className="text-primary/40 shrink-0" />
                </button>
              ))}
              {totalPending > 5 && (
                <p className="text-[10px] text-[#c8bfa8]/30 text-center pt-1">+{totalPending - 5} pendências a mais</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Avisos recentes */}
      {announcements.length > 0 && (
        <div className="bg-[#0d1120] border border-[#1e2540] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-primary" />
              <p className="text-[12px] font-light text-[#e8dfc8]/80">Avisos</p>
            </div>
            <button onClick={() => navigate(scoped('/announcements'))} className="text-[10px] text-[#d4b96a]/60 active:opacity-60">Ver todos</button>
          </div>
          <div className="space-y-2.5">
            {announcements.slice(0, 2).map(a => (
              <div key={a.id} className="border-b border-[#1e2540] pb-2.5 last:border-0 last:pb-0">
                <p className="text-[9px] text-[#c8bfa8]/25 font-light mb-0.5">{a.created_date ? format(new Date(a.created_date), 'dd/MM') : ''}</p>
                <p className="text-[12px] text-[#e8dfc8]/60 font-light leading-snug">{a.title || a.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}