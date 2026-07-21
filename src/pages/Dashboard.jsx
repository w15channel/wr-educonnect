import React, { useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { FileText, Users, Trophy, Star, Bell, BookOpen, ArrowRight, AlertTriangle, RefreshCw, ClipboardList, GraduationCap, Circle, Crown, Heart, PlayCircle, MessageSquare, Send, Smile } from 'lucide-react';
import ServicosCard from '@/components/dashboard/ServicosCard';
import LessonCommentsPanel from '@/components/dashboard/LessonCommentsPanel';
import TherapistWeekInviteCard from '@/components/dashboard/TherapistWeekInviteCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { capScore, formatScore } from '@/lib/scoreUtils';
import { getAvatarPrefixedName, getInitials, resolveAvatarEmoji } from '@/lib/avatarUtils';
import { format, addDays } from 'date-fns';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';
import { ptBR } from 'date-fns/locale';


const extractSequenceNumber = (item = {}) => {
  const direct = Number(item.order ?? item.sequence ?? item.lesson_number ?? item.task_number);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const title = item.title || item.name || '';
  const match = title.match(/(?:aula|tarefa|prova)\s*(\d{1,2})\b|\b(\d{1,2})\b/i);
  const parsed = Number(match?.[1] || match?.[2]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const sortByNumericSequence = (items = []) => [...items].sort((a, b) => {
  const aNumber = extractSequenceNumber(a);
  const bNumber = extractSequenceNumber(b);
  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) return aNumber - bNumber;
  if (aNumber !== null && bNumber === null) return -1;
  if (aNumber === null && bNumber !== null) return 1;
  return (a.created_date || '').localeCompare(b.created_date || '');
});

const getNextPendingBySequence = (items = []) => sortByNumericSequence(items).slice(0, 1);

const getUnlockedLessonCount = (rules = []) => {
  const lessonUnlockRule = rules.find((r) => r.scope === 'lessons');
  return Math.max(10, Number(lessonUnlockRule?.unlock_until || 10));
};

const isTaskAvailable = (task, moduleUnlocked = []) =>
  !task.module_number || moduleUnlocked[Number(task.module_number) - 1];

// Aulas assistidas e tarefas pendentes só fazem sentido depois que a plataforma
// tiver histórico real de uso. Como os alunos estão ingressando agora pela
// primeira vez, essas duas categorias ficam desativadas nas Pendências.
// Reative (true) quando houver um novo reset da plataforma com alunos já em andamento.
const SHOW_LESSON_TASK_PENDING_ALERTS = true;
const MINI_CHAT_EMOJIS = ['😀', '😁', '😂', '😊', '😍', '😘', '🤗', '🤩', '😎', '🥳', '🤝', '👏', '🙌', '💪', '🫶', '❤️', '🔥', '✨', '🎉', '🌟', '💡', '📚', '🧠', '🚀', '☕', '🌈', '🙏', '🤔', '😅', '😮', '😢', '👍', '👌', '🙋', '✅', '🎯', '💬', '📝', '🎓', '🌻', '🦋', '🌙'];

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'student' || parts[0] === 'adm') {
    return `/${parts[0]}`;
  }
  return '';
}

