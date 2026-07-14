import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { applyTheme, getStoredTheme } from '@/components/layout/MobileHeader';

from '@/components/ui/button';
import { ChevronDown, ChevronUp, LogOut, Settings, Menu, X } from 'lucide-react';
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
      { icon: Lightbulb,     label: 'Sala de Debates',        path: '/debates',           color: 'text-yellow-400' },
      { icon: MessageCircle, label: 'DM com Alunos',          path: '/messages',          color: 'text-indigo-400' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { icon: Users,         label: 'Alunos',                 path: '/students',          color: 'text-cyan-400' },
      { icon: Trophy,        label: 'Pontuação',              path: '/scorecontrol',      color: 'text-yellow-400' },
      { icon: Bell,          label: 'Avisos',                 path: '/announcements',     color: 'text-orange-300' },
      { icon: Bell,          label: 'Notificações',           path: '/notifications',     color: 'text-red-400' },
      { icon: CreditCard,    label: 'Mensalidades',           path: '/tuitions',          color: 'text-green-400' },
    ],
  },
];

const studentGroups = [
  {
    label: 'Formação',
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
      { icon: Lightbulb,     label: 'Sala de Debates',        path: '/debates',           color: 'text-yellow-400' },
      { icon: Heart,         label: 'Terapeuta da Semana',    path: '/terapeuta',         color: 'text-pink-400' },
      { icon: MessageCircle, label: 'Tutor Digital',          path: '/tutor-digital',     color: 'text-cyan-400' },
    ],
  },
  {
    label: 'Pessoal',
    items: [
      { icon: Bell,          label: 'Avisos',                 path: '/announcements',     color: 'text-orange-300' },
      { icon: CreditCard,    label: 'Mensalidades',           path: '/tuitions',          color: 'text-green-400' },
    ],
  },
];

export default function Sidebar({ session, mobileOpen: mobileOpenProp, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useCustomAuth();
  const [mobileOpen, setMobileOpen] = useState(mobileOpenProp);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    setMobileOpen(mobileOpenProp);
  }, [mobileOpenProp]);

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
  const { data: announcements = [] } = useQuery({ queryKey: ['sidebar-announcements', userCourse, studentEmail], queryFn: async () => base44.entities.Announcement.filter({ course: userCourse, type: { not: 'unlock_rule' } }, '-created_date', 300), enabled: !isAdmin && !!studentEmail, refetchInterval: 30000 });
  const { data: tuitions = [] } = useQuery({ queryKey: ['sidebar-tuitions', studentEmail], queryFn: () => base44.entities.Tuition.filter({ student_email: studentEmail }, '-due_date', 100), enabled: !isAdmin && !!studentEmail, refetchInterval: 60000 });

  const studentBadges = useMemo(() => {
    if (isAdmin || !studentEmail) return {};
    const lessonDone = new Set(lessonProgress.filter(p => p.watched).map(p => p.lesson_id));
    const submittedTasks = new Set(taskSubmissions.map(s => s.task_id));
    const submittedExams = new Set(examSubmissions.map(s => s.exam_id));
    const latestChallenge = challenges[0];
    const response = latestChallenge && challengeResponses.find(r => r.challenge_id === latestChallenge.id);
    const challengeTotal = latestChallenge?.questions?.length || 8;
    const activeTherapistPending = pairings.filter(p => !p.therapist_submitted).length;
    const tuitionsPending = tuitions.filter(t => t.status !== 'paid').length;
    const tuitionsNew = countNewSince(tuitions, getSeenAt(studentEmail, userCourse, '/tuitions'), studentEmail);
    return {
      '/ofensivas': latestChallenge && (!response || (Number(response.questions_answered) || 0) < challengeTotal) ? 1 : 0,
      '/lessons': lessons.filter(l => !lessonDone.has(l.id)).length,
      '/tasks': tasks.filter(t => !submittedTasks.has(t.id)).length,
      '/exams': submittedExams.length > 0 ? 0 : exams.length,
      '/chat': countNewSince(chatMessages, getSeenAt(studentEmail, userCourse, '/chat'), studentEmail),
      '/forum': countNewSince([...forumPosts, ...forumReplies], getSeenAt(studentEmail, userCourse, '/forum'), studentEmail),
      '/debates': countNewSince([...debatePosts, ...debateReplies], getSeenAt(studentEmail, userCourse, '/debates'), studentEmail),
      '/terapeuta': activeTherapistPending,
      '/announcements': countNewSince(announcements, getSeenAt(studentEmail, userCourse, '/announcements'), studentEmail),
      '/tuitions': tuitionsNew > 0 ? tuitionsNew : (tuitionsPending > 0 ? 1 : 0),
    };
  }, [lessonProgress, lessons, taskSubmissions, tasks, examSubmissions, exams, challenges, challengeResponses, pairings, tuitions, chatMessages, forumPosts, forumReplies, debatePosts, debateReplies, announcements, studentEmail, userCourse, isAdmin]);

  const totalNotifications = Object.values(studentBadges).reduce((sum, v) => sum + (v || 0), 0);

  const toggleGroup = (idx) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleNavClick = () => {
    if (window.innerWidth < 768 && mobileOpen) {
      onMobileClose?.();
    }
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <img src={WR_PRIMARY_LOGO} alt="Logo" className="w-6 h-6" />
          <h1 className="text-sm font-black text-sidebar-foreground uppercase tracking-widest">{BRAND_SHORT_NAME}</h1>
        </div>
        <p className="text-xs font-semibold text-sidebar-foreground">{session?.name?.split(' ')[0]}</p>
        <p className="text-[11px] text-sidebar-foreground/60 truncate">{session?.email}</p>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto space-y-0.5 py-3 px-2">
        {groups.map((group, idx) => {
          const expanded = expandedGroups[idx] !== false; // Default expanded
          return (
            <div key={idx}>
              <button
                onClick={() => toggleGroup(idx)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-sidebar-foreground/70 uppercase tracking-wider hover:text-sidebar-foreground transition-colors group"
              >
                <span>{group.label}</span>
                <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded && (
                <div className="space-y-1 py-1">
                  {group.items.map((item, itemIdx) => {
                    const isActive = location.pathname.includes(item.path.split('/')[1]);
                    const badge = studentBadges[item.path];
                    return (
                      <Link
                        key={itemIdx}
                        to={`${base}${item.path}`}
                        onClick={() => {
                          setSeenNow(studentEmail, userCourse, item.path);
                          handleNavClick();
                        }}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <item.icon size={16} className={item.color} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {badge > 0 && STUDENT_BADGE_PATHS.has(item.path) && (
                          <span className="ml-auto shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">{capBadge(badge)}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <button
          onClick={() => navigate(`${base}/settings`)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-all"
        >
          <Settings size={16} />
          <span>Configurações</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-all"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  // Desktop sidebar
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <aside className="hidden md:flex md:flex-col w-72 h-full bg-sidebar border-r border-sidebar-border overflow-hidden">
        {sidebarContent}
      </aside>
    );
  }

  // Mobile drawer
  return (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}
      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col transform transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src={WR_PRIMARY_LOGO} alt="Logo" className="w-5 h-5" />
            <span className="text-sm font-bold text-sidebar-foreground">{BRAND_SHORT_NAME}</span>
          </div>
          <button onClick={onMobileClose} className="p-1 hover:bg-sidebar-accent rounded-lg">
            <X size={18} />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}

// Imports faltantes (adicionar no topo do arquivo se necessário)
import { useMemo } from 'react';
import {
  BarChart3, Play, Video, FileText, ClipboardList, BookOpen, Flame,
  UsersRound, MessageSquare, Lightbulb, Heart, MessageCircle,
  Users, Trophy, Bell, CreditCard
} from 'lucide-react';
