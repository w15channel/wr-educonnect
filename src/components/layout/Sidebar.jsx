import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { applyTheme, getStoredTheme } from '@/components/layout/MobileHeader';

import {
  MessageSquare, FileText,
  BarChart3, Users, LogOut, Play, X, Bell, User, Key,
  CalendarDays, DollarSign, Brain, Sparkles,
  ChevronRight, ChevronDown, Trophy, Award, Crown, Heart, BookOpen, Hash, UsersRound, Flame, GraduationCap,
  ScrollText, ClipboardList, Medal, Star, Moon, Sun, HandHeart
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';


const STUDENT_BADGE_PATHS = new Set(['/ofensivas', '/lessons', '/tasks', '/exams', '/chat', '/forum', '/debates', '/terapeuta', '/announcements', '/tuitions']);
const VIEW_BADGE_PATHS = new Set(['/chat', '/forum', '/debates', '/announcements', '/tuitions']);
const SIDEBAR_STALE_TIME = 60 * 1000;
const SIDEBAR_REFETCH_INTERVAL = 2 * 60 * 1000;
const SIDEBAR_ACTIVITY_REFETCH_INTERVAL = 60 * 1000;
const badgeStorageKey = (email, course, path) => `wr_sidebar_seen_${course || 'tcc'}_${email || 'guest'}_${path}`;
const getBadgeStorage = () => {
  try {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      return null;
    }
    return storage;
  } catch {
    return null;
  }
};
const getSeenAt = (email, course, path) => {
  const storage = getBadgeStorage();
  if (!storage) return 0;
  const raw = storage.getItem(badgeStorageKey(email, course, path));
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};
const setSeenNow = (email, course, path) => {
  const storage = getBadgeStorage();
  if (!storage || !email || !VIEW_BADGE_PATHS.has(path)) return;
  storage.setItem(badgeStorageKey(email, course, path), String(Date.now()));
};
const itemTime = (item) => {
  if (!item || typeof item !== 'object') return 0;
  return new Date(item.created_date || item.submitted_at || item.updated_date || item.due_date || 0).getTime() || 0;
};
const countNewSince = (items = [], seenAt = 0, ownEmail = '') => (
  Array.isArray(items) ? items : []
).filter(item => itemTime(item) > seenAt && (item?.author_email || '') !== ownEmail).length;
const capBadge = (count) => count > 99 ? '99+' : String(count);

// ── Nav groups
// Note: Chat da Turma ↔ Sala de Debates ícones trocados conforme solicitado
const adminGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3,     label: 'Dashboard',              path: '/dashboard',         color: 'text-blue-400' },
      { icon: Play,          label: 'Aulas',                  path: '/lessons',           color: 'text-purple-400' },
      { icon: BookOpen,      label: 'Apostila',               path: '/apostila',          color: 'text-emerald-400' },
      { icon: FileText,      label: 'Tarefas',                path: '/tasks',             color: 'text-orange-400' },
      { icon: ClipboardList, label: 'Provas',                 path: '/exams',             color: 'text-violet-400' },
      { icon: Flame,         label: 'Ofensivas',              path: '/ofensivas',         color: 'text-orange-500' },
      { icon: HandHeart,     label: 'Mentorias',               path: '/practice',          color: 'text-rose-400' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: UsersRound,    label: 'Chat da Turma',          path: '/chat',              color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas',       path: '/forum',             color: 'text-green-400' },
      { icon: Hash,          label: 'Sala de Debates',        path: '/debates',           color: 'text-fuchsia-400' },
      { icon: Heart,         label: 'Terapeuta da Semana',    path: '/terapeuta',         color: 'text-pink-400' },
      { icon: Crown,         label: 'Monitores',              path: '/monitores',         color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { icon: Users,         label: 'Gestão de Alunos',       path: '/students',          color: 'text-indigo-400' },
      { icon: Key,           label: 'Códigos de Acesso',      path: '/keys',              color: 'text-emerald-400' },
      { icon: DollarSign,    label: 'Mensalidades',           path: '/tuitions',          color: 'text-teal-400' },
      { icon: Trophy,        label: 'Controle de Pontuação',  path: '/scorecontrol',      color: 'text-yellow-400' },
      { icon: ScrollText,    label: 'Histórico Acadêmico',    path: '/historico',         color: 'text-cyan-400' },
      { icon: Bell,          label: 'Avisos',                 path: '/announcements',     color: 'text-amber-400' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { icon: Brain,         label: 'Tutor Digital EDU',      path: '/tutor',             color: 'text-pink-400' },
      { icon: CalendarDays,  label: 'Calendário',             path: '/calendar',          color: 'text-cyan-400' },
      { icon: Medal,         label: 'Certificação',           path: '/certificadora',     color: 'text-yellow-400' },
      { icon: Award,         label: 'Gerar Certificado',      path: '/gerar-certificado', color: 'text-amber-300' },
    ],
  },
];

const studentGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3,     label: 'Dashboard',              path: '/dashboard',         color: 'text-blue-400' },
      { icon: Flame,         label: 'Ofensivas',              path: '/ofensivas',         color: 'text-orange-500' },
      { icon: Play,          label: 'Aulas',                  path: '/lessons',           color: 'text-purple-400' },
      { icon: BookOpen,      label: 'Apostila',               path: '/apostila',          color: 'text-teal-400' },
      { icon: FileText,      label: 'Tarefas',                path: '/tasks',             color: 'text-orange-400' },
      { icon: ClipboardList, label: 'Provas',                 path: '/exams',             color: 'text-violet-400' },
      { icon: HandHeart,     label: 'Mentorias',               path: '/practice',          color: 'text-rose-400' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: UsersRound,    label: 'Chat da Turma',          path: '/chat',              color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas',       path: '/forum',             color: 'text-green-400' },
      { icon: Hash,          label: 'Sala de Debates',        path: '/debates',           color: 'text-fuchsia-400' },
      { icon: Heart,         label: 'Terapeuta da Semana',    path: '/terapeuta',         color: 'text-rose-400' },
      { icon: Crown,         label: 'Monitores',              path: '/monitores',         color: 'text-yellow-400' },
      { icon: Star,          label: 'Ranking Geral',          path: '/ranking',           color: 'text-yellow-300' },
      { icon: Users,         label: 'Classe',                 path: '/classe',            color: 'text-sky-400' },
    ],
  },
  {
    label: 'Minha Área',
    items: [
      { icon: Bell,          label: 'Avisos',                 path: '/announcements',     color: 'text-amber-400' },
      { icon: DollarSign,    label: 'Mensalidades',           path: '/tuitions',          color: 'text-teal-400' },
      { icon: CalendarDays,  label: 'Calendário',             path: '/calendar',          color: 'text-cyan-400' },
      { icon: GraduationCap, label: 'Perfil de Estudos',      path: '/study-profile',     color: 'text-violet-400' },
      { icon: User,          label: 'Meu Perfil',             path: '/profile',           color: 'text-indigo-400' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { icon: Brain,         label: 'Tutor Digital EDU',      path: '/tutor',             color: 'text-pink-400' },
      { icon: ScrollText,    label: 'Meu Best Seller',        path: '/bestseller',        color: 'text-emerald-400' },
      { icon: Trophy,        label: 'Histórico Acadêmico',    path: '/historico',         color: 'text-cyan-400' },
      { icon: Medal,         label: 'Certificação',           path: '/certificadora',     color: 'text-yellow-400' },
      { icon: Award,         label: 'Meu Certificado',        path: '/meu-certificado',   color: 'text-amber-400' },
    ],
  },
];

// Determine which groups should start open (if any item is active)
function getInitialOpenGroups(groups, base, pathname) {
  const open = {};
  groups.forEach((g, gi) => {
    if (g.items.some(item => {
      const target = base + item.path;
      return pathname === target || (item.path === '/dashboard' && (pathname === base || pathname === base + '/'));
    })) {
      open[gi] = true;
    }
  });
  return open;
}

export default function Sidebar({ session, mobileOpen: mobileOpenProp, onMobileClose }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useCustomAuth();
  const [theme, setTheme] = useState(() => getStoredTheme());

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  useEffect(() => {
    const syncTheme = (event) => setTheme(event.detail || getStoredTheme());
    window.addEventListener('wr-theme-change', syncTheme);
    return () => window.removeEventListener('wr-theme-change', syncTheme);
  }, []);

  const isAdmin = session?.role === 'admin';
  const base = isAdmin ? '/adm' : '/student';
  const groups = isAdmin ? adminGroups : studentGroups;
  const studentEmail = session?.email || session?.code || '';
  const userCourse = session?.course || 'tcc';
  const today = new Date().toISOString().slice(0, 10);
  const studentQueryEnabled = !isAdmin && !!studentEmail && !!userCourse;
  const queryDefaults = {
    enabled: studentQueryEnabled,
    staleTime: SIDEBAR_STALE_TIME,
    refetchOnWindowFocus: false,
  };

  const { data: lessons = [] } = useQuery({
    queryKey: ['sidebar-lessons', userCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 300),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: lessonProgress = [] } = useQuery({
    queryKey: ['sidebar-lesson-progress', studentEmail],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: studentEmail }, '-created_date', 500),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['sidebar-tasks', userCourse],
    queryFn: () => base44.entities.Task.filter({ course: userCourse }, '-created_date', 300),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: taskSubmissions = [] } = useQuery({
    queryKey: ['sidebar-task-submissions', studentEmail, userCourse],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: studentEmail, course: userCourse }, '-created_date', 500),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: exams = [] } = useQuery({
    queryKey: ['sidebar-exams', userCourse],
    queryFn: () => base44.entities.Exam.filter({ course: userCourse, is_published: true }, '-created_date', 300),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: examSubmissions = [] } = useQuery({
    queryKey: ['sidebar-exam-submissions', studentEmail, userCourse],
    queryFn: () => base44.entities.ExamSubmission.filter({ student_email: studentEmail, course: userCourse }, '-submitted_at', 500),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: challenges = [] } = useQuery({
    queryKey: ['sidebar-daily-challenge', userCourse, today],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: userCourse, date: today }, '-created_date', 5),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: challengeResponses = [] } = useQuery({
    queryKey: ['sidebar-daily-response', studentEmail, userCourse, today],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ student_email: studentEmail, course: userCourse, date: today }, '-created_date', 5),
    ...queryDefaults,
    refetchInterval: SIDEBAR_REFETCH_INTERVAL,
  });
  const { data: chatMessages = [] } = useQuery({
    queryKey: ['sidebar-chat-messages', userCourse],
    queryFn: () => base44.functions.invoke('saveStudentRecord', { action: 'listChatMessages', session_id: `class-${userCourse}` }).then(res => res?.data?.records || res?.data || []),
    ...queryDefaults,
    refetchInterval: SIDEBAR_ACTIVITY_REFETCH_INTERVAL,
  });
  const { data: forumPosts = [] } = useQuery({ queryKey: ['sidebar-forum-posts', userCourse], queryFn: () => base44.entities.ForumPost.filter({ course: userCourse, space: 'forum' }, '-created_date', 100), ...queryDefaults, refetchInterval: SIDEBAR_ACTIVITY_REFETCH_INTERVAL });
  const { data: forumReplies = [] } = useQuery({ queryKey: ['sidebar-forum-replies', userCourse], queryFn: () => base44.entities.ForumReply.filter({ course: userCourse, space: 'forum' }, '-created_date', 300), ...queryDefaults, refetchInterval: SIDEBAR_ACTIVITY_REFETCH_INTERVAL });
  const { data: debatePosts = [] } = useQuery({ queryKey: ['sidebar-debate-posts', userCourse], queryFn: () => base44.entities.ForumPost.filter({ course: userCourse, space: 'debates' }, '-created_date', 100), ...queryDefaults, refetchInterval: SIDEBAR_ACTIVITY_REFETCH_INTERVAL });
  const { data: debateReplies = [] } = useQuery({ queryKey: ['sidebar-debate-replies', userCourse], queryFn: () => base44.entities.ForumReply.filter({ course: userCourse, space: 'debates' }, '-created_date', 300), ...queryDefaults, refetchInterval: SIDEBAR_ACTIVITY_REFETCH_INTERVAL });
  const { data: pairings = [] } = useQuery({ queryKey: ['sidebar-therapist-pairings', studentEmail], queryFn: () => base44.entities.TherapistPairing.filter({ therapist_email: studentEmail }, '-created_date', 20), ...queryDefaults, refetchInterval: SIDEBAR_REFETCH_INTERVAL });
  const { data: announcements = [] } = useQuery({ queryKey: ['sidebar-announcements', userCourse, studentEmail], queryFn: async () => {
    const [courseItems = [], personalItems = []] = await Promise.all([
      base44.entities.Announcement.filter({ course: userCourse }, '-created_date', 100),
      base44.entities.Announcement.filter({ recipient_email: studentEmail }, '-created_date', 100),
    ]);
    return [...courseItems, ...personalItems].filter((item, index, arr) => {
      if (!item || typeof item !== 'object') return false;
      if (typeof item.recipient_email === 'string' && item.recipient_email.length > 0) {
        return item.recipient_email === studentEmail;
      }
      return arr.findIndex(candidate => candidate?.id === item.id) === index;
    });
  }, ...queryDefaults, refetchInterval: SIDEBAR_ACTIVITY_REFETCH_INTERVAL });
  const { data: tuitions = [] } = useQuery({ queryKey: ['sidebar-tuitions', studentEmail], queryFn: () => base44.entities.Tuition.filter({ student_email: studentEmail }, '-due_date', 100), ...queryDefaults, refetchInterval: SIDEBAR_REFETCH_INTERVAL });
  const { moduleUnlocked } = useApostilaModuleUnlocks(userCourse, studentQueryEnabled ? session : null);

  useEffect(() => {
    if (isAdmin || !studentEmail) return;
    const current = location.pathname.replace(base, '') || '/dashboard';
    setSeenNow(studentEmail, userCourse, current);
  }, [base, isAdmin, location.pathname, studentEmail, userCourse]);

  // Na primeira carga (ou quando o "visto" nunca foi gravado — ex: cache
  // limpo/troca de dispositivo), define a linha de base como "agora" ao invés
  // de 0. Isso evita que publicações antigas do fórum/debates/etc. sejam
  // contadas como "novas" indefinidamente.
  useEffect(() => {
    if (isAdmin || !studentEmail) return;
    VIEW_BADGE_PATHS.forEach((path) => {
      if (getSeenAt(studentEmail, userCourse, path) === 0) {
        setSeenNow(studentEmail, userCourse, path);
      }
    });
  }, [isAdmin, studentEmail, userCourse]);

  const studentBadges = useMemo(() => {
    if (isAdmin || !studentEmail) return {};
    const lessonDone = new Set(lessonProgress.filter(progress => progress?.watched && progress?.lesson_id).map(progress => progress.lesson_id));
    const submittedTasks = new Set(taskSubmissions.map(submission => submission?.task_id).filter(Boolean));
    const submittedExams = new Set(examSubmissions.map(submission => submission?.exam_id).filter(Boolean));
    const latestChallenge = challenges[0];
    const response = latestChallenge && challengeResponses.find(challengeResponse => challengeResponse?.challenge_id === latestChallenge.id);
    const challengeTotal = latestChallenge?.questions?.length || 8;
    const activeTherapistPending = pairings.filter(pairing => pairing && !pairing.therapist_submitted).length;
    const validTuitions = tuitions.filter(Boolean);
    const tuitionsPending = validTuitions.filter(tuition => tuition.status !== 'paid').length;
    const tuitionsNew = countNewSince(validTuitions, getSeenAt(studentEmail, userCourse, '/tuitions'), studentEmail);
    return {
      '/ofensivas': latestChallenge && (!response || (Number(response.questions_answered) || 0) < challengeTotal) ? 1 : 0,
      '/lessons': lessons.filter(lesson => lesson?.id && !lesson.is_hidden && !lessonDone.has(lesson.id)).length,
      '/tasks': tasks.filter(task => task?.id && !task.is_hidden && !submittedTasks.has(task.id) && !(task.module_number && !moduleUnlocked[Number(task.module_number) - 1])).length,
      '/exams': exams.filter(exam => exam?.id && !exam.is_hidden && !submittedExams.has(exam.id)).length,
      '/chat': countNewSince(chatMessages, getSeenAt(studentEmail, userCourse, '/chat'), studentEmail),
      '/forum': countNewSince([...forumPosts, ...forumReplies], getSeenAt(studentEmail, userCourse, '/forum'), studentEmail),
      '/debates': countNewSince([...debatePosts, ...debateReplies], getSeenAt(studentEmail, userCourse, '/debates'), studentEmail),
      '/terapeuta': activeTherapistPending,
      '/announcements': countNewSince(announcements, getSeenAt(studentEmail, userCourse, '/announcements'), studentEmail),
      '/tuitions': Math.max(tuitionsPending, tuitionsNew),
    };
  }, [isAdmin, studentEmail, userCourse, lessons, lessonProgress, tasks, taskSubmissions, exams, examSubmissions, challenges, challengeResponses, chatMessages, forumPosts, forumReplies, debatePosts, debateReplies, pairings, announcements, tuitions, moduleUnlocked]);

  // Collapsible group state — initially open the group that has the active route
  // Also re-open group when location changes (e.g. user navigates to a new section)
  const [openGroups, setOpenGroups] = useState(() =>
    getInitialOpenGroups(groups, base, location.pathname)
  );

  // Auto-expand the group of the active route whenever route changes
  useEffect(() => {
    const active = getInitialOpenGroups(groups, base, location.pathname);
    if (Object.keys(active).length > 0) {
      setOpenGroups(prev => ({ ...prev, ...active }));
    }
  }, [base, groups, location.pathname]);

  const toggleGroup = (gi) => {
    setOpenGroups(prev => ({ ...prev, [gi]: !prev[gi] }));
  };

  const isOpen = mobileOpenProp !== undefined ? mobileOpenProp : mobileOpen;
  const handleClose = () => {
    if (onMobileClose) onMobileClose();
    else setMobileOpen(false);
  };

  const initials = session?.name
    ? session.name.split(' ').map(namePart => namePart[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const avatarBg = session?.avatarColor || (isAdmin ? '#5b5ef4' : '#7c3aed');

  const isActive = (path) => {
    const target = base + path;
    return location.pathname === target || (path === '/dashboard' && (location.pathname === base || location.pathname === base + '/'));
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.path);
    const badgeCount = !isAdmin && STUDENT_BADGE_PATHS.has(item.path) ? (studentBadges[item.path] || 0) : 0;
    return (
      <Link
        to={base + item.path}
        onClick={handleClose}
        className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 relative ${
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
            : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-primary" />}
        <item.icon size={15} className={active ? 'text-sidebar-primary' : item.color} />
        <span className="font-medium text-[12.5px] flex-1 leading-tight">{item.label}</span>
        {badgeCount > 0 && (
          <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black leading-none flex items-center justify-center shadow-[0_0_0_2px_rgba(10,10,20,0.95)] animate-pulse">
            {capBadge(badgeCount)}
          </span>
        )}
        {active && <ChevronRight size={11} className="opacity-30" />}
      </Link>
    );
  };

  function NotificationsLink() {
    const { data: notifications = [] } = useQuery({
      queryKey: ['notifications-admin'],
      queryFn: () => base44.entities.Notification.filter({ recipient_email: 'admin' }, '-created_date', 50),
      refetchInterval: 15000,
    });
    const unread = notifications.filter(notification => notification && !notification.is_read).length;
    const active = isActive('/ring');
    return (
      <div className="px-3 py-2 border-t border-sidebar-border">
        <Link
          to={base + '/ring'}
          onClick={handleClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
            active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
          }`}
        >
          <div className="relative">
            <Bell size={15} className={unread > 0 ? 'text-orange-400' : ''} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <span className="font-medium text-[12.5px] flex-1">Notificações</span>
          {unread > 0 && !active && (
            <span className="text-[10px] font-bold text-orange-300">{unread} nova{unread > 1 ? 's' : ''}</span>
          )}
        </Link>
      </div>
    );
  }

  return (
    <>
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={handleClose} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-56 flex flex-col
        bg-sidebar text-sidebar-foreground
        border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-sidebar" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold tracking-tight text-sidebar-foreground">{BRAND_SHORT_NAME}</h1>
              <p className="text-[9px] text-sidebar-foreground/55 -mt-0.5 leading-tight">Instituto de Desenvolvimento Humano</p>
            </div>
          </div>
          <button onClick={handleClose} className="md:hidden text-white/40 hover:text-white p-1 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Nav — collapsible groups */}
        <nav className="px-2 py-2 flex flex-col gap-0 flex-grow overflow-y-auto scrollbar-thin">
          {groups.map((group, gi) => {
            const isGroupOpen = openGroups[gi] ?? false;
            const hasActiveItem = group.items.some(item => isActive(item.path));

            return (
              <div key={gi} className="mb-0.5">
                {/* Group header — clickable to expand/collapse */}
                <button
                  onClick={() => toggleGroup(gi)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors ${
                    hasActiveItem ? 'text-sidebar-foreground/80' : 'text-sidebar-foreground/45 hover:text-sidebar-foreground/70'
                  }`}
                >
                  <span className="text-[9.5px] font-bold uppercase tracking-widest">
                    {group.label}
                  </span>
                  {isGroupOpen
                    ? <ChevronDown size={11} className="opacity-50" />
                    : <ChevronRight size={11} className="opacity-40" />
                  }
                </button>

                {/* Items */}
                {isGroupOpen && (
                  <div className="flex flex-col gap-0.5 pl-1 pb-1">
                    {group.items.map(item => <NavLink key={item.path} item={item} />)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Admin notifications */}
        {isAdmin && <NotificationsLink />}

        {/* User footer */}
        <div className="p-2.5 border-t border-sidebar-border">
          <p className="px-2 pb-1.5 text-[8.5px] leading-snug text-sidebar-foreground/40">
            {BRAND_LEGAL_NAME}<br />CNPJ {BRAND_CNPJ}
          </p>
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/6 transition-colors mb-0.5">
            {session?.photoUrl ? (
              <img src={session.photoUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20 shrink-0" />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white ring-2 ring-white/20 shrink-0"
                style={{ backgroundColor: avatarBg }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-sidebar-foreground truncate">{session?.name || 'Usuário'}</p>
              <p className="text-[9px] text-sidebar-foreground/50">{isAdmin ? 'Administrador' : 'Estudante'}</p>
            </div>
            <Sparkles size={11} className="text-white/15 shrink-0" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sidebar-foreground/55 hover:text-red-500 flex-1 px-3 py-1.5 rounded-xl transition-colors text-[11px] font-medium"
            >
              <LogOut size={13} />
              Sair da conta
            </button>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              className="p-2 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