function StatCard({ title, value, icon: Icon, iconBg, to, subtitle, pulse }) {
  const navigate = useNavigate();
  const prefix = useScopedPrefix();
  return (
    <button
      onClick={() => navigate(prefix + to)}
      className="group bg-card rounded-2xl border border-border p-4 sm:p-5 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 w-full">
      
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} group-hover:scale-110 transition-transform`}>
          <Icon size={18} className="text-white" />
        </div>
        {pulse && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> AO VIVO
        </span>}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{title}</p>
      {subtitle &&
      <p className="text-xs text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {subtitle} <ArrowRight size={11} />
        </p>
      }
    </button>);

}

export default function Dashboard() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const prefix = useScopedPrefix();
  const scoped = (p) => prefix + p;
  const queryClient = useQueryClient();
  const isTeacher = session?.role === 'admin';
  const userCourse = session?.course;
  const [refreshing, setRefreshing] = React.useState(false);
  const [monitorSelectMode, setMonitorSelectMode] = React.useState(false);
  const [selectedMonitorEmails, setSelectedMonitorEmails] = React.useState(new Set());
  const [savingMonitors, setSavingMonitors] = React.useState(false);
  const [importingPoints, setImportingPoints] = React.useState(false);
  const [draggedEmail, setDraggedEmail] = React.useState(null);
  const [customRanking, setCustomRanking] = React.useState([]);
  const [scoreDrafts, setScoreDrafts] = React.useState({});
  const [manualScoreEmails, setManualScoreEmails] = React.useState(new Set());
  const [miniChatText, setMiniChatText] = React.useState('');
  const [showMiniChatEmojiPicker, setShowMiniChatEmojiPicker] = React.useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wr_lobby_music_enabled', 'off');
    }
  }, []);

  const getAssignedPoints = React.useCallback((email, fallback = 0) => {
    if (!manualScoreEmails.has(email)) return capScore(fallback || 0);
    const draft = scoreDrafts[email];
    const numeric = Number(String(draft ?? '').replace(',', '.'));
    return Number.isFinite(numeric) ? capScore(numeric) : capScore(fallback || 0);
  }, [manualScoreEmails, scoreDrafts]);

  const toggleManualScoreEmail = (email, suggestedPoints) => {
    setManualScoreEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
    setScoreDrafts((prev) => ({ ...prev, [email]: prev[email] ?? formatScore(suggestedPoints || 0) }));
  };

  const handleScoreDraftChange = (email, value) => {
    setScoreDrafts((prev) => ({ ...prev, [email]: value }));
  };

  const toggleMonitorEmail = (email) => {
    setSelectedMonitorEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {next.delete(email);return next;}
      if (next.size >= 3) {return prev;}
      next.add(email);
      return next;
    });
  };

  const handleSaveMonitors = async () => {
    if (selectedMonitorEmails.size === 0) return;
    setSavingMonitors(true);
    // Monitores são publicados e reiniciados manualmente pelo administrador,
    // sem nenhum ciclo automático baseado em tempo. Publicar sempre substitui
    // o lote de monitores atualmente exibido (o mais recente desta turma).
    const periodStart = format(new Date(), 'yyyy-MM-dd');
    const periodEnd = format(addDays(new Date(), 6), 'yyyy-MM-dd');
    const existing = await adminApi.list('MonitorHistory', { sort_by: '-period_start', limit: 100 });
    const courseExisting = existing.filter((m) => m.course === userCourse || !m.course);
    const latestExistingPeriodStart = courseExisting.reduce(
      (max, m) => (!max || m.period_start > max ? m.period_start : max),
      null
    );
    const currentBatch = latestExistingPeriodStart
      ? courseExisting.filter((m) => m.period_start === latestExistingPeriodStart)
      : [];
    for (const m of currentBatch) await adminApi.delete('MonitorHistory', m.id);
    const oldMonitorAnnouncements = await adminApi.list('Announcement', { filter: { course: userCourse || 'tcc' }, sort_by: '-created_date', limit: 300 });
    for (const announcement of oldMonitorAnnouncements) {
      const isMonitorNotice = Boolean(announcement.certificate_monitor_id) || (announcement.title || '').includes('Monitor(a) da Semana');
      if (isMonitorNotice) await adminApi.delete('Announcement', announcement.id);
    }
    const emailsArr = [...selectedMonitorEmails];
    for (let i = 0; i < emailsArr.length; i++) {
      const email = emailsArr[i];
      const code = accessCodes.find((c) => c.student_email === email);
      const studentName = code?.profile_name || code?.student_name || email;
      const { record: monitorRecord } = await adminApi.create('MonitorHistory', {
        student_email: email,
        student_name: studentName,
        period_start: periodStart,
        period_end: periodEnd,
        rank_position: i + 1,
        course: userCourse || 'tcc'
      });
      await adminApi.create('Announcement', {
        title: '🏅 Você é Monitor(a) da Semana!',
        content: `${studentName}, parabéns! Você foi selecionado(a) como ${i + 1}º monitor(a) da semana. Abra o link do certificado para baixar o PDF e escolher onde salvar no seu dispositivo.`,
        type: 'info',
        course: userCourse || 'tcc',
        recipient_email: email,
        certificate_monitor_id: monitorRecord.id,
      });
    }
    await queryClient.invalidateQueries();
    toast.success('✅ Monitores salvos com sucesso!');
    setMonitorSelectMode(false);
    setSelectedMonitorEmails(new Set());
    setSavingMonitors(false);
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Todos os dados atualizados!');
    }, 800);
  };

  const handleImportScoreControlPoints = async () => {
    setImportingPoints(true);
    await queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
    setTimeout(() => {
      setImportingPoints(false);
      toast.success('Sequência exata do ScoreControl importada!');
    }, 600);
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', userCourse || 'all'],
    queryFn: () => userCourse ?
    base44.entities.Task.filter({ course: userCourse }, '-created_date', 200) :
    base44.entities.Task.list('-created_date', 200)
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.TaskSubmission.filter(
      isTeacher ? {} : { student_email: session?.email || '' },
      '-created_date',
      isTeacher ? 1000 : 50
    ),
    enabled: !!session
  });

  const { data: allScoreItems = [] } = useQuery({
    queryKey: ['all-score-items-rank'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000)
  });

  const { data: publishedScores = [] } = useQuery({
    queryKey: ['student-profiles-score-overview'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 10000)
  });

  const { data: therapistPairings = [] } = useQuery({
    queryKey: ['therapist-pairings-dashboard'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 300),
    enabled: !isTeacher
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 2000)
  });
  const chatSessionId = `class_chat_${userCourse || 'tcc'}`;
  const { data: miniChatMessages = [] } = useQuery({
    queryKey: ['dashboard-mini-chat', chatSessionId],
    queryFn: async () => {
      const res = await base44.functions.invoke('saveStudentRecord', {
        action: 'listChatMessages',
        session_id: chatSessionId,
      });
      return res.data?.records || [];
    },
    enabled: !isTeacher && !!session?.email,
    refetchInterval: 3000,
  });

  const { data: unlockRules = [] } = useQuery({
    queryKey: ['unlock-rules-lessons', userCourse || 'all'],
    queryFn: () => userCourse
      ? base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20)
      : base44.entities.Announcement.filter({ type: 'unlock_rule' }, '-updated_date', 20),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', userCourse || 'all'],
    queryFn: () => userCourse ?
    base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 200) :
    base44.entities.RecordedLesson.list('order', 200)
  });

  const { data: progresses = [] } = useQuery({
    queryKey: ['lesson-progress', session?.email],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: session?.email }, '-created_date', 200),
    enabled: !isTeacher && !!session?.email
  });

  const { moduleUnlocked } = useApostilaModuleUnlocks(userCourse, session);

  useEffect(() => {
    if (isTeacher || !session?.email) return;
    const myCode = accessCodes.find((c) => c.student_email === session.email);
    if (!myCode?.id) return;
    const markOnline = () => base44.entities.AccessCode.update(myCode.id, { is_online: true, last_seen_at: new Date().toISOString() });
    markOnline();
    const timer = setInterval(markOnline, 30000);
    return () => clearInterval(timer);
  }, [accessCodes, isTeacher, session?.email]);

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 5)
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['exams-dashboard', userCourse || 'all'],
    queryFn: () => userCourse ?
    base44.entities.Exam.filter({ course: userCourse, is_published: true }, '-created_date', 300) :
    base44.entities.Exam.list('-created_date', 300),
    enabled: !isTeacher
  });

  const { data: examSubmissions = [] } = useQuery({
    queryKey: ['exam-submissions-dashboard', session?.email],
    queryFn: () => base44.entities.ExamSubmission.filter({ student_email: session?.email || '' }, '-submitted_at', 300),
    enabled: !isTeacher && !!session?.email
  });

  const visibleTasks = isTeacher ? tasks : tasks.filter((task) => !task.is_hidden);
  const visibleLessons = isTeacher ? lessons : lessons.filter((lesson) => !lesson.is_hidden);
  const visibleExams = isTeacher ? exams : exams.filter((exam) => !exam.is_hidden);

  const pendingTasks = isTeacher ?
  submissions.filter((s) =>
  s.status === 'submitted' &&
  !allScoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)
  ).length :
  visibleTasks.filter((t) => isTaskAvailable(t, moduleUnlocked) && !submissions.find((s) => s.task_id === t.id)).length;

  // Count only students of the current course
  const studentCount = accessCodes.filter((c) => {
    if (!c.is_active) return false;
    if (!userCourse) return true;
    return c.course === userCourse || userCourse === 'tcc' && !c.course;
  }).length;

  // Total de pontos publicado pelo ScoreControl
  const publishedScoreMap = {};
  const publishedRankMap = {};
  publishedScores.forEach((p) => {
    const isSameCourse = !p.dashboard_course || p.dashboard_course === userCourse;
    if (!isSameCourse || !p.student_email) return;

    if (typeof p.points === 'number' && publishedScoreMap[p.student_email] === undefined) {
      publishedScoreMap[p.student_email] = p.points;
    }

    if (typeof p.dashboard_rank === 'number' && publishedRankMap[p.student_email] === undefined) {
      publishedRankMap[p.student_email] = p.dashboard_rank;
    }
  });
  const myGrades = submissions.filter((s) => s.grade !== undefined && s.grade !== null);
  const currentAccessCode = accessCodes.find((code) => code.student_email === session?.email);
  const totalPoints = capScore(currentAccessCode?.pontuacao_total ?? publishedScoreMap[session?.email] ?? 0);

  const lessonIds = new Set(visibleLessons.map((l) => l.id));
  const watchedCount = progresses.filter((p) => p.watched && lessonIds.has(p.lesson_id)).length;
  const progressPct = visibleLessons.length > 0 ? Math.round(watchedCount / visibleLessons.length * 100) : 0;

  // Ranking — isolated by course only (prefix filter removed: causes students to be invisible)
  const courseCodes = accessCodes.filter((c) => {
    if (!c.student_email) return false;
    if (userCourse && c.course !== userCourse && !(userCourse === 'tcc' && !c.course)) return false;
    return true;
  });
  const scoreMap = Object.fromEntries(courseCodes.map((code) => [code.student_email, capScore(code.pontuacao_total ?? publishedScoreMap[code.student_email] ?? 0)]));
  const taskIds = new Set(visibleTasks.map((t) => t.id));
  const courseSubmissions = submissions.filter((s) => taskIds.has(s.task_id));
  const participationMap = {};
  allScoreItems.forEach((s) => {
    if (!s.student_email) return;
    participationMap[s.student_email] = (participationMap[s.student_email] || 0) + 1;
  });
  const rankingFull = courseCodes.map((c) => {
    const hasPending = courseSubmissions.some((s) =>
      s.status === 'submitted' &&
      s.student_email === c.student_email &&
      !allScoreItems.find((si) => si.ref_id === s.task_id && si.student_email === c.student_email && si.verified)
    );
    return {
      email: c.student_email,
      total: scoreMap[c.student_email] || 0,
      publishedRank: publishedRankMap[c.student_email] || Number.MAX_SAFE_INTEGER,
      count: participationMap[c.student_email] || 0,
      enrolledAt: c.created_date ? new Date(c.created_date).getTime() : Number.MAX_SAFE_INTEGER,
      name: (c.profile_name || c.student_name || c.student_email || '').toLowerCase(),
      hasPending
    };
  }).sort((a, b) => {
    if (a.total >= 100 && b.total >= 100 && b.count !== a.count) return b.count - a.count;
    if (a.publishedRank !== b.publishedRank) return a.publishedRank - b.publishedRank;
    if (b.total !== a.total) return b.total - a.total;
    if (a.count > 0 || b.count > 0) {
      if (b.count !== a.count) return b.count - a.count;
    }
    if (a.enrolledAt !== b.enrolledAt) return a.enrolledAt - b.enrolledAt;
    return a.name.localeCompare(b.name);
  });
  const ranking = rankingFull.slice(0, 10);
  const studentPublishedRanking = rankingFull
    .filter((item) => Number.isFinite(item.publishedRank) && item.publishedRank !== Number.MAX_SAFE_INTEGER)
    .sort((a, b) => a.publishedRank - b.publishedRank);
  React.useEffect(() => {
    setCustomRanking(ranking);
    setScoreDrafts((prev) => {
      const next = { ...prev };
      ranking.forEach((r) => {
        if (next[r.email] === undefined) next[r.email] = formatScore(r.total || 0);
      });
      return next;
    });
  }, [ranking.map((r) => r.email).join('|')]);

  const saveDashboardOrderMutation = useMutation({
    mutationFn: async () => {
      for (const [index, item] of customRanking.entries()) {
        const profile = publishedScores.find((p) => p.student_email === item.email && (!p.dashboard_course || p.dashboard_course === userCourse));
        const code = accessCodes.find((c) => c.student_email === item.email);
        const assignedPoints = getAssignedPoints(item.email, item.total);
        const payload = {
          student_email: item.email,
          full_name: code?.profile_name || code?.student_name || item.email,
          points: assignedPoints,
          pontuacao_total: assignedPoints,
          dashboard_rank: index + 1,
          dashboard_course: userCourse,
        };
        if (profile) await adminApi.update('StudentProfile', profile.id, payload);
        else await adminApi.create('StudentProfile', payload);
        if (code?.id) await adminApi.update('AccessCode', code.id, { pontuacao_total: assignedPoints });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      toast.success('Sequência do ranking salva com sucesso!');
    },
  });

  const studentRankingSource = studentPublishedRanking.length > 0 ? studentPublishedRanking : rankingFull;
  const visibleStudentRanking = studentRankingSource;
  const myRank = studentRankingSource.findIndex((r) => r.email === session?.email) + 1;
  const isStudentOnline = (student) => student.is_online && student.last_seen_at && Date.now() - new Date(student.last_seen_at).getTime() < 90000;
  const onlineClassmates = accessCodes
    .filter((c) => c.student_email && c.student_email !== session?.email && c.is_active !== false)
    .filter((c) => !userCourse || c.course === userCourse || userCourse === 'tcc' && !c.course)
    .filter(isStudentOnline)
    .sort((a, b) => (a.profile_name || a.student_name || a.student_email || '').localeCompare(b.profile_name || b.student_name || b.student_email || '', 'pt-BR'));
  const recentMiniChatMessages = miniChatMessages.slice(-12);

  const sendMiniChatMutation = useMutation({
    mutationFn: async (content) => {
      await base44.functions.invoke('saveStudentRecord', {
        action: 'create',
        entity: 'ChatMessage',
        data: {
          session_id: chatSessionId,
          author_name: session?.name || 'Aluno',
          author_email: session?.email || session?.code || '',
          content,
          is_hand_raised: false,
        },
      });
    },
    onSuccess: async () => {
      setMiniChatText('');
      setShowMiniChatEmojiPicker(false);
      await queryClient.invalidateQueries({ queryKey: ['dashboard-mini-chat', chatSessionId] });
    },
  });

  const firstName = (session?.name || 'Usuário').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="p-4 lg:p-7 max-w-7xl mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-0.5">
            {greeting}, {firstName} 👋
          </p>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">
            {isTeacher ? 'Painel Administrativo' : 'Meu Dashboard'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        {isTeacher &&
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={handleRefreshAll}
          disabled={refreshing}>
          
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar Gestão'}
          </Button>
        }
      </div>

      {/* Pendências do Aluno */}
      {!isTeacher && (() => {
        const today = new Date();
        const todayYmd = format(today, 'yyyy-MM-dd');
        const periodStart = format(addDays(today, -4), 'yyyy-MM-dd');
        const unlockedLessonCount = getUnlockedLessonCount(unlockRules);
        const availableLessons = sortByNumericSequence(visibleLessons).slice(0, unlockedLessonCount);
        const unwatchedLessons = sortByNumericSequence(availableLessons.filter((l) => !progresses.find((p) => p.lesson_id === l.id && p.watched)));
        const pendingTasksList = sortByNumericSequence(visibleTasks.filter((t) => t.type === 'upload' && isTaskAvailable(t, moduleUnlocked) && !submissions.find((s) => s.task_id === t.id)));
        const visiblePendingLessons = getNextPendingBySequence(unwatchedLessons);
        const visiblePendingTasks = getNextPendingBySequence(pendingTasksList);
        const pendingExams = visibleExams.filter((e) => !examSubmissions.find((s) => s.exam_id === e.id));
        const therapistPending = therapistPairings.filter((p) => {
          const inPeriod = p.pairing_date >= periodStart && p.pairing_date <= todayYmd;
          if (!inPeriod) return false;
          if (p.therapist_email === session?.email) return !p.therapist_submitted;
          if (p.patient_email === session?.email) return !p.patient_submitted;
          return false;
        });
        const totalPending = therapistPending.length +
          (SHOW_LESSON_TASK_PENDING_ALERTS ? Math.min(unwatchedLessons.length, 1) + Math.min(pendingTasksList.length, 1) : 0) +
          pendingExams.length;

        if (totalPending === 0) return null;

        return (
          <div className="bg-card rounded-2xl border border-orange-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <ClipboardList size={16} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Minhas Pendências</h3>
                <p className="text-xs text-muted-foreground">{totalPending} {totalPending === 1 ? 'item pendente' : 'itens pendentes'}</p>
              </div>
            </div>
            <div className="space-y-2">
              {therapistPending.slice(0, 3).map((pairing) => {
                const isTherapist = pairing.therapist_email === session?.email;
                const otherName = isTherapist ? pairing.patient_name : pairing.therapist_name;
                return (
              <button key={pairing.id} onClick={() => navigate(scoped('/terapeuta'))}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-pink-50 border border-pink-100 hover:bg-pink-100 transition-colors text-left">
                  <Heart size={13} className="text-pink-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-pink-700 truncate">{isTherapist ? 'Atender' : 'Ser atendido(a) por'}: {otherName || 'Pareamento da semana'}</p>
                    <p className="text-[10px] text-pink-500">Terapeuta da semana pendente</p>
                  </div>
                  <ArrowRight size={12} className="text-pink-400 shrink-0" />
                </button>
                );
              })}
              {therapistPending.length > 3 &&
              <button onClick={() => navigate(scoped('/terapeuta'))} className="w-full text-xs text-pink-600 font-semibold py-1 hover:underline">
                  +{therapistPending.length - 3} pendências de terapeuta → Ver todas
                </button>
              }
              {SHOW_LESSON_TASK_PENDING_ALERTS && visiblePendingLessons.map((l) =>
              <button key={l.id} onClick={() => navigate(scoped('/lessons'))}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors text-left">
                  <Circle size={13} className="text-purple-400 shrink-0" />
                  <BookOpen size={13} className="text-purple-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-purple-700 truncate">{extractSequenceNumber(l) ? `Aula ${extractSequenceNumber(l)} · ` : ''}{l.title}</p>
                    <p className="text-[10px] text-purple-500">Aula não assistida · próximas pendências em ordem numérica</p>
                  </div>
                  <ArrowRight size={12} className="text-purple-400 shrink-0" />
                </button>
              )}
              {SHOW_LESSON_TASK_PENDING_ALERTS && unwatchedLessons.length > visiblePendingLessons.length &&
              <button onClick={() => navigate(scoped('/lessons'))} className="w-full text-xs text-purple-600 font-semibold py-1 hover:underline">
                  +{unwatchedLessons.length - visiblePendingLessons.length} aulas no aguardo → Ver todas
                </button>
              }
              {SHOW_LESSON_TASK_PENDING_ALERTS && visiblePendingTasks.map((t) =>
              <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors text-left">
                  <ClipboardList size={13} className="text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-orange-700 truncate">{extractSequenceNumber(t) ? `Tarefa ${extractSequenceNumber(t)} · ` : ''}{t.title}</p>
                    <p className="text-[10px] text-orange-500">
                      Tarefa pendente{t.deadline ? ` · Entrega: ${format(new Date(t.deadline), 'dd/MM HH:mm')}` : ''}
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-orange-400 shrink-0" />
                </button>
              )}
              {SHOW_LESSON_TASK_PENDING_ALERTS && pendingTasksList.length > visiblePendingTasks.length &&
              <button onClick={() => navigate(scoped('/tasks'))} className="w-full text-xs text-orange-600 font-semibold py-1 hover:underline">
                  +{pendingTasksList.length - visiblePendingTasks.length} tarefas no aguardo → Ver todas
                </button>
              }
              {pendingExams.slice(0, 3).map((e) =>
              <button key={e.id} onClick={() => navigate(scoped('/exams'))}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors text-left">
                  <GraduationCap size={13} className="text-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-violet-700 truncate">{e.title}</p>
                    <p className="text-[10px] text-violet-500">
                      Prova pendente{e.deadline ? ` · Entrega: ${format(new Date(e.deadline), 'dd/MM HH:mm')}` : ''}
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-violet-400 shrink-0" />
                </button>
              )}
              {pendingExams.length > 3 &&
              <button onClick={() => navigate(scoped('/exams'))} className="w-full text-xs text-violet-600 font-semibold py-1 hover:underline">
                  +{pendingExams.length - 3} provas pendentes → Ver todas
                </button>
              }
            </div>
          </div>);

      })()}

      {/* Convite: Terapeuta da Semana — mesmo tamanho/proporção das Pendências */}
      {!isTeacher && <TherapistWeekInviteCard studentEmail={session?.email} />}

      {/* Student: progress + ranking */}
      {!isTeacher &&
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tutorial player */}
          <div className="bg-card rounded-2xl border border-border p-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <PlayCircle size={16} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Tutorial da Plataforma</h3>
                <p className="text-xs text-muted-foreground">Assista quando quiser para aprender a usar o site</p>
              </div>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
              <iframe
                src="https://drive.google.com/file/d/1cIKz1staWdnYROSBlyfXh7H3bjX7vb3w/preview"
                allow="autoplay"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                title="Tutorial da Plataforma"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Este vídeo é o tutorial de como usar o site adequadamente. Você pode assisti-lo sempre que precisar — tudo o que você precisa para começar a usar a plataforma está nele.
            </p>
          </div>

          {/* Ranking */}
          <div className="bg-card rounded-2xl border border-border p-5 text-left">
          
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Trophy size={16} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Ranking Geral</h3>
                  <p className="text-xs text-muted-foreground">Pontuação publicada manualmente pelo administrador</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {myRank > 0 &&
              <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">#{myRank}</span>
              }
              </div>
            </div>
            {visibleStudentRanking.length === 0 ?
          <p className="text-sm text-muted-foreground text-center py-6">O ranking será exibido após as primeiras notas</p> :

          <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                {visibleStudentRanking.map((r, i) => {
              const isMe = r.email === session?.email;
              const code = accessCodes.find((c) => c.student_email === r.email);
              const displayName = code?.profile_name || code?.student_name || r.email;
              const avatarColor = code?.profile_avatar_color || '#5b5ef4';
              const photoUrl = code?.profile_photo_url || '';
              const avatarEmoji = resolveAvatarEmoji(code?.profile_avatar_emoji);
              const nameWithAvatar = getAvatarPrefixedName(displayName, code?.profile_avatar_emoji);
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div key={r.email} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${isMe ? 'bg-primary/8 border border-primary/15' : 'hover:bg-secondary/50'}`}>
                      <span className="w-5 text-center text-sm shrink-0">
                        {medal || <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                      </span>
                      {photoUrl ?
                  <img src={photoUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover shrink-0" /> :
                  avatarEmoji ?
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: avatarColor }}>
                          {avatarEmoji}
                        </div> :

                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                          {getInitials(displayName)}
                        </div>
                  }
                      <span className={`flex-1 text-xs font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>{nameWithAvatar}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-foreground">{formatScore(r.total)}</span>
                      </div>
                    </div>);

            })}
              </div>
          }

            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" />
                  <p className="text-xs font-bold text-foreground">Chat da turma</p>
                </div>
                <button
                  onClick={() => navigate(scoped('/chat'))}
                  className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline shrink-0"
                >
                  Abrir chat completo →
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                🎉 Interaja com sua turma agora — compartilhe ideias, tire dúvidas e celebre conquistas juntos!
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-foreground">Online agora:</span>
                {onlineClassmates.length === 0 ?
                <span className="text-[11px] text-muted-foreground">sem colegas online no momento</span> :
                onlineClassmates.slice(0, 8).map((student) =>
                <span key={student.id} className="text-[11px] px-2 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700">
                      {getAvatarPrefixedName(student.profile_name || student.student_name || student.student_email, student.profile_avatar_emoji)}
                    </span>
                )
                }
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-2 h-40 overflow-y-auto space-y-1.5">
                {recentMiniChatMessages.length === 0 ?
                <p className="text-xs text-muted-foreground">Ainda nao ha mensagens no chat geral.</p> :
                recentMiniChatMessages.map((msg) => {
                  const isMe = msg.author_email === session?.email;
                  const authorCode = accessCodes.find((c) => c.student_email === msg.author_email);
                  const authorName = authorCode?.profile_name || authorCode?.student_name || msg.author_name || 'Aluno';
                  const authorDisplayName = getAvatarPrefixedName(isMe ? 'Voce' : authorName, authorCode?.profile_avatar_emoji);
                  return (
                    <div key={msg.id} className="text-[11px] leading-relaxed">
                      <span className={`font-semibold ${isMe ? 'text-primary' : 'text-foreground'}`}>{authorDisplayName}:</span>
                      <span className="ml-1 text-muted-foreground">{msg.content}</span>
                    </div>);
                })
                }
              </div>

              {showMiniChatEmojiPicker &&
              <div className="rounded-xl border border-border bg-secondary/20 p-2">
                  <div className="grid grid-cols-7 gap-1">
                    {MINI_CHAT_EMOJIS.map((emoji) =>
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setMiniChatText((prev) => `${prev}${emoji}`)}
                    className="h-9 rounded-lg bg-background hover:bg-secondary text-lg transition-colors"
                    aria-label={`Inserir ${emoji}`}>
                    
                        {emoji}
                      </button>
                  )}
                  </div>
                </div>
              }
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const content = miniChatText.trim();
                  if (!content || sendMiniChatMutation.isPending) return;
                  sendMiniChatMutation.mutate(content);
                }}
                className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMiniChatEmojiPicker((prev) => !prev)}
                  className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${showMiniChatEmojiPicker ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}>
                  
                  <Smile size={15} />
                </button>
                <input
                  value={miniChatText}
                  onChange={(e) => setMiniChatText(e.target.value)}
                  placeholder="Escreva para a turma..."
                  className="flex-1 h-9 px-3 text-xs border border-border rounded-lg bg-background focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!miniChatText.trim() || sendMiniChatMutation.isPending}
                  className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                  
                  <Send size={12} /> {sendMiniChatMutation.isPending ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      }

      {/* Admin ranking */}
      {isTeacher &&
      <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Trophy size={16} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Ranking Geral Manual</h3>
                <p className="text-xs text-muted-foreground">Publique pontos como um post e escolha os 3 monitores no mesmo campo</p>
              </div>
            </div>
            {!monitorSelectMode ?
          <div className="flex flex-wrap items-center justify-end gap-2">
                <button
              onClick={() => setMonitorSelectMode(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-1.5 rounded-xl hover:bg-yellow-200 transition-colors">
              
                  <Crown size={12} /> Selecionar Monitores
                </button>
              </div> :

          <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selectedMonitorEmails.size}/3 selecionados</span>
                <button onClick={() => {setMonitorSelectMode(false);setSelectedMonitorEmails(new Set());}} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border">
                  Cancelar
                </button>
                <button
              onClick={handleSaveMonitors}
              disabled={selectedMonitorEmails.size === 0 || savingMonitors}
              className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity">
              
                  {savingMonitors ? 'Publicando...' : 'Publicar Monitores'}
                </button>
              </div>
          }
          </div>
          {monitorSelectMode &&
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-3">
Selecione até 3 alunos para serem os Monitores da semana. Ao publicar, cada monitor receberá um aviso individual com link para baixar o certificado.
            </div>
        }
          {customRanking.length === 0 ?
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma nota lançada ainda</p> :

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {customRanking.map((r, i) => {
            const code = accessCodes.find((c) => c.student_email === r.email);
            const displayName = code?.profile_name || code?.student_name || r.email;
            const avatarColor = code?.profile_avatar_color || '#5b5ef4';
            const photoUrl = code?.profile_photo_url || '';
            const isSelected = selectedMonitorEmails.has(r.email);
            return (
              <div
                key={r.email}
                draggable
                onDragStart={() => setDraggedEmail(r.email)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!draggedEmail || draggedEmail === r.email) return;
                  const from = customRanking.findIndex((x) => x.email === draggedEmail);
                  const to = customRanking.findIndex((x) => x.email === r.email);
                  if (from < 0 || to < 0) return;
                  const next = [...customRanking];
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved);
                  setCustomRanking(next);
                }}
                onClick={() => monitorSelectMode && toggleMonitorEmail(r.email)}
                className={`relative flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border transition-colors ${
                monitorSelectMode ? 'cursor-pointer hover:bg-yellow-50' : ''} ${

                isSelected ? 'bg-yellow-100 border-yellow-300' : 'border-border hover:bg-secondary/50'}`
                }>
                
                    {monitorSelectMode &&
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-muted-foreground/40'}`
                }>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                }
                    <span className="absolute top-2 left-2 text-sm font-black">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-muted-foreground">#{i + 1}</span>}</span>
                    {photoUrl ?
                <img src={photoUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover shrink-0" /> :

                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                        {displayName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                }
                    <div className="w-full min-w-0">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-bold text-foreground truncate max-w-full">{displayName}</span>
                        {r.hasPending && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-xl">
                      <Star size={10} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-black text-yellow-700">{formatScore(getAssignedPoints(r.email, r.total))}</span>
                    </div>
                    <div className="w-full space-y-1.5 mt-1">
                      <div className="text-[10px] text-muted-foreground">Sugestão: {formatScore(r.total)} pts</div>
                      <input
                        type="text"
                        value={manualScoreEmails.has(r.email) ? (scoreDrafts[r.email] ?? formatScore(r.total)) : formatScore(r.total)}
                        onChange={(e) => handleScoreDraftChange(r.email, e.target.value)}
                        disabled={!manualScoreEmails.has(r.email)}
                        className="w-full h-8 rounded-lg border border-border bg-background px-2 text-center text-xs font-bold disabled:bg-secondary/60"
                        aria-label={`Pontuação de ${displayName}`}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleManualScoreEmail(r.email, r.total); }}
                        className="w-full text-[10px] font-bold text-primary hover:underline"
                      >
                        {manualScoreEmails.has(r.email) ? 'Usar sugestão automática' : 'Pontuar manualmente'}
                      </button>
                    </div>
              </div>);

          })}
            </div>
        }
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => saveDashboardOrderMutation.mutate()} disabled={saveDashboardOrderMutation.isPending || customRanking.length === 0}>
              {saveDashboardOrderMutation.isPending ? 'Publicando ranking...' : 'Publicar ranking manual'}
            </Button>
          </div>
        </div>
      }

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Apostila"
          value={`${moduleUnlocked.filter(Boolean).length}/${moduleUnlocked.length || 10}`}
          icon={BookOpen}
          iconBg="bg-emerald-500"
          to="/apostila"
          subtitle="Ir para Apostila" />
        
        <StatCard
          title={isTeacher ? 'Para Corrigir' : 'Tarefas Pendentes'}
          value={pendingTasks}
          icon={FileText}
          iconBg="bg-orange-500"
          to={isTeacher ? '/scorecontrol?filter=pending' : '/tasks'}
          subtitle={isTeacher ? 'Ver pontuações pendentes' : 'Ir para Tarefas'} />
        
        <StatCard
          title={isTeacher ? 'Alunos Ativos' : 'Meus Pontos'}
          value={isTeacher ? studentCount : formatScore(totalPoints)}
          icon={isTeacher ? Users : Star}
          iconBg={isTeacher ? 'bg-emerald-500' : 'bg-yellow-500'}
          to={isTeacher ? '/students' : '/dashboard'}
          subtitle={isTeacher ? 'Ver alunos' : 'Pontuação publicada pelo administrador'} />
        
        <StatCard
          title={isTeacher ? 'Total de Aulas' : 'Aulas Assistidas'}
          value={isTeacher ? lessons.length : `${watchedCount}/${visibleLessons.length}`}
          icon={BookOpen}
          iconBg="bg-purple-500"
          to="/lessons"
          subtitle="Ir para Videoaulas" />
        
      </div>

      {/* Ofensiva CTA — Widget animado */}
      {!isTeacher && (() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return (
          <button
            onClick={() => navigate(scoped('/ofensivas'))}
            className="w-full group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-red-500/10 p-5 text-left hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200"
          >
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent animate-pulse rounded-2xl" />
            {/* Spark sparkles decorative */}
            <div className="absolute top-3 right-12 text-yellow-400 opacity-60 text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
            <div className="absolute top-6 right-6 text-orange-400 opacity-40 text-sm animate-bounce" style={{ animationDelay: '0.7s' }}>🔥</div>
            <div className="absolute bottom-4 right-8 text-amber-400 opacity-30 text-xs animate-bounce" style={{ animationDelay: '1.1s' }}>⭐</div>
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0 group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-black text-base text-foreground">Ofensiva do Dia</p>
                  <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full animate-pulse">NOVO</span>
                </div>
                <p className="text-xs text-muted-foreground">8 perguntas · até <span className="font-bold text-orange-400">+1,0 pt</span> hoje</p>
                <p className="text-[11px] text-orange-500/80 mt-1 font-semibold">Sequências de 5, 10 e 20 dias ganham bônus! 🏆</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold bg-orange-500 text-white px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-orange-600 transition-colors">
                Jogar <ArrowRight size={12} />
              </div>
            </div>
          </button>
        );
      })()}

      {/* Serviços */}
      {!isTeacher && <ServicosCard />}

      {/* Lesson Comments Panel — teacher only */}
      {isTeacher && <LessonCommentsPanel />}

      {/* Announcements */}
      {announcements.length > 0 &&
      <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Bell size={16} className="text-yellow-600" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Avisos Recentes</h3>
            </div>
            <button onClick={() => navigate(scoped('/announcements'))} className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {announcements.slice(0, 3).map((a) => {
            const urgentClass = a.type === 'urgent' ? 'border-red-200 bg-red-50/50' : a.type === 'warning' ? 'border-yellow-200 bg-yellow-50/50' : 'border-border bg-secondary/30';
            return (
              <div key={a.id} className={`p-3 rounded-xl border text-xs ${urgentClass}`}>
                  <div className="flex items-center gap-2">
                    {a.type === 'urgent' && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                    <p className="font-semibold text-foreground truncate">{a.title || a.content}</p>
                    <span className="ml-auto text-muted-foreground shrink-0">{a.created_date ? format(new Date(a.created_date), 'dd/MM') : ''}</span>
                  </div>
                </div>);

          })}
          </div>
        </div>
      }
    </div>);

}