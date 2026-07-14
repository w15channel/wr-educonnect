import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const badgeStorageKey = (email, course, path) => `wr_sidebar_seen_${course || 'tcc'}_${email || 'guest'}_${path}`;
const getSeenAt = (email, course, path) => {
  if (typeof localStorage === 'undefined') return 0;
  const raw = localStorage.getItem(badgeStorageKey(email, course, path));
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};
const setSeenNow = (email, course, path) => {
  if (typeof localStorage === 'undefined' || !email) return;
  localStorage.setItem(badgeStorageKey(email, course, path), String(Date.now()));
};
const itemTime = (item) => new Date(item?.created_date || item?.submitted_at || item?.updated_date || item?.due_date || 0).getTime() || 0;
const countNewSince = (items = [], seenAt = 0, ownEmail = '') => items.filter(item => itemTime(item) > seenAt && item.author_email !== ownEmail).length;
const capBadge = (count) => count > 99 ? '99+' : String(count);

// Funções auxiliares para verificar disponibilidade
const isTaskAvailable = (task, moduleUnlocked = []) =>
  !task.module_number || moduleUnlocked[Number(task.module_number) - 1];

const getUnlockedLessonCount = (rules = []) => {
  const lessonUnlockRule = rules.find((r) => r.scope === 'lessons');
  return Math.max(10, Number(lessonUnlockRule?.unlock_until || 10));
};

