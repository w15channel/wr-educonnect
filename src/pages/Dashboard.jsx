import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Video, FileText, BarChart3, Users, Trophy, TrendingUp, Star, Bell, BookOpen, ArrowRight, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StatCard({ title, value, icon: Icon, iconBg, to, subtitle, pulse }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
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
  const isTeacher = session?.role === 'admin';

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 50),
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
    queryKey: ['lessons'],
    queryFn: () => base44.entities.RecordedLesson.list('order', 100),
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
    ? submissions.filter(s => s.status === 'submitted').length
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

  // Ranking por ScoreItems verificados
  const rankMap = {};
  allScoreItems.filter(s => s.verified).forEach(s => {
    if (!s.student_email) return;
    if (!rankMap[s.student_email]) rankMap[s.student_email] = { email: s.student_email, total: 0, count: 0 };
    rankMap[s.student_email].total += (s.score || 0);
    rankMap[s.student_email].count += 1;
  });
  const ranking = Object.values(rankMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const myRank = ranking.findIndex(r => r.email === session?.email) + 1;

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
      </div>

      {/* Live Banner */}
      {nextLive && (
        <div
          onClick={() => navigate('/live')}
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Próxima Live"
          value={nextLive ? (isLiveNow ? 'Ao Vivo!' : format(new Date(nextLive.scheduled_at || Date.now()), 'dd/MM HH:mm')) : 'Nenhuma'}
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
          to={isTeacher ? '/scores' : '/tasks'}
          subtitle={isTeacher ? 'Controle de Pontuação' : 'Ir para Tarefas'}
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
            onClick={() => navigate('/lessons')}
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
            onClick={() => navigate('/ranking')}
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
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Trophy size={16} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Ranking de Desempenho</h3>
              <p className="text-xs text-muted-foreground">Pontuação dos alunos</p>
            </div>
          </div>
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma nota lançada ainda</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ranking.map((r, i) => {
                const code = accessCodes.find(c => c.student_email === r.email);
                const displayName = code?.profile_name || code?.student_name || r.email;
                const avatarColor = code?.profile_avatar_color || '#5b5ef4';
                const photoUrl = code?.profile_photo_url || '';
                return (
                  <div key={r.email} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary/50">
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
            <button onClick={() => navigate('/announcements')} className="text-xs text-primary hover:underline flex items-center gap-1">
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
                    <span className="ml-auto text-muted-foreground shrink-0">{format(new Date(a.created_date), 'dd/MM')}</span>
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