import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Video, FileText, BarChart, Users, AlertCircle, Info, Bell } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useOutletContext();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 50),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.TaskSubmission.filter(
      isTeacher ? {} : { student_email: user?.email },
      '-created_date', 50
    ),
    enabled: !!user,
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 5),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 5),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isTeacher,
  });

  const pendingTasks = isTeacher
    ? submissions.filter(s => s.status === 'submitted').length
    : tasks.filter(t => !submissions.find(s => s.task_id === t.id)).length;

  const nextLive = liveSessions.find(s => s.status === 'scheduled' || s.status === 'live');
  const studentCount = allUsers.filter(u => u.role === 'student' || (!u.role)).length;

  const avgGrade = submissions.length > 0
    ? (submissions.filter(s => s.grade).reduce((sum, s) => sum + (s.grade || 0), 0) / 
       Math.max(submissions.filter(s => s.grade).length, 1)).toFixed(1)
    : '—';

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
          Olá, {user?.full_name?.split(' ')[0] || 'Usuário'} 👋
        </h2>
        <p className="text-muted-foreground mt-1">Bem-vindo(a) de volta à plataforma EduConnect</p>
      </div>

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
          title={isTeacher ? 'Alunos Ativos' : 'Sua Média Atual'}
          value={isTeacher ? studentCount : avgGrade}
          icon={isTeacher ? Users : BarChart}
          iconColor="text-green-500"
        />
      </div>

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