export default function Sidebar() {
  const { user: session } = useOutletContext() || {};
  const { logout } = useCustomAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState({});

  const isAdmin = session?.role === 'admin';
  const userCourse = session?.course || 'tcc';
  const studentEmail = session?.email || '';
  const base = isAdmin ? '/adm' : '/student';

  // Sincroniza com localStorage
  useEffect(() => {
    const current = location.pathname.replace(base, '') || '/dashboard';
    if (studentEmail && userCourse) {
      setSeenNow(studentEmail, userCourse, current);
    }
  }, [location.pathname, base, studentEmail, userCourse]);

  // Todos os queries necessários para badges
  const { data: lessons = [] } = useQuery({
    queryKey: ['sidebar-lessons', userCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 300),
    enabled: !isAdmin && !!userCourse,
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ['sidebar-lesson-progress', studentEmail],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: studentEmail }, '-created_date', 500),
    enabled: !isAdmin && !!studentEmail,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['sidebar-tasks', userCourse],
    queryFn: () => base44.entities.Task.filter({ course: userCourse }, '-created_date', 300),
    enabled: !isAdmin && !!userCourse,
  });

  const { data: taskSubmissions = [] } = useQuery({
    queryKey: ['sidebar-task-submissions', studentEmail, userCourse],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: studentEmail, course: userCourse }, '-created_date', 500),
    enabled: !isAdmin && !!studentEmail && !!userCourse,
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['sidebar-exams', userCourse],
    queryFn: () => base44.entities.Exam.filter({ course: userCourse, is_published: true }, '-created_date', 300),
    enabled: !isAdmin && !!userCourse,
  });

  const { data: examSubmissions = [] } = useQuery({
    queryKey: ['sidebar-exam-submissions', studentEmail, userCourse],
    queryFn: () => base44.entities.ExamSubmission.filter({ student_email: studentEmail, course: userCourse }, '-submitted_at', 500),
    enabled: !isAdmin && !!studentEmail && !!userCourse,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['sidebar-daily-challenge', userCourse],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse, date: new Date().toISOString().slice(0, 10) }, '-created_date', 5),
    enabled: !isAdmin && !!userCourse,
  });

  const { data: challengeResponses = [] } = useQuery({
    queryKey: ['sidebar-challenge-response', studentEmail, userCourse],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ student_email: studentEmail, course: userCourse, date: new Date().toISOString().slice(0, 10) }, '-created_date', 5),
    enabled: !isAdmin && !!studentEmail && !!userCourse,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['sidebar-chat-messages', userCourse],
    queryFn: () => base44.functions.invoke('saveStudentRecord', { action: 'listChatMessages', session_id: `class-${userCourse}` }).then(res => res?.data?.records || res?.data || []),
    enabled: !isAdmin && !!userCourse,
  });

  const { data: forumPosts = [] } = useQuery({ queryKey: ['sidebar-forum-posts', userCourse], queryFn: () => base44.entities.ForumPost.filter({ course: userCourse, space: 'forum' }, '-created_date', 300), enabled: !isAdmin && !!userCourse });
  const { data: forumReplies = [] } = useQuery({ queryKey: ['sidebar-forum-replies', userCourse], queryFn: () => base44.entities.ForumReply.filter({ course: userCourse, space: 'forum' }, '-created_date', 300), enabled: !isAdmin && !!userCourse });
  const { data: debatePosts = [] } = useQuery({ queryKey: ['sidebar-debate-posts', userCourse], queryFn: () => base44.entities.ForumPost.filter({ course: userCourse, space: 'debates' }, '-created_date', 300), enabled: !isAdmin && !!userCourse });
  const { data: debateReplies = [] } = useQuery({ queryKey: ['sidebar-debate-replies', userCourse], queryFn: () => base44.entities.ForumReply.filter({ course: userCourse, space: 'debates' }, '-created_date', 300), enabled: !isAdmin && !!userCourse });
  const { data: pairings = [] } = useQuery({ queryKey: ['sidebar-therapist-pairings', studentEmail], queryFn: () => base44.entities.TherapistPairing.filter({ therapist_email: studentEmail }, '-created_date', 300), enabled: !isAdmin && !!studentEmail });
  const { data: announcements = [] } = useQuery({ queryKey: ['sidebar-announcements', userCourse, studentEmail], queryFn: async () => base44.entities.Announcement.filter({ course: userCourse, type: { not: 'unlock_rule' } }, '-created_date', 300), enabled: !isAdmin && !!studentEmail, refetchInterval: 30000 });
  const { data: tuitions = [] } = useQuery({ queryKey: ['sidebar-tuitions', studentEmail], queryFn: () => base44.entities.Tuition.filter({ student_email: studentEmail }, '-due_date', 100), enabled: !isAdmin && !!studentEmail, refetchInterval: 60000 });
  const { data: unlockRules = [] } = useQuery({ queryKey: ['unlock-rules', userCourse], queryFn: () => base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20), enabled: !isAdmin && !!userCourse });

  // ✅ CORREÇÃO: Query para status de desbloqueio de módulos
  const { data: moduleUnlocksData = {} } = useQuery({
    queryKey: ['module-unlocks', studentEmail, userCourse],
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('getModuleUnlockStatus', {
          student_email: studentEmail,
          course: userCourse,
        });
        return result?.data || {};
      } catch {
        return {};
      }
    },
    enabled: !isAdmin && !!studentEmail && !!userCourse,
  });

  const moduleUnlocked = moduleUnlocksData?.module_unlock || [];

  // ✅ CORREÇÃO: Calcular badges com validação de disponibilidade
  const studentBadges = useMemo(() => {
    if (isAdmin || !studentEmail) return {};

    const lessonDone = new Set(lessonProgress.filter(p => p.watched).map(p => p.lesson_id));
    const unlockedLessonCount = getUnlockedLessonCount(unlockRules);
    const availableLessons = lessons.slice(0, unlockedLessonCount);
    const unwatchedAvailableLessons = availableLessons.filter(l => !lessonDone.has(l.id));

    const submittedTasks = new Set(taskSubmissions.map(s => s.task_id));
    // ✅ CORREÇÃO PRINCIPAL: Filtrar apenas tarefas DISPONÍVEIS
    const availableTasks = tasks.filter(t => isTaskAvailable(t, moduleUnlocked));
    const pendingAvailableTasks = availableTasks.filter(t => !submittedTasks.has(t.id));

    const submittedExams = new Set(examSubmissions.map(s => s.exam_id));
    const pendingExams = exams.filter(e => !submittedExams.has(e.id));

    const latestChallenge = challenges[0];
    const response = latestChallenge && challengeResponses.find(r => r.challenge_id === latestChallenge.id);
    const challengeTotal = latestChallenge?.questions?.length || 8;
    const activeTherapistPending = pairings.filter(p => !p.therapist_submitted).length;
    const tuitionsPending = tuitions.filter(t => t.status !== 'paid').length;
    const tuitionsNew = countNewSince(tuitions, getSeenAt(studentEmail, userCourse, '/tuitions'), studentEmail);

    return {
      '/ofensivas': latestChallenge && (!response || (Number(response.questions_answered) || 0) < challengeTotal) ? 1 : 0,
      '/lessons': unwatchedAvailableLessons.length, // ✅ APENAS lições disponíveis
      '/tasks': pendingAvailableTasks.length, // ✅ APENAS tarefas disponíveis
      '/exams': pendingExams.length,
      '/chat': countNewSince(chatMessages, getSeenAt(studentEmail, userCourse, '/chat'), studentEmail),
      '/forum': countNewSince([...forumPosts, ...forumReplies], getSeenAt(studentEmail, userCourse, '/forum'), studentEmail),
      '/debates': countNewSince([...debatePosts, ...debateReplies], getSeenAt(studentEmail, userCourse, '/debates'), studentEmail),
      '/terapeuta': activeTherapistPending,
      '/announcements': countNewSince(announcements, getSeenAt(studentEmail, userCourse, '/announcements'), studentEmail),
      '/tuitions': tuitionsNew > 0 ? tuitionsNew : (tuitionsPending > 0 ? 1 : 0),
    };
  }, [lessonProgress, lessons, taskSubmissions, tasks, examSubmissions, exams, challenges, challengeResponses, pairings, tuitions, chatMessages, forumPosts, forumReplies, debatePosts, debateReplies, announcements, studentEmail, userCourse, isAdmin, unlockRules, moduleUnlocked]);

  const sections = isAdmin
    ? [
        {
          label: 'Gestão',
          items: [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Alunos', path: '/students' },
            { label: 'Aulas', path: '/lessons' },
            { label: 'Sala ao Vivo', path: '/live' },
            { label: 'Tarefas', path: '/tasks' },
            { label: 'Provas', path: '/exams' },
            { label: 'Apostila', path: '/apostila' },
            { label: 'Controle de Pontuação', path: '/scorecontrol' },
            { label: 'Avisos', path: '/announcements' },
            { label: 'Notificações', path: '/notifications' },
            { label: 'Mensalidades', path: '/tuitions' },
          ],
        },
      ]
    : [
        {
          label: 'Formação',
          items: [
            { label: 'Dashboard', path: '/dashboard', badge: 0 },
            { label: 'Aulas', path: '/lessons', badge: studentBadges['/lessons'] },
            { label: 'Sala ao Vivo', path: '/live', badge: 0 },
            { label: 'Tarefas', path: '/tasks', badge: studentBadges['/tasks'] },
            { label: 'Provas', path: '/exams', badge: studentBadges['/exams'] },
            { label: 'Apostila', path: '/apostila', badge: 0 },
            { label: 'Ofensivas', path: '/ofensivas', badge: studentBadges['/ofensivas'] },
          ],
        },
        {
          label: 'Comunidade',
          items: [
            { label: 'Chat da Turma', path: '/chat', badge: studentBadges['/chat'] },
            { label: 'Fórum', path: '/forum', badge: studentBadges['/forum'] },
            { label: 'Debates', path: '/debates', badge: studentBadges['/debates'] },
            { label: 'Terapeuta da Semana', path: '/terapeuta', badge: studentBadges['/terapeuta'] },
            { label: 'Tutor Digital', path: '/tutor-digital', badge: 0 },
          ],
        },
        {
          label: 'Pessoal',
          items: [
            { label: 'Avisos', path: '/announcements', badge: studentBadges['/announcements'] },
            { label: 'Mensalidades', path: '/tuitions', badge: studentBadges['/tuitions'] },
          ],
        },
      ];

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <img src={WR_PRIMARY_LOGO} alt="logo" className="w-5 h-5" />
          <span className="text-xs font-bold text-foreground tracking-wider uppercase">{BRAND_SHORT_NAME}</span>
        </div>
        <p className="text-xs font-medium text-muted-foreground truncate">{session?.name}</p>
        <p className="text-[10px] text-muted-foreground truncate mt-1">{session?.email}</p>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [sectionIdx]: !prev[sectionIdx] }))}
              className="w-full px-4 py-2.5 flex items-center justify-between border-b border-border/50 hover:bg-secondary/50 transition-colors"
            >
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{section.label}</span>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${ expanded[sectionIdx] ? 'rotate-180' : '' }`} />
            </button>
            {expanded[sectionIdx] && (
              <div className="space-y-0.5 py-2">
                {section.items.map((item, itemIdx) => (
                  <a
                    key={itemIdx}
                    href={`${base}${item.path}`}
                    onClick={(e) => {
                      if (studentEmail && userCourse) {
                        setSeenNow(studentEmail, userCourse, item.path);
                      }
                    }}
                    className={`mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${
                      location.pathname.includes(item.path.split('/')[1])
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{capBadge(item.badge)}</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-1">
        <a href={`${base}/settings`} className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2">
          <Settings size={14} />
          <span>Configurações</span>
        </a>
        <button
          onClick={logout}
          className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
        >
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}