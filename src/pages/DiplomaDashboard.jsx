import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, FileText, ClipboardList, Circle, ArrowRight, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';

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

const getUnlockedLessonCount = (rules = []) => {
  const lessonUnlockRule = rules.find((r) => r.scope === 'lessons');
  return Math.max(10, Number(lessonUnlockRule?.unlock_until || 10));
};

const isTaskAvailable = (task, moduleUnlocked = []) =>
  !task.module_number || moduleUnlocked[Number(task.module_number) - 1];

function useScopedPrefix() {
  // Diploma routes are always under /degree/student/*
  return '/degree/student';
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

  const { data: unlockRules = [] } = useQuery({
    queryKey: ['unlock-rules-lessons-diploma', userCourse],
    queryFn: () => userCourse
      ? base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20)
      : base44.entities.Announcement.filter({ type: 'unlock_rule' }, '-updated_date', 20),
  });

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

  const { moduleUnlocked } = useApostilaModuleUnlocks(userCourse, session);

  const visibleLessonsAll = lessons.filter(l => !l.is_hidden);
  const visibleTasksAll = tasks.filter(t => !t.is_hidden);

  const watchedCount = progresses.filter(p => p.watched).length;
  const progressPct = visibleLessonsAll.length > 0 ? Math.round((watchedCount / visibleLessonsAll.length) * 100) : 0;

  const unlockedLessonCount = getUnlockedLessonCount(unlockRules);
  const availableLessons = sortBySeq(visibleLessonsAll).slice(0, unlockedLessonCount);
  const unwatchedLessons = sortBySeq(availableLessons.filter(l => !progresses.find(p => p.lesson_id === l.id && p.watched)));
  const pendingUploadTasks = sortBySeq(visibleTasksAll.filter(t => t.type === 'upload' && isTaskAvailable(t, moduleUnlocked) && !submissions.find(s => s.task_id === t.id)));
  const pendingQuizzes = visibleTasksAll.filter(t => t.type === 'quiz' && isTaskAvailable(t, moduleUnlocked) && !submissions.find(s => s.task_id === t.id));

  const visibleLessons = unwatchedLessons.slice(0, 1);
  const visibleTasks = pendingUploadTasks.slice(0, 1);

  const totalPending = Math.min(unwatchedLessons.length, 1) + Math.min(pendingUploadTasks.length, 1) + Math.min(pendingQuizzes.length, 1);

  return (
    <div className="app-page app-page--narrow space-y-5 animate-fade-in-up pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })} · Modalidade Certificado
        </p>
      </div>

      {/* Progresso */}
      <div
        onClick={() => navigate(scoped('/lessons'))}
        className="cursor-pointer bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Progresso nas Aulas</h3>
              <p className="text-xs text-muted-foreground">{watchedCount} de {visibleLessonsAll.length} concluídas</p>
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
          className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1 hover:border-primary transition-all text-center"
        >
          <BookOpen size={20} className="text-primary" />
          <p className="text-xl font-black text-foreground">{unwatchedLessons.length}</p>
          <p className="text-[10px] text-muted-foreground">Aulas pendentes</p>
        </button>
        <button
          onClick={() => navigate(scoped('/tasks'))}
          className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1 hover:border-primary transition-all text-center"
        >
          <FileText size={20} className="text-primary" />
          <p className="text-xl font-black text-foreground">{pendingUploadTasks.length}</p>
          <p className="text-[10px] text-muted-foreground">Tarefas pendentes</p>
        </button>
        <button
          onClick={() => navigate(scoped('/tasks'))}
          className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-1 hover:border-primary transition-all text-center"
        >
          <GraduationCap size={20} className="text-primary" />
          <p className="text-xl font-black text-foreground">{pendingQuizzes.length}</p>
          <p className="text-[10px] text-muted-foreground">Provas pendentes</p>
        </button>
      </div>

      {/* Pendências */}
      {totalPending > 0 && (
        <div className="bg-card rounded-xl border border-primary p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <ClipboardList size={16} className="text-primary" />
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
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-accent border border-primary hover:bg-accent transition-colors text-left">
                <Circle size={13} className="text-primary shrink-0" />
                <BookOpen size={13} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary truncate">
                    {extractSequenceNumber(l) ? `Aula ${extractSequenceNumber(l)} · ` : ''}{l.title}
                  </p>
                  <p className="text-[10px] text-primary">Aula não assistida</p>
                </div>
                <ArrowRight size={12} className="text-primary shrink-0" />
              </button>
            ))}
            {unwatchedLessons.length > visibleLessons.length && (
              <button onClick={() => navigate(scoped('/lessons'))} className="w-full text-xs text-primary font-semibold py-1 hover:underline">
                +{unwatchedLessons.length - visibleLessons.length} aulas no aguardo → Ver todas
              </button>
            )}

            {/* Tarefas */}
            {visibleTasks.map(t => (
              <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-accent border border-primary hover:bg-accent transition-colors text-left">
                <ClipboardList size={13} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary truncate">
                    {extractSequenceNumber(t) ? `Tarefa ${extractSequenceNumber(t)} · ` : ''}{t.title}
                  </p>
                  <p className="text-[10px] text-primary">
                    Tarefa pendente{t.deadline ? ` · Entrega: ${format(new Date(t.deadline), 'dd/MM HH:mm')}` : ''}
                  </p>
                </div>
                <ArrowRight size={12} className="text-primary shrink-0" />
              </button>
            ))}
            {pendingUploadTasks.length > visibleTasks.length && (
              <button onClick={() => navigate(scoped('/tasks'))} className="w-full text-xs text-primary font-semibold py-1 hover:underline">
                +{pendingUploadTasks.length - visibleTasks.length} tarefas no aguardo → Ver todas
              </button>
            )}

            {/* Provas */}
            {pendingQuizzes.slice(0, 1).map(t => (
              <button key={t.id} onClick={() => navigate(scoped('/tasks'))}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-accent border border-primary hover:bg-accent transition-colors text-left">
                <GraduationCap size={13} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary truncate">{t.title}</p>
                  <p className="text-[10px] text-primary">
                    Prova pendente{t.deadline ? ` · Entrega: ${format(new Date(t.deadline), 'dd/MM HH:mm')}` : ''}
                  </p>
                </div>
                <ArrowRight size={12} className="text-primary shrink-0" />
              </button>
            ))}
            {pendingQuizzes.length > 1 && (
              <button onClick={() => navigate(scoped('/tasks'))} className="w-full text-xs text-primary font-semibold py-1 hover:underline">
                +{pendingQuizzes.length - 1} provas no aguardo → Ver todas
              </button>
            )}
          </div>
        </div>
      )}

      {totalPending === 0 && (
        <div className="bg-card rounded-xl border border-primary p-8 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-foreground">Tudo em dia!</p>
          <p className="text-sm text-muted-foreground mt-1">Nenhuma pendência no momento. Continue assim!</p>
        </div>
      )}
    </div>
  );
}