import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Video, FileText, BarChart, Users, AlertCircle, Info, Bell, Trophy, TrendingUp, Star } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user: session } = useOutletContext();
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

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions-rank'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 500),
    enabled: !isTeacher,
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 5),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 5),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
    enabled: !isTeacher,
  });

  const { data: adminCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
    enabled: isTeacher,
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

  const pendingTasks = isTeacher
    ? submissions.filter(s => s.status === 'submitted').length
    : tasks.filter(t => !submissions.find(s => s.task_id === t.id)).length;

  const nextLive = liveSessions.find(s => s.status === 'scheduled' || s.status === 'live');
  const studentCount = adminCodes.filter(c => c.is_active).length;

  const myGrades = submissions.filter(s => s.grade !== undefined && s.grade !== null);
  const avgGrade = myGrades.length > 0
    ? (myGrades.reduce((sum, s) => sum + s.grade, 0) / myGrades.length).toFixed(1)
    : '—';

  const watchedCount = progresses.filter(p => p.watched).length;
  const progressPct = lessons.length > 0 ? Math.round((watchedCount / lessons.length) * 100) : 0;

  // Build ranking from allSubmissions
  const rankMap = {};
  allSubmissions.forEach(s => {
    if (s.grade !== undefined && s.grade !== null && s.student_email) {
      if (!rankMap[s.student_email]) rankMap[s.student_email] = { email: s.student_email, name: s.student_name || s.student_email, total: 0, count: 0 };
      rankMap[s.student_email].total += s.grade;
      rankMap[s.student_email].count += 1;
    }
  });
  const ranking = Object.values(rankMap)
    .map(r => ({ ...r, avg: r.count > 0 ? (r.total / r.count) : 0 }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const myRank = ranking.findIndex(r => r.email === session?.email) + 1;

  const typeIcons = { info: Info, warning: AlertCircle, urgent: Bell };
  const typeColors = {
    info: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    urgent: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Olá, {(session?.name || 'Usuário').split(' ')[0]} 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          {isTeacher ? 'Painel administrativo — EduConnect' : 'Bem-vindo(a) de volta à plataforma EduConnect'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Próxima Live"
          value={nextLive ? format(new Date(nextLive.scheduled_at), 'dd/MM HH:mm') : 'Nenhuma'}
          icon={Video}
          iconColor="text-destructive"
        />
        <StatCard
          title={isTeacher ? 'Entregas para Corrigir' : 'Tarefas Pendentes'}
          value={pendingTasks}
          icon={FileText}
          iconColor="text-primary"
        />
        <StatCard
          title={isTeacher ? 'Alunos Ativos' : 'Sua Média de Notas'}
          value={isTeacher ? studentCount : avgGrade}
          icon={isTeacher ? Users : BarChart}
          iconColor="text-green-500"
        />
      </div>

      {/* Student-specific: progress + ranking */}
      {!isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Progresso nas Aulas</h3>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">{watchedCount} de {lessons.length} aulas</span>
                <span className="font-bold text-primary">{progressPct}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {submissions.filter(s => s.grade !== undefined && s.grade !== null).slice(0, 6).map((s, i) => {
                const task = tasks.find(t => t.id === s.task_id);
                return (
                  <div key={i} className="bg-secondary/60 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{s.grade}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{task?.title || 'Tarefa'}</p>
                  </div>
                );
              })}
            </div>
            {myGrades.length === 0 && <p className="text-sm text-muted-foreground mt-3">Suas notas aparecerão aqui assim que forem lançadas.</p>}
          </div>

          {/* Ranking */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                <h3 className="font-bold text-sm text-foreground">Ranking Geral</h3>
              </div>
              {myRank > 0 && (
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Você: #{myRank}
                </span>
              )}
            </div>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ranking será exibido após as primeiras notas.</p>
            ) : (
              <div className="space-y-2">
                {ranking.map((r, i) => {
                  const isMe = r.email === session?.email;
                  const code = accessCodes.find(c => c.student_email === r.email);
                  const displayName = code?.profile_name || r.name;
                  const avatarColor = code?.profile_avatar_color || '#6366f1';
                  return (
                    <div key={r.email} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary/50'}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-secondary text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                        {displayName?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>{displayName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-bold text-foreground">{r.avg.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Announcements */}
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
        <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-border">Avisos Recentes</h3>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum aviso no momento.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => {
              const Icon = typeIcons[a.type] || Info;
              const color = typeColors[a.type] || typeColors.info;
              return (
                <div key={a.id} className={`flex gap-3 p-4 rounded-xl border ${color}`}>
                  <Icon size={20} className="shrink-0 mt-0.5" />
                  <div>
                    {a.title && <p className="font-semibold text-sm mb-1">{a.title}</p>}
                    <p className="text-sm">{a.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}