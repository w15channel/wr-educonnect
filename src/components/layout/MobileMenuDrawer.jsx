/**
 * MobileMenuDrawer — Gaveta de menu lateral para mobile.
 * Otimizado para Moto G53 (720x1600, telas ~6.5", Android).
 *
 * - Abre da direita para a direita com overlay
 * - Itens com altura mínima de 52px (zona de toque confortável)
 * - Grupos com separadores visuais claros
 * - Avatar + nome + logout no rodapé fixo
 * - Respeita safe-area-inset de todos os lados
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare, FileText,
  BarChart3, Users, LogOut, Play, X, Bell, User, Key,
  CalendarDays, DollarSign, GraduationCap, Brain,
  ChevronRight, Trophy, Award, Crown, Heart, BookOpen, Hash, UsersRound, ClipboardCheck
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';
import { setSession, getSession } from '@/lib/customAuth';
import { applyTheme, getStoredTheme } from './MobileHeader';
import ThemeToggle from './ThemeToggle';

const COURSE_TO_SLUG = { tcc: 'tcc', psicanalise: 'psi', sexologia: 'sex' };
const COURSE_LABELS = { tcc: '🧠 TC', psicanalise: '🪞 Psicanálise', sexologia: '💜 Sexologia' };

const adminGroups = [
  { label: 'Classe', items: [
    { icon: BarChart3, label: 'Dashboard', path: '/', color: 'text-blue-400' },
    { icon: Play, label: 'Aulas', path: '/lessons', color: 'text-purple-400' },
    { icon: BookOpen, label: 'Apostila', path: '/apostila', color: 'text-emerald-400' },
    { icon: FileText, label: 'Tarefas', path: '/tasks', color: 'text-orange-400' },
    { icon: GraduationCap, label: 'Provas', path: '/tests', color: 'text-violet-400' },
  ]},
  { label: 'Comunidade', items: [
    { icon: Hash, label: 'Mural de Superação', path: '/chat', color: 'text-blue-400' },
    { icon: MessageSquare, label: 'Fórum', path: '/forum', color: 'text-green-400' },
    { icon: Hash, label: 'Debates', path: '/debates', color: 'text-fuchsia-400' },
    { icon: Heart, label: 'Terapeuta da Semana', path: '/terapeuta', color: 'text-pink-400' },
    { icon: Crown, label: 'Monitores', path: '/monitores', color: 'text-yellow-400' },
  ]},
  { label: 'Gestão', items: [
    { icon: Users, label: 'Alunos', path: '/students', color: 'text-indigo-400' },
    { icon: Key, label: 'Acessos', path: '/keys', color: 'text-emerald-400' },
    { icon: DollarSign, label: 'Mensalidades', path: '/tuitions', color: 'text-teal-400' },
    { icon: Trophy, label: 'Pontuação', path: '/scorecontrol', color: 'text-yellow-400' },
    { icon: ClipboardCheck, label: 'Liberação de Provas', path: '/exam-release', color: 'text-violet-400' },
    { icon: GraduationCap, label: 'Histórico', path: '/historico', color: 'text-cyan-400' },
    { icon: Bell, label: 'Avisos', path: '/announcements', color: 'text-yellow-400' },
  ]},
  { label: 'Ferramentas', items: [
    { icon: Brain, label: 'Luna — Assistente IA', path: '/tutor', color: 'text-amber-400' },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar', color: 'text-cyan-400' },
    { icon: Award, label: 'Certificação', path: '/certificadora', color: 'text-yellow-400' },
    { icon: FileText, label: 'Gerar Certificado', path: '/gerar-certificado', color: 'text-amber-400' },
  ]},
];

const studentGroups = [
  { label: 'Classe', items: [
    { icon: BarChart3, label: 'Dashboard', path: '/', color: 'text-blue-400' },
    { icon: Play, label: 'Aulas', path: '/lessons', color: 'text-purple-400' },
    { icon: BookOpen, label: 'Apostila', path: '/apostila', color: 'text-emerald-400' },
    { icon: FileText, label: 'Tarefas', path: '/tasks', color: 'text-orange-400' },
    { icon: GraduationCap, label: 'Provas', path: '/tests', color: 'text-violet-400' },
  ]},
  { label: 'Comunidade', items: [
    { icon: Trophy, label: 'Pontuação Geral', path: '/pontuacao-geral', color: 'text-yellow-400' },
    { icon: Hash, label: 'Mural de Superação', path: '/chat', color: 'text-blue-400' },
    { icon: MessageSquare, label: 'Fórum', path: '/forum', color: 'text-green-400' },
    { icon: Hash, label: 'Debates', path: '/debates', color: 'text-fuchsia-400' },
    { icon: Heart, label: 'Terapeuta da Semana', path: '/terapeuta', color: 'text-rose-400' },
    { icon: Crown, label: 'Monitores', path: '/monitores', color: 'text-yellow-400' },
    { icon: UsersRound, label: 'Classe', path: '/classe', color: 'text-sky-400' },
  ]},
  { label: 'Minha Área', items: [
    { icon: Bell, label: 'Avisos', path: '/announcements', color: 'text-yellow-400' },
    { icon: DollarSign, label: 'Mensalidades', path: '/tuitions', color: 'text-teal-400' },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar', color: 'text-cyan-400' },
    { icon: User, label: 'Meu Perfil', path: '/profile', color: 'text-indigo-400' },
  ]},
  { label: 'Ferramentas', items: [
    { icon: Brain, label: 'Luna — Assistente IA', path: '/tutor', color: 'text-amber-400' },
    { icon: BookOpen, label: 'Best Seller', path: '/bestseller', color: 'text-emerald-400' },
    { icon: GraduationCap, label: 'Histórico', path: '/historico', color: 'text-cyan-400' },
    { icon: Award, label: 'Certificação', path: '/certificadora', color: 'text-yellow-400' },
  ]},
];

export default function MobileMenuDrawer({ open, onClose, session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, login } = useCustomAuth();
  const [theme, setTheme] = useState(() => getStoredTheme());
  const isAdmin = session?.role === 'admin';

  const prefix = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
    if (session?.course) {
      const r = session.role === 'admin' ? 'adm' : 'student';
      return `/${r}/${COURSE_TO_SLUG[session.course] || 'tcc'}`;
    }
    return '';
  })();

  const scoped = (p) => prefix + p;

  const isActive = (path) => {
    const target = scoped(path === '/' ? '/dashboard' : path);
    if (path === '/') return location.pathname === `${prefix}/dashboard` || location.pathname === prefix;
    return location.pathname === target;
  };

  const handleNav = () => onClose();

  const handleChangeCourse = () => {
    const current = getSession();
    setSession({ ...current, course: null });
    login();
    navigate('/lobby');
    onClose();
  };

  const initials = session?.name ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const avatarBg = session?.avatarColor || (isAdmin ? '#5b5ef4' : '#7c3aed');
  const groups = isAdmin ? adminGroups : studentGroups;

  useEffect(() => {
    const syncTheme = (event) => setTheme(event.detail || getStoredTheme());
    window.addEventListener('wr-theme-change', syncTheme);
    return () => window.removeEventListener('wr-theme-change', syncTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  // Admin notifications count
  function useAdminUnread() {
    const { data: notifs = [] } = useQuery({
      queryKey: ['notifications-admin'],
      queryFn: () => base44.entities.Notification.filter({ recipient_email: 'admin' }, '-created_date', 50),
      refetchInterval: 15000,
      enabled: isAdmin,
    });
    return notifs.filter(n => !n.is_read).length;
  }
  const unreadCount = useAdminUnread();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer — slide from right */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="sidebar-glass fixed inset-y-0 right-0 z-[60] flex flex-col w-[82vw] max-w-[320px] text-sidebar-foreground border-l"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8">
                  <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-[12px] font-light tracking-[0.22em] uppercase text-sidebar-foreground/80">{BRAND_SHORT_NAME}</p>
                  <p className="text-[8px] text-sidebar-foreground/45 font-light uppercase tracking-[0.15em]">Plataforma EDU</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center border border-sidebar-border rounded-full text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground active:scale-90 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav scrollável */}
            <nav className="flex-1 overflow-y-auto scrollbar-invisible px-3 py-3">
              {groups.map((group, gi) => (
                <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
                  <p className="text-[9px] font-light text-sidebar-foreground/45 uppercase tracking-[0.3em] mb-1.5 px-2">
                    {group.label}
                  </p>
                  {group.items.map(item => {
                    const active = isActive(item.path);
                    const target = item.path === '/' ? scoped('/dashboard') : scoped(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={target}
                        onClick={handleNav}
                        className={`relative flex items-center gap-3 px-3 py-3.5 rounded-xl mb-0.5 min-h-[52px] transition-colors active:scale-[0.98] ${
                          active
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/65 active:bg-sidebar-accent/60'
                        }`}
                      >
                        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#d4b96a]" />}
                        <item.icon size={18} className={active ? 'text-[#d4b96a] shrink-0' : `${item.color} shrink-0 opacity-80`} />
                        <span className={`text-[13px] font-light flex-1 ${active ? '' : ''}`}>{item.label}</span>
                        {active && <ChevronRight size={13} className="text-[#d4b96a]/50 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              ))}

              {/* Notificações admin */}
              {isAdmin && (
                <div className="mt-4">
                  <p className="text-[9px] font-light text-sidebar-foreground/45 uppercase tracking-[0.3em] mb-1.5 px-2">Sistema</p>
                  <Link
                    to={scoped('/ring')}
                    onClick={handleNav}
                    className={`relative flex items-center gap-3 px-3 py-3.5 rounded-xl min-h-[52px] transition-colors ${
                      isActive('/ring') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 active:bg-sidebar-accent/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Bell size={18} className={unreadCount > 0 ? 'text-orange-400' : 'text-[#c8bfa8]/50'} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-light flex-1">Notificações</span>
                    {unreadCount > 0 && (
                      <span className="text-[9px] font-light text-orange-400 shrink-0">{unreadCount} nova{unreadCount > 1 ? 's' : ''}</span>
                    )}
                  </Link>
                </div>
              )}
            </nav>

            {/* Footer fixo — turma + usuário + logout */}
            <div className="shrink-0 border-t border-sidebar-border">
              {/* Turma (admin) */}
              {isAdmin && session?.course && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#151c30]">
                  <div>
                    <p className="text-[8px] text-[#c8bfa8]/25 uppercase tracking-[0.2em] font-light">Turma ativa</p>
                    <p className="text-[11px] font-light text-[#e8dfc8]/60">{COURSE_LABELS[session.course] || session.course}</p>
                  </div>
                  <button onClick={handleChangeCourse} className="text-[10px] font-light text-[#d4b96a]/60 active:opacity-60 underline">
                    Trocar
                  </button>
                </div>
              )}

              {/* Perfil + logout */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-3 mb-3">
                  {session?.photoUrl ? (
                    <img src={session.photoUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-1 ring-[#d4b96a]/15 shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-light text-white ring-1 ring-[#d4b96a]/15 shrink-0"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-light text-sidebar-foreground/90 truncate">{session?.name || 'Usuário'}</p>
                    <p className="text-[9px] text-sidebar-foreground/50 uppercase tracking-[0.15em] font-light">
                      {isAdmin ? 'Administrador' : 'Estudante'}
                    </p>
                  </div>
                </div>
                <ThemeToggle theme={theme} onToggle={toggleTheme} showLabel className="mb-2" />
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/15 rounded-xl text-red-400/60 text-[12px] font-light active:scale-[0.97] transition-all"
                >
                  <LogOut size={14} />
                  Sair da conta
                </button>
                <p className="text-center text-[8px] text-sidebar-foreground/35 mt-3 font-light leading-snug">{BRAND_LEGAL_NAME}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}