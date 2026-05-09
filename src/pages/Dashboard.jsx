import React from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Video, FileText, BarChart3, Users, Trophy, TrendingUp, Star, Bell, BookOpen, ArrowRight, Wifi, WifiOff, AlertTriangle, RefreshCw, ClipboardList, GraduationCap, Circle, Crown } from 'lucide-react';
import ServicosCard from '@/components/dashboard/ServicosCard';
import LessonCommentsPanel from '@/components/dashboard/LessonCommentsPanel';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      className="group bg-card rounded-2xl border border-border p-4 sm:p-5 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 w-full"
    >
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
      {subtitle && (
        <p className="text-xs text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {subtitle} <ArrowRight size={11} />
        </p>
      )}
    </button>
  );
}

export default function Dashboard() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const prefix = useScopedPrefix();
  const scoped = (p) => prefix + p;
  const queryClient = useQueryClient();
  const isTeacher = session?.role === 'admin';
  const userCourse = session?.course;
  const [refreshing, setRefreshing] = useState(false);
  const [monitorSelectMode, setMonitorSelectMode] = useState(false);
  const [selectedMonitorEmails, setSelectedMonitorEmails] = useState(new Set());
  const [savingMonitors, setSavingMonitors] = useState(false);

  const toggleMonitorEmail = (email) => {
    setSelectedMonitorEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) { next.delete(email); return next; }
      if (next.size >= 3) { return prev; }
      next.add(email);
      return next;
    });
  };

  const handleSaveMonitors = async () => {
    if (selectedMonitorEmails.size === 0) return;
    setSavingMonitors(true);
    const EPOCH = new Date('2024-01-01T00:00:00Z');
    const CYCLE_DAYS = 5;
    const today = new Date();
    const daysSince = Math.floor((today - EPOCH) / (1000 * 60 * 60 * 24));
    const cycleNum = Math.floor(daysSince / CYCLE_DAYS);
    const cycleDate = new Date(EPOCH.getTime() + cycleNum * CYCLE_DAYS * 24 * 60 * 60 * 1000);
    const periodStart = format(cycleDate, 'yyyy-MM-dd');
    const periodEnd = format(addDays(cycleDate, CYCLE_DAYS - 1), 'yyyy-MM-dd');
    const existing = await base44.entities.MonitorHistory.list('-period_start', 100);
    const currentCycle = existing.filter(m => m.period_start === periodStart && (m.course === userCourse || !m.course));
    for (const m of currentCycle) await base44.entities.MonitorHistory.delete(m.id);
    const emailsArr = [...selectedMonitorEmails];
    for (let i = 0; i < emailsArr.length; i++) {
      const code = accessCodes.find(c => c.student_email === emailsArr[i]);
      await base44.entities.MonitorHistory.create({
        student_email: emailsArr[i],
        student_name: code?.profile_name || code?.student_name || emailsArr[i],
        period_start: periodStart,
        period_end: periodEnd,
        rank_position: i + 1,
        course: userCourse || 'tcc',
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', userCourse || 'all'],
    queryFn: () => userCourse
      ? base44.entities.Task.filter({ course: userCourse }, '-created_date', 200)
      : base44.entities.Task.list('-created_date', 200),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.TaskSubmission.filter(
      isTeacher ? {} : { student_email: session?.email || '' },
      '-created_date', 50
    ),
    enabled: !!session,
  });

  const { data: allScoreItems = [] } = useQuery({
    queryKey: ['all-score-items-rank'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 5),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', userCourse || 'all'],
    queryFn: () => userCourse
      ? base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 200)
      : base44.entities.RecordedLesson.list('order', 200),
  });

  const { data: progresses = [] } = useQuery({
    queryKey: ['lesson-progress', session?.email],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: session?.email }, '-created_date', 200),
    enabled: !isTeacher && !!session?.email,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 5),
  });

  const pendingTasks = isTeacher
    ? submissions.filter(s =>
        s.status === 'submitted' &&
        !allScoreItems.find(si => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)
      ).length
    : tasks.filter(t => !submissions.find(s => s.task_id === t.id)).length;

  const nextLive = liveSessions.find(s => s.status === 'live' || s.status === 'scheduled');
  const isLiveNow = nextLive?.status === 'live';
  const studentCount = accessCodes.filter(c => c.is_active).length;

  // Média do aluno por ScoreItems
  const myScoreItems = allScoreItems.filter(s => s.student_email === session?.email && s.verified);
  const myGrades = submissions.filter(s => s.grade !== undefined && s.grade !== null);
  const avgGrade = myScoreItems.length > 0
    ? (myScoreItems.reduce((sum, s) => sum + (s.score || 0), 0) / myScoreItems.length).toFixed(1)
    : '—';

  const watchedCount = progresses.filter(p => p.watched).length;
  const progressPct = lessons.length > 0 ? Math.round((watchedCount / lessons.length) * 100) : 0;

  // Ranking por ScoreItems verificados — filtrado por curso para alunos
  const courseEmails = isTeacher ? null : new Set(
    accessCodes.filter(c => c.course === userCourse && c.student_email).map(c => c.student_email)
  );
  const rankMap = {};
  allScoreItems.filter(s => s.verified).forEach(s => {
    if (!s.student_email) return;
    if (courseEmails && !courseEmails.has(s.student_email)) return;
    if (!rankMap[s.student_email]) rankMap[s.student_email] = { email: s.student_email, total: 0, count: 0 };
    rankMap[s.student_email].total += (s.score || 0);
    rankMap[s.student_email].count += 1;
  });
  const ranking = Object.values(rankMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const myRank = ranking.findIndex(r => r.email === session?.email) + 1;

  // Count active students per course (codes with no course default to 'tcc')
  const courseStudentCounts = {
    tcc: accessCodes.filter(c => c.is_active && (c.course === 'tcc' || !c.course)).length,
    psicanalise: accessCodes.filter(c => c.is_active && c.course === 'psicanalise').length,
    sexologia: accessCodes.filter(c => c.is_active && c.course === 'sexologia').length,
  };

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
        {isTeacher && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar Gestão'}
          </Button>
        )}
      </div>

      {/* Live Banner */}
      {nextLive && (
        <div
          onClick={() => navigate(scoped('/live'))}
          className={`cursor-pointer rounded-2xl p-4 flex items-center gap-4 border transition-all hover:shadow-lg ${
            isLiveNow
              ? 'bg-gradient-to-r from-red-50 to-red-50/50 border-red-200 hover:border-red-300'
              : 'bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-200 hover:border-blue-300'
          }`}
        >
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
      )}

      {/* Course student counts — admin only */}
      {isTeacher && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">TCC</p>
            <p className="text-2xl font-black text-primary">{courseStudentCounts.tcc}</p>
            <p className="text-[10px] text-muted-foreground mt-1">alunos ativos</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Psicanálise</p>
            <p className="text-2xl font-black text-teal-600">{courseStudentCounts.psicanalise}</p>
            <p className="text-[10px] text-muted-foreground mt-1">alunos ativos</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Sexologia</p>
            <p className="text-2xl font-black text-purple-600">{courseStudentCounts.sexologia}</p>
            <p className="text-[10px] text-muted-foreground mt-1">alunos ativos</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Próxima Live"
          value={nextLive ? (isLiveNow ? 'Ao Vivo!' : nextLive.scheduled_at ? format(new Date(nextLive.scheduled_at), 'dd/MM HH:mm') : 'Agendada') : 'Nenhuma'}
          icon={Video}
          iconBg={isLiveNow ? 'bg-red-500' : 'bg-slate-500'}
          to="/live"
          subtitle="Ir para Sala ao Vivo"
          pulse={isLiveNow}
        />
        <StatCard
          title={isTeacher ? 'Para Corrigir' : 'Tarefas Pendentes'}
          value={pendingTasks}
          icon={FileText}
          iconBg="bg-orange-500"
          to={isTeacher ? '/scores?filter=pending' : '/tasks'}
          subtitle={isTeacher ? 'Ver pontuações pendentes' : 'Ir para Tarefas'}
        />
        <StatCard
          title={isTeacher ? 'Alunos Ativos' : 'Sua Média'}
          value={isTeacher ? studentCount : avgGrade}
          icon={isTeacher ? Users : BarChart3}
          iconBg={isTeacher ? 'bg-emerald-500' : 'bg-primary'}
          to={isTeacher ? '/students' : '/tasks'}
          subtitle={isTeacher ? 'Ver alunos' : 'Ver notas'}
        />
        <StatCard
          title={isTeacher ? 'Total de Aulas' : 'Aulas Assistidas'}
          value={isTeacher ? lessons.length : `${watchedCount}/${lessons.length}`}
          icon={BookOpen}
          iconBg="bg-purple-500"
          to="/lessons"
          subtitle="Ir para Videoaulas"
        />
      </div>

      {/* Student: progress + ranking */}
      {!isTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Progress */}
          <button
            onClick={() => navigate(scoped('/lessons'))}
            className="bg-card rounded-2xl border border-border p-5 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
          >
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
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {myGrades.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {myGrades.slice(0, 6).map((s, i) => {
                  const task = tasks.find(t => t.id === s.task_id);
                  return (
                    <div key={i} className="bg-secondary/60 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-black text-foreground">{s.grade}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{task?.title || 'Tarefa'}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {myGrades.length === 0 && (
              <p className="text-xs text-muted-foreground mt-3 text-center py-2">
                Suas notas aparecerão aqui após serem lançadas
              </p>
            )}
          </button>

          {/* Ranking */}
          <button
            onClick={() => navigate(scoped('/ranking'))}
            className="bg-card rounded-2xl border border-border p-5 text-left hover:border-primary/30 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Trophy size={16} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Ranking Geral</h3>
                  <p className="text-xs text-muted-foreground">Pontuação acumulada</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {myRank > 0 && (
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">#{myRank}</span>
                )}
                <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">O ranking será exibido após as primeiras notas</p>
            ) : (
              <div className="space-y-1.5">
                {ranking.map((r, i) => {
                  const isMe = r.email === session?.email;
                  const code = accessCodes.find(c => c.student_email === r.email);
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
                      {photoUrl ? (
                        <img src={photoUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : avatarEmoji ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: avatarColor }}>
                          {avatarEmoji}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                          {displayName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <span className={`flex-1 text-xs font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>{displayName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-foreground">{r.total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Admin ranking */}
      {isTeacher && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Trophy size={16} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Ranking de Desempenho</h3>
                <p className="text-xs text-muted-foreground">Pontuação dos alunos</p>
              </div>
            </div>
            {!monitorSelectMode ? (
              <button
                onClick={() => setMonitorSelectMode(true)}
                className="flex items-center gap-1.5 text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-1.5 rounded-xl hover:bg-yellow-200 transition-colors"
              >
                <Crown size={12} /> Selecionar Monitores
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selectedMonitorEmails.size}/3 selecionados</span>
                <button onClick={() => { setMonitorSelectMode(false); setSelectedMonitorEmails(new Set()); }} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMonitors}
                  disabled={selectedMonitorEmails.size === 0 || savingMonitors}
                  className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {savingMonitors ? 'Salvando...' : 'Salvar Monitores'}
                </button>
              </div>
            )}
          </div>
          {monitorSelectMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-3">
              Selecione até 3 alunos para serem os Monitores do período atual.
            </div>
          )}
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma nota lançada ainda</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ranking.map((r, i) => {
                const code = accessCodes.find(c => c.student_email === r.email);
                const displayName = code?.profile_name || code?.student_name || r.email;
                const avatarColor = code?.profile_avatar_color || '#5b5ef4';
                const photoUrl = code?.profile_photo_url || '';
                const isSelected = selectedMonitorEmails.has(r.email);
                return (
                  <div
                    key={r.email}
                    onClick={() => monitorSelectMode && toggleMonitorEmail(r.email)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${
                      monitorSelectMode ? 'cursor-pointer hover:bg-yellow-50' : ''
                    } ${
                      isSelected ? 'bg-yellow-100 border border-yellow-300' : 'hover:bg-secondary/50'
                    }`}
                  >
                    {monitorSelectMode && (
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-muted-foreground/40'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    )}
                    <span className="text-sm w-5 text-center shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-muted-foreground font-bold">{i+1}</span>}</span>
                    {photoUrl ? (
                      <img src={photoUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                        {displayName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 text-xs font-semibold text-foreground truncate">{displayName}</span>
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold">{r.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pendências do Aluno */}
      {!isTeacher && (() => {
        const unwatchedLessons = lessons.filter(l => !progresses.find(p => p.lesson_id === l.id && p.watched));
        const pendingTasksList = tasks.filter(t => t.type === 'upload' && !submissions.find(s => s.task_id === t.id));
        const pendingQuizzes = tasks.filter(t => t.type === 'quiz' && !submissions.find(s => s.task_id === t.id));
        const liveNow = liveSessions.filter(s => s.status === 'live');
        const totalPending = unwatchedLessons.length + pendingTasksList.length + pendingQuizzes.length + liveNow.length;

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
              {liveNow.map(live => (
                <button key={live.id} onClick={() => navigate(scoped('/live'))}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors text-left">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                  <Wifi size={13} className="text-red-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-700 truncate">AO VIVO agora: {live.title}</p>
                    <p className="text-[10px] text-red-500">Aula acontecendo agora!</p>
                  </div>
                  <ArrowRight size={12} className="text-red-400 shrink-0" />
                </button>
              ))}
              {unwatchedLessons.slice(0, 3).map(l => (
                <button key={l.id} onClick={() => navigate(scoped('/lessons'))}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors text-left">
                  <Circle size={13} className="text-purple-400 shrink-0" />
                  <BookOpen size={13} className="text-purple-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-purple-700 truncate">{l.title}</p>
                    <p className="text-[10px] text-purple-500">Aula não assistida</p>
                  </div>
                  <ArrowRight size={12} className="text-purple-400 shrink-0" />
                </button>
              ))}
              {unwatchedLessons.length > 3 && (
                <button onClick={() => navigate(scoped('/lessons'))} className="w-full text-xs text-purple-600 font-semibold py-1 hover:underline">
                  +{unwatchedLessons.length - 3} aulas não assistidas → Ver todas
                </button>
              )}
              {pendingTasksList.map(t => (
                <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors text-left">
                  <ClipboardList size={13} className="text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-orange-700 truncate">{t.title}</p>
                    <p className="text-[10px] text-orange-500">
                      Tarefa pendente{t.deadline ? ` · Entrega: ${format(new Date(t.deadline), 'dd/MM HH:mm')}` : ''}
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-orange-400 shrink-0" />
                </button>
              ))}
              {pendingQuizzes.map(t => (
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
              ))}
            </div>
          </div>
        );
      })()}

      {/* Serviços */}
      {!isTeacher && <ServicosCard />}

      {/* Lesson Comments Panel — teacher only */}
      {isTeacher && <LessonCommentsPanel />}

      {/* Announcements */}
      {announcements.length > 0 && (
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
            {announcements.slice(0, 3).map(a => {
              const urgentClass = a.type === 'urgent' ? 'border-red-200 bg-red-50/50' : a.type === 'warning' ? 'border-yellow-200 bg-yellow-50/50' : 'border-border bg-secondary/30';
              return (
                <div key={a.id} className={`p-3 rounded-xl border text-xs ${urgentClass}`}>
                  <div className="flex items-center gap-2">
                    {a.type === 'urgent' && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                    <p className="font-semibold text-foreground truncate">{a.title || a.content}</p>
                    <span className="ml-auto text-muted-foreground shrink-0">{a.created_date ? format(new Date(a.created_date), 'dd/MM') : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}