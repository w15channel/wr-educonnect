import React from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, FileText, ClipboardList, Circle, ArrowRight, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const extractSequenceNumber = (item = {}) => {
  const direct = Number(item.order ?? item.sequence);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const title = item.title || '';
  const match = title.match(/(?:aula|tarefa)\s*(\d{1,2})\b|\b(\d{1,2})\b/i);
  const parsed = Number(match?.[1] || match?.[2]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const sortBySeq = (items = []) => [...items].sort((a, b) => {
  const an = extractSequenceNumber(a), bn = extractSequenceNumber(b);
  if (an !== null && bn !== null) return an - bn;
  if (an !== null) return -1;
  if (bn !== null) return 1;
  return (a.created_date || '').localeCompare(b.created_date || '');
});

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  // /degree/student/:slug
  if (parts[0] === 'degree' && parts[1] === 'student' && parts[2]) return `/${parts[0]}/${parts[1]}/${parts[2]}`;
  return '';
}

export default function DiplomaDashboard() {
  const ctx = useOutletContext();
  const session = ctx?.user;
  const userCourse = ctx?.course || session?.course;
  const navigate = useNavigate();
  const prefix = useScopedPrefix();
  const scoped = (p) => prefix + p;

  const firstName = (session?.name || 'Estudante').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons-diploma', userCourse],
    queryFn: () => userCourse
      ? base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 200)
      : base44.entities.RecordedLesson.list('order', 200),
  });

  const { data: progresses = [] } = useQuery({
    queryKey: ['progress-diploma', session?.email],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: session?.email }, '-created_date', 200),
    enabled: !!session?.email,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-diploma', userCourse],
    queryFn: () => userCourse
      ? base44.entities.Task.filter({ course: userCourse }, '-created_date', 200)
      : base44.entities.Task.list('-created_date', 200),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-diploma', session?.email],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: session?.email || '' }, '-created_date', 200),
    enabled: !!session?.email,
  });

  const watchedCount = progresses.filter(p => p.watched).length;
  const progressPct = lessons.length > 0 ? Math.round((watchedCount / lessons.length) * 100) : 0;

  const unwatchedLessons = sortBySeq(lessons.filter(l => !progresses.find(p => p.lesson_id === l.id && p.watched)));
  const pendingUploadTasks = sortBySeq(tasks.filter(t => t.type === 'upload' && !submissions.find(s => s.task_id === t.id)));
  const pendingQuizzes = tasks.filter(t => t.type === 'quiz' && !submissions.find(s => s.task_id === t.id));

  const visibleLessons = unwatchedLessons.slice(0, 3);
  const visibleTasks = pendingUploadTasks.slice(0, 3);

  const totalPending = unwatchedLessons.length + pendingUploadTasks.length + pendingQuizzes.length;

  return (
    <div className="app-page app-page--narrow space-y-5 animate-fade-in-up pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })} · Modalidade Diploma
        </p>
      </div>

      {/* Progresso */}
      <div
        onClick={() => navigate(scoped('/lessons'))}
        className="cursor-pointer bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <BookOpen size={16} className="text-purple-600" />
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
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate(scoped('/lessons'))}
          className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1 hover:border-purple-300 transition-all text-center"
        >
          <BookOpen size={20} className="text-purple-500" />
          <p className="text-xl font-black text-foreground">{unwatchedLessons.length}</p>
          <p className="text-[10px] text-muted-foreground">Aulas pendentes</p>
        </button>
        <button
          onClick={() => navigate(scoped('/tasks'))}
          className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1 hover:border-orange-300 transition-all text-center"
        >
          <FileText size={20} className="text-orange-500" />
          <p className="text-xl font-black text-foreground">{pendingUploadTasks.length}</p>
          <p className="text-[10px] text-muted-foreground">Tarefas pendentes</p>
        </button>
        <button
          onClick={() => navigate(scoped('/tasks'))}
          className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1 hover:border-violet-300 transition-all text-center"
        >
          <GraduationCap size={20} className="text-violet-500" />
          <p className="text-xl font-black text-foreground">{pendingQuizzes.length}</p>
          <p className="text-[10px] text-muted-foreground">Provas pendentes</p>
        </button>
      </div>

      {/* Pendências */}
      {totalPending > 0 && (
        <div className="bg-card rounded-xl border border-orange-200 p-5">
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
            {/* Aulas */}
            {visibleLessons.map(l => (
              <button key={l.id} onClick={() => navigate(scoped('/lessons'))}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors text-left">
                <Circle size={13} className="text-purple-400 shrink-0" />
                <BookOpen size={13} className="text-purple-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-purple-700 truncate">
                    {extractSequenceNumber(l) ? `Aula ${extractSequenceNumber(l)} · ` : ''}{l.title}
                  </p>
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

            {/* Tarefas */}
            {visibleTasks.map(t => (
              <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors text-left">
                <ClipboardList size={13} className="text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-orange-700 truncate">
                    {extractSequenceNumber(t) ? `Tarefa ${extractSequenceNumber(t)} · ` : ''}{t.title}
                  </p>
                  <p className="text-[10px] text-orange-500">
                    Tarefa pendente{t.deadline ? ` · Entrega: ${format(new Date(t.deadline), 'dd/MM HH:mm')}` : ''}
                  </p>
                </div>
                <ArrowRight size={12} className="text-orange-400 shrink-0" />
              </button>
            ))}
            {pendingUploadTasks.length > 3 && (
              <button onClick={() => navigate(scoped('/tasks'))} className="w-full text-xs text-orange-600 font-semibold py-1 hover:underline">
                +{pendingUploadTasks.length - 3} tarefas pendentes → Ver todas
              </button>
            )}

            {/* Provas */}
            {pendingQuizzes.slice(0, 3).map(t => (
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
            {pendingQuizzes.length > 3 && (
              <button onClick={() => navigate(scoped('/tasks'))} className="w-full text-xs text-violet-600 font-semibold py-1 hover:underline">
                +{pendingQuizzes.length - 3} provas pendentes → Ver todas
              </button>
            )}
          </div>
        </div>
      )}

      {totalPending === 0 && (
        <div className="bg-card rounded-xl border border-green-200 p-8 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-foreground">Tudo em dia!</p>
          <p className="text-sm text-muted-foreground mt-1">Nenhuma pendência no momento. Continue assim!</p>
        </div>
      )}
    </div>
  );
}