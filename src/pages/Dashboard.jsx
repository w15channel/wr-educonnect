import React, { useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Video, FileText, Users, Trophy, TrendingUp, Star, Bell, BookOpen, ArrowRight, Wifi, WifiOff, AlertTriangle, RefreshCw, ClipboardList, GraduationCap, Circle, Crown, Heart } from 'lucide-react';
import ServicosCard from '@/components/dashboard/ServicosCard';
import LessonCommentsPanel from '@/components/dashboard/LessonCommentsPanel';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';
import { format, addDays } from 'date-fns';
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

const getFirstThreePendingBySequence = (items = []) => sortByNumericSequence(items).slice(0, 3);

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
    return `/${parts[0]}/${parts[1]}`;
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


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wr_lobby_music_enabled', 'off');
    }
  }, []);

  const getAssignedPoints = React.useCallback((email, fallback = 0) => {
    if (!manualScoreEmails.has(email)) return roundScore(fallback || 0);
    const draft = scoreDrafts[email];
    const numeric = Number(String(draft ?? '').replace(',', '.'));
    return Number.isFinite(numeric) ? roundScore(numeric) : roundScore(fallback || 0);
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
    const EPOCH = new Date('2024-01-01T00:00:00Z');
    const CYCLE_DAYS = 7;
    const today = new Date();
    const daysSince = Math.floor((today - EPOCH) / (1000 * 60 * 60 * 24));
    const cycleNum = Math.floor(daysSince / CYCLE_DAYS);
    const cycleDate = new Date(EPOCH.getTime() + cycleNum * CYCLE_DAYS * 24 * 60 * 60 * 1000);
    const periodStart = format(cycleDate, 'yyyy-MM-dd');
    const periodEnd = format(addDays(cycleDate, CYCLE_DAYS - 1), 'yyyy-MM-dd');
    const existing = await base44.entities.MonitorHistory.list('-period_start', 100);
    const currentCycle = existing.filter((m) => m.period_start === periodStart && (m.course === userCourse || !m.course));
    for (const m of currentCycle) await base44.entities.MonitorHistory.delete(m.id);
    const oldMonitorAnnouncements = await base44.entities.Announcement.filter({ course: userCourse || 'tcc' }, '-created_date', 300);
    for (const announcement of oldMonitorAnnouncements) {
      const isMonitorNotice = Boolean(announcement.certificate_monitor_id) || (announcement.title || '').includes('Monitor(a) da Semana');
      if (isMonitorNotice) await base44.entities.Announcement.delete(announcement.id);
    }
    const emailsArr = [...selectedMonitorEmails];
    for (let i = 0; i < emailsArr.length; i++) {
      const email = emailsArr[i];
      const code = accessCodes.find((c) => c.student_email === email);
      const studentName = code?.profile_name || code?.student_name || email;
      const monitorRecord = await base44.entities.MonitorHistory.create({
        student_email: email,
        student_name: studentName,
        period_start: periodStart,
        period_end: periodEnd,
        rank_position: i + 1,
        course: userCourse || 'tcc'
      });
      await base44.entities.Announcement.create({
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

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 5)
  });
  const { data: liveAttendances = [] } = useQuery({
    queryKey: ['live-attendances-dashboard', session?.email],
    queryFn: () => base44.entities.LiveAttendance.filter({ student_email: session?.email || '' }, '-created_date', 300),
    enabled: !isTeacher && !!session?.email
  });
  const { data: therapistPairings = [] } = useQuery({
    queryKey: ['therapist-pairings-dashboard'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 300),
    enabled: !isTeacher
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200)
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

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 5)
  });

  const pendingTasks = isTeacher ?
  submissions.filter((s) =>
  s.status === 'submitted' &&
  !allScoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)
  ).length :
  tasks.filter((t) => !submissions.find((s) => s.task_id === t.id)).length;

  const nextLive = liveSessions.find((s) => s.status === 'live' || s.status === 'scheduled');
  const isLiveNow = nextLive?.status === 'live';
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
  const totalPoints = roundScore(currentAccessCode?.pontuacao_total ?? publishedScoreMap[session?.email] ?? 0);

  const watchedCount = progresses.filter((p) => p.watched).length;
  const progressPct = lessons.length > 0 ? Math.round(watchedCount / lessons.length * 100) : 0;

  // Ranking — isolated by course + code prefix (matches /ranking page logic)
  const COURSE_PREFIX = { tcc: 'EDU-', psicanalise: 'PSI-', sexologia: 'SEX-' };
  const expectedPrefix = COURSE_PREFIX[userCourse];
  const courseCodes = accessCodes.filter((c) => {
    if (!c.student_email) return false;
    if (userCourse && c.course !== userCourse && !(userCourse === 'tcc' && !c.course)) return false;
    if (expectedPrefix && !(c.code || '').startsWith(expectedPrefix)) return false;
    return true;
  });
  const scoreMap = Object.fromEntries(courseCodes.map((code) => [code.student_email, roundScore(code.pontuacao_total ?? publishedScoreMap[code.student_email] ?? 0)]));
  const taskIds = new Set(tasks.map((t) => t.id));
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
        if (profile) await base44.entities.StudentProfile.update(profile.id, payload);
        else await base44.entities.StudentProfile.create(payload);
        if (code?.id) await base44.entities.AccessCode.update(code.id, { pontuacao_total: assignedPoints });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      toast.success('Sequência do ranking salva com sucesso!');
    },
  });

  const visibleStudentRanking = (studentPublishedRanking.length > 0 ? studentPublishedRanking : ranking).slice(0, 10);
  const myRank = visibleStudentRanking.findIndex((r) => r.email === session?.email) + 1;

  const firstName = (session?.name || 'Usuário').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="w-full max-w-screen-2xl mx-auto p-4 md:p-5 xl:p-7 space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
          className="gap-2 shrink-0 w-full sm:w-auto"
          onClick={handleRefreshAll}
          disabled={refreshing}>
          
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar Gestão'}
          </Button>
        }
      </div>

      {/* Live Banner */}
      {nextLive &&
      <div
        onClick={() => navigate(scoped('/live'))}
        className={`cursor-pointer rounded-2xl p-4 flex items-center gap-4 border transition-all hover:shadow-lg ${
        isLiveNow ?
        'bg-gradient-to-r from-red-50 to-red-50/50 border-red-200 hover:border-red-300' :
        'bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-200 hover:border-blue-300'}`
        }>
        
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLiveNow ? 'bg-red-100' : 'bg-blue-100'}`}>
            {isLiveNow ? <Wifi size={20} className="text-red-600" /> : <WifiOff size={20} className="text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isLiveNow && <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> TRANSMITINDO
              </span>}
              <p className={`font-bold text-sm truncate ${isLiveNow ? 'text-red-700' : 'text-blue-700'}`}>{nextLive.title}</p>
            </div>
            <p className={`text-xs mt-0.5 ${isLiveNow ? 'text-red-500' : 'text-blue-500'}`}>
              {isLiveNow ? 'Aula ao vivo agora!' : nextLive.scheduled_at ? `Programada para ${format(new Date(nextLive.scheduled_at), 'dd/MM HH:mm')}` : 'Sala ao vivo'}
            </p>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl ${isLiveNow ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
            Entrar <ArrowRight size={12} />
          </div>
        </div>
      }

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="Próxima Live"
          value={nextLive ? isLiveNow ? 'Ao Vivo!' : nextLive.scheduled_at ? format(new Date(nextLive.scheduled_at), 'dd/MM HH:mm') : 'Agendada' : 'Nenhuma'}
          icon={Video}
          iconBg={isLiveNow ? 'bg-red-500' : 'bg-slate-500'}
          to="/live"
          subtitle="Ir para Sala ao Vivo"
          pulse={isLiveNow} />
        
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
          value={isTeacher ? lessons.length : `${watchedCount}/${lessons.length}`}
          icon={BookOpen}
          iconBg="bg-purple-500"
          to="/lessons"
          subtitle="Ir para Videoaulas" />
        
      </div>

      {/* Student: progress + ranking */}
      {!isTeacher &&
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Progress */}
          <button
          onClick={() => navigate(scoped('/lessons'))}
          className="bg-card rounded-2xl border border-border p-5 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
          
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp size={16} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Progresso nas Aulas</h3>
                  <p className="text-xs text-muted-foreground">{watchedCount} de {lessons.length} concluídas</p>
                </div>
              </div>
              <span className="text-2xl font-black text-primary">{progressPct}%</span>
            </div>
            <div className="relative w-full bg-secondary rounded-full h-2.5 overflow-hidden">
              <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }} />
            
            </div>

            {myGrades.length > 0 &&
          <div className="grid grid-cols-3 gap-2 mt-4">
                {myGrades.slice(0, 6).map((s, i) => {
              const task = tasks.find((t) => t.id === s.task_id);
              return (
                <div key={i} className="bg-secondary/60 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-black text-foreground">{formatScore(s.grade)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{task?.title || 'Tarefa'}</p>
                    </div>);

            })}
              </div>
          }
            {myGrades.length === 0 &&
          <p className="text-xs text-muted-foreground mt-3 text-center py-2">
                Suas notas aparecerão aqui após serem lançadas
              </p>
          }
          </button>

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

          <div className="space-y-1.5">
                {visibleStudentRanking.map((r, i) => {
              const isMe = r.email === session?.email;
              const code = accessCodes.find((c) => c.student_email === r.email);
              const displayName = code?.profile_name || code?.student_name || r.email;
              const avatarColor = code?.profile_avatar_color || '#5b5ef4';
              const photoUrl = code?.profile_photo_url || '';
              const avatarEmoji = code?.profile_avatar_emoji || '';
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
                          {displayName?.charAt(0)?.toUpperCase()}
                        </div>
                  }
                      <span className={`flex-1 text-xs font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>{displayName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-foreground">{formatScore(r.total)}</span>
                      </div>
                    </div>);

            })}
              </div>
          }
          </div>
        </div>
      }

      {/* Admin ranking */}
      {isTeacher &&
      <div className="bg-card rounded-2xl border border-border p-5 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-2 max-h-[70vh] overflow-y-auto pr-1">
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

      {/* Pendências do Aluno */}
      {!isTeacher && (() => {
        const today = new Date();
        const todayYmd = format(today, 'yyyy-MM-dd');
        const periodStart = format(addDays(today, -4), 'yyyy-MM-dd');
        const unwatchedLessons = sortByNumericSequence(lessons.filter((l) => !progresses.find((p) => p.lesson_id === l.id && p.watched)));
        const pendingTasksList = sortByNumericSequence(tasks.filter((t) => t.type === 'upload' && !submissions.find((s) => s.task_id === t.id)));
        const visiblePendingLessons = getFirstThreePendingBySequence(unwatchedLessons);
        const visiblePendingTasks = getFirstThreePendingBySequence(pendingTasksList);
        const pendingQuizzes = tasks.filter((t) => t.type === 'quiz' && !submissions.find((s) => s.task_id === t.id));
        const therapistPending = therapistPairings.filter((p) => {
          const inPeriod = p.pairing_date >= periodStart && p.pairing_date <= todayYmd;
          if (!inPeriod) return false;
          if (p.therapist_email === session?.email) return !p.therapist_submitted;
          if (p.patient_email === session?.email) return !p.patient_submitted;
          return false;
        });
        const attendedIds = new Set(liveAttendances.map((a) => a.session_id));
        const missedLives = liveSessions.filter((s) => s.status === 'ended' && !attendedIds.has(s.id));
        const totalPending = therapistPending.length + unwatchedLessons.length + pendingTasksList.length + pendingQuizzes.length + missedLives.length;

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
              {visiblePendingLessons.map((l) =>
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
              {unwatchedLessons.length > 3 &&
              <button onClick={() => navigate(scoped('/lessons'))} className="w-full text-xs text-purple-600 font-semibold py-1 hover:underline">
                  +{unwatchedLessons.length - visiblePendingLessons.length} aulas não assistidas → Ver todas
                </button>
              }
              {visiblePendingTasks.map((t) =>
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
              {pendingTasksList.length > 3 &&
              <button onClick={() => navigate(scoped('/tasks'))} className="w-full text-xs text-orange-600 font-semibold py-1 hover:underline">
                  +{pendingTasksList.length - visiblePendingTasks.length} tarefas pendentes → Ver todas
                </button>
              }
              {pendingQuizzes.slice(0, 3).map((t) =>
              <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors text-left">
                  <GraduationCap size={13} className="text-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-violet-700 truncate">{t.title}</p>
                    <p className="text-[10px] text-violet-500">
                      Prova pendente{t.deadline ? ` · Entrega: ${format(new Date(t.deadline), 'dd/MM HH:mm')}` : ''}
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-violet-400 shrink-0" />
                </button>
              )}
              {pendingQuizzes.length > 3 &&
              <button onClick={() => navigate(scoped('/tasks'))} className="w-full text-xs text-violet-600 font-semibold py-1 hover:underline">
                  +{pendingQuizzes.length - 3} provas pendentes → Ver todas
                </button>
              }
              {missedLives.slice(0, 3).map((live) =>
              <button key={live.id} onClick={() => navigate(scoped('/live'))}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors text-left">
                  <WifiOff size={13} className="text-red-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-700 truncate">{live.title}</p>
                    <p className="text-[10px] text-red-500">Live encerrada sem presença registrada</p>
                  </div>
                  <ArrowRight size={12} className="text-red-400 shrink-0" />
                </button>
              )}
              {missedLives.length > 3 &&
              <button onClick={() => navigate(scoped('/live'))} className="w-full text-xs text-red-600 font-semibold py-1 hover:underline">
                  +{missedLives.length - 3} lives perdidas → Ver todas
                </button>
              }
            </div>
          </div>);

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