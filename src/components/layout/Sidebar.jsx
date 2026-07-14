import { useEffect, useMemo } from 'react';
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Menu,
  BookOpen,
  Play,
  Video,
  FileText,
  ClipboardList,
  Award,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Bell,
  Flame,
  Heart,
  UsersRound,
  BarChart3,
  GraduationCap,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';


const STUDENT_BADGE_PATHS = new Set(['/ofensivas', '/lessons', '/tasks', '/exams', '/chat', '/forum', '/debates', '/terapeuta', '/announcements', '/tuitions']);
const VIEW_BADGE_PATHS = new Set(['/chat', '/forum', '/debates', '/announcements', '/tuitions']);
const badgeStorageKey = (email, course, path) => `wr_sidebar_seen_${course || 'tcc'}_${email || 'guest'}_${path}`;
const getSeenAt = (email, course, path) => {
  if (typeof localStorage === 'undefined') return 0;
  const raw = localStorage.getItem(badgeStorageKey(email, course, path));
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};
const setSeenNow = (email, course, path) => {
  if (typeof localStorage === 'undefined' || !email || !VIEW_BADGE_PATHS.has(path)) return;
  localStorage.setItem(badgeStorageKey(email, course, path), String(Date.now()));
};
const itemTime = (item) => new Date(item?.created_date || item?.submitted_at || item?.updated_date || item?.due_date || 0).getTime() || 0;
const countNewSince = (items = [], seenAt = 0, ownEmail = '') => items.filter(item => itemTime(item) > seenAt && item.author_email !== ownEmail).length;
const capBadge = (count) => count > 99 ? '99+' : String(count);

// Função para verificar se tarefa está disponível (mesmo que Dashboard.jsx)
const isTaskAvailable = (task, moduleUnlocked = []) =>
  !task.module_number || moduleUnlocked[Number(task.module_number) - 1];

const getUnlockedLessonCount = (rules = []) => {
  const lessonUnlockRule = rules.find((r) => r.scope === 'lessons');
  return Math.max(10, Number(lessonUnlockRule?.unlock_until || 10));
};

// ── Nav groups
// Note: Chat da Turma ↔ Sala de Debates ícones trocados conforme solicitado
const adminGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3,     label: 'Dashboard',              path: '/dashboard',         color: 'text-blue-400' },
      { icon: Play,          label: 'Aulas',                  path: '/lessons',           color: 'text-purple-400' },
      { icon: Video,         label: 'Sala ao Vivo',           path: '/live',              color: 'text-red-400' },
      { icon: FileText,      label: 'Tarefas',                path: '/tasks',             color: 'text-orange-400' },
      { icon: ClipboardList, label: 'Provas',                 path: '/exams',             color: 'text-violet-400' },
      { icon: BookOpen,      label: 'Apostila',               path: '/apostila',          color: 'text-emerald-400' },
      { icon: Flame,         label: 'Ofensivas',              path: '/ofensivas',         color: 'text-orange-500' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: UsersRound,    label: 'Chat da Turma',          path: '/chat',              color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas',       path: '/forum',             color: 'text-green-400' },
      { icon: Users,         label: 'Sala de Debates',        path: '/debates',           color: 'text-pink-400' },
      { icon: Heart,         label: 'Terapeuta da Semana',    path: '/terapeuta',         color: 'text-pink-500' },
      { icon: Award,         label: 'Tutor Digital',          path: '/tutor-digital',     color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { icon: Bell,          label: 'Avisos',                 path: '/announcements',     color: 'text-blue-500' },
      { icon: Award,         label: 'Mensalidades',           path: '/tuitions',          color: 'text-amber-500' },
      { icon: Settings,      label: 'Configurações',          path: '/settings',          color: 'text-slate-400' },
    ],
  },
];

const studentGroups = [
  {
    label: 'Formação',
    items: [
      { icon: Play,          label: 'Aulas',                  path: '/lessons',           color: 'text-purple-400' },
      { icon: Video,         label: 'Sala ao Vivo',           path: '/live',              color: 'text-red-400' },
      { icon: FileText,      label: 'Tarefas',                path: '/tasks',             color: 'text-orange-400' },
      { icon: ClipboardList, label: 'Provas',                 path: '/exams',             color: 'text-violet-400' },
      { icon: BookOpen,      label: 'Apostila',               path: '/apostila',          color: 'text-emerald-400' },
      { icon: Flame,         label: 'Ofensivas',              path: '/ofensivas',         color: 'text-orange-500' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: UsersRound,    label: 'Chat da Turma',          path: '/chat',              color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas',       path: '/forum',             color: 'text-green-400' },
      { icon: Users,         label: 'Sala de Debates',        path: '/debates',           color: 'text-pink-400' },
      { icon: Heart,         label: 'Terapeuta da Semana',    path: '/terapeuta',         color: 'text-pink-500' },
      { icon: Award,         label: 'Tutor Digital',          path: '/tutor-digital',     color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Pessoal',
    items: [
      { icon: Bell,          label: 'Avisos',                 path: '/announcements',     color: 'text-blue-500' },
      { icon: Award,         label: 'Mensalidades',           path: '/tuitions',          color: 'text-amber-500' },
      { icon: Settings,      label: 'Configurações',          path: '/settings',          color: 'text-slate-400' },
    ],
  },
];

export default function Sidebar({ session, mobileOpen: mobileOpenProp, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useCustomAuth();
  const isAdmin = session?.role === 'admin';
  const base = isAdmin ? '/adm' : '/student';
  const userCourse = session?.course || 'tcc';
  const studentEmail = session?.email || '';
  const groups = isAdmin ? adminGroups : studentGroups;

  // Keep localStorage timestamp synced
  useEffect(() => {
    const current = location.pathname.replace(base, '') || '/dashboard';
    setSeenNow(studentEmail, userCourse, current);
  }, [base, isAdmin, location.pathname, studentEmail, userCourse]);

  // All queries needed for badge counts
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

  const { data: announcements = [] } = useQuery({
    queryKey: ['sidebar-announcements', userCourse, studentEmail],
    queryFn: async () => {
      const records = await base44.entities.Announcement.filter({ course: userCourse, type: { not: 'unlock_rule' } }, '-created_date', 300);
      return records;
    },
    enabled: !isAdmin && !!studentEmail,
    refetchInterval: 30000
  });

  const { data: tuitions = [] } = useQuery({ queryKey: ['sidebar-tuitions', studentEmail], queryFn: () => base44.entities.Tuition.filter({ student_email: studentEmail }, '-due_date', 100), enabled: !isAdmin && !!studentEmail, refetchInterval: 60000 });

  const { data: unlockRules = [] } = useQuery({
    queryKey: ['unlock-rules', userCourse],
    queryFn: () => base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20),
    enabled: !isAdmin && !!userCourse,
  });

  // ✅ CORREÇÃO: Adicionar lógica de module unlock para calcular tarefas disponíveis
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
    const unavailableLessons = lessons.slice(unlockedLessonCount);
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

  const totalNotifications = Object.values(studentBadges).reduce((sum, v) => sum + (v || 0), 0);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 border border-[#d4b96a] flex items-center justify-center rounded-lg">
              <img src={WR_PRIMARY_LOGO} className="w-5 h-5 object-contain" alt="logo" />
            </div>
            <div>
              <p className="text-xs font-light tracking-widest uppercase text-[#d4b96a]">{BRAND_SHORT_NAME}</p>
              <p className="text-[9px] font-light tracking-widest uppercase text-white/30">Plataforma</p>
            </div>
          </div>
          <p className="text-xs font-light text-white/60 leading-snug">{session?.name}</p>
          <p className="text-[9px] font-light text-white/30 uppercase tracking-widest mt-1">{session?.email}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-8 px-3 py-6 scrollbar-invisible">
          {groups.map((group, i) => (
            <div key={i} className="space-y-1.5">
              <p className="px-3 text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-2">{group.label}</p>
              {group.items.map((item, j) => {
                const Icon = item.icon;
                const badge = studentBadges[item.path] || 0;
                const isActive = location.pathname.includes(item.path.split('/')[1]);
                return (
                  <button
                    key={j}
                    onClick={() => {
                      navigate(base + item.path);
                      setSeenNow(studentEmail, userCourse, item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-light transition-all ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <Icon size={15} />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && STUDENT_BADGE_PATHS.has(item.path) && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{capBadge(badge)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-3 py-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-light text-white/50 hover:text-white/70 transition-all"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all ${
          mobileOpenProp ? 'bg-black/60 backdrop-blur-sm' : 'pointer-events-none bg-transparent'
        }`}
        onClick={onMobileClose}
      >
        <div
          className={`absolute left-0 top-0 h-full w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col ${
            mobileOpenProp ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 border border-[#d4b96a] flex items-center justify-center rounded-lg">
                <img src={WR_PRIMARY_LOGO} className="w-5 h-5 object-contain" alt="logo" />
              </div>
              <div>
                <p className="text-xs font-light tracking-widest uppercase text-[#d4b96a]">{BRAND_SHORT_NAME}</p>
                <p className="text-[9px] font-light tracking-widest uppercase text-white/30">Plataforma</p>
              </div>
            </div>
            <p className="text-xs font-light text-white/60 leading-snug truncate">{session?.name}</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-6 px-2 py-4 scrollbar-invisible">
            {groups.map((group, i) => (
              <div key={i} className="space-y-1.5">
                <p className="px-3 text-[10px] font-light uppercase tracking-[0.2em] text-white/40">{group.label}</p>
                {group.items.map((item, j) => {
                  const Icon = item.icon;
                  const badge = studentBadges[item.path] || 0;
                  const isActive = location.pathname.includes(item.path.split('/')[1]);
                  return (
                    <button
                      key={j}
                      onClick={() => {
                        navigate(base + item.path);
                        setSeenNow(studentEmail, userCourse, item.path);
                        onMobileClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-light transition-all ${
                        isActive ? 'bg-white/10 text-white' : 'text-white/50 active:text-white/70'
                      }`}
                    >
                      <Icon size={15} />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && STUDENT_BADGE_PATHS.has(item.path) && (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{capBadge(badge)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-2 py-4">
            <button
              onClick={() => {
                logout();
                onMobileClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-light text-white/50 hover:text-white/70 transition-all"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}