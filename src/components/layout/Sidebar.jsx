import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { setSession, getSession } from '@/lib/customAuth';

const COURSE_TO_SLUG = { tcc: 'tcc', psicanalise: 'psi', sexologia: 'sex' };
import {
  Video, MessageSquare, FileText,
  BarChart3, Users, LogOut, Play, X, Bell, User, Key,
  CalendarDays, DollarSign, GraduationCap, Brain, Sparkles,
  ChevronRight, Trophy, Award, Crown, Heart, BookOpen, Hash, UsersRound
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const adminGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3, label: 'Dashboard', path: '/', color: 'text-blue-400' },
      { icon: Play, label: 'Aulas', path: '/lessons', color: 'text-purple-400' },
      { icon: Video, label: 'Sala ao Vivo', path: '/live', color: 'text-red-400' },
      { icon: FileText, label: 'Tarefas', path: '/tasks', color: 'text-orange-400' },
      { icon: GraduationCap, label: 'Provas', path: '/tests', color: 'text-violet-400' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: Hash, label: 'Chat da Turma', path: '/chat', color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas', path: '/forum', color: 'text-green-400' },
      { icon: UsersRound, label: 'Sala de Debates', path: '/debates', color: 'text-fuchsia-400' },
      { icon: Heart, label: 'Terapeuta da Semana', path: '/terapeuta', color: 'text-pink-400' },
      { icon: Crown, label: 'Monitores', path: '/monitores', color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { icon: Users, label: 'Gestão de Alunos', path: '/students', color: 'text-indigo-400' },
      { icon: Key, label: 'Códigos de Acesso', path: '/keys', color: 'text-emerald-400' },
      { icon: DollarSign, label: 'Mensalidades', path: '/tuitions', color: 'text-teal-400' },
      { icon: Trophy, label: 'Controle de Pontuação', path: '/scorecontrol', color: 'text-yellow-400' },
      { icon: GraduationCap, label: 'Histórico Acadêmico', path: '/historico', color: 'text-cyan-400' },
      { icon: Bell, label: 'Avisos', path: '/announcements', color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { icon: Brain, label: 'Tutor Digital EDU', path: '/tutor', color: 'text-pink-400' },
      { icon: CalendarDays, label: 'Calendário', path: '/calendar', color: 'text-cyan-400' },
      { icon: Award, label: 'Certificação', path: '/certificadora', color: 'text-yellow-400' },
      { icon: FileText, label: 'Gerar Certificado', path: '/gerar-certificado', color: 'text-amber-400' },
    ],
  },
];

const studentGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3, label: 'Dashboard', path: '/', color: 'text-blue-400' },
      { icon: Play, label: 'Aulas', path: '/lessons', color: 'text-purple-400' },
      { icon: Video, label: 'Sala ao Vivo', path: '/live', color: 'text-red-400' },
      { icon: FileText, label: 'Tarefas', path: '/tasks', color: 'text-orange-400' },
      { icon: GraduationCap, label: 'Provas', path: '/tests', color: 'text-violet-400' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: Hash, label: 'Chat da Turma', path: '/chat', color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas', path: '/forum', color: 'text-green-400' },
      { icon: UsersRound, label: 'Sala de Debates', path: '/debates', color: 'text-fuchsia-400' },
      { icon: Heart, label: 'Terapeuta da Semana', path: '/terapeuta', color: 'text-rose-400' },
      { icon: Crown, label: 'Monitores', path: '/monitores', color: 'text-yellow-400' },
      { icon: UsersRound, label: 'Classe', path: '/classe', color: 'text-sky-400' },
    ],
  },
  {
    label: 'Minha Área',
    items: [
      { icon: Bell, label: 'Avisos', path: '/announcements', color: 'text-yellow-400' },
      { icon: DollarSign, label: 'Mensalidades', path: '/tuitions', color: 'text-teal-400' },
      { icon: CalendarDays, label: 'Calendário', path: '/calendar', color: 'text-cyan-400' },
      { icon: User, label: 'Meu Perfil', path: '/profile', color: 'text-indigo-400' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { icon: Brain, label: 'Tutor Digital EDU', path: '/tutor', color: 'text-pink-400' },
      { icon: BookOpen, label: 'Meu Best Seller', path: '/bestseller', color: 'text-emerald-400' },
      { icon: GraduationCap, label: 'Histórico Acadêmico', path: '/historico', color: 'text-cyan-400' },
      { icon: Award, label: 'Certificação', path: '/certificadora', color: 'text-yellow-400' },
    ],
  },
];

const COURSE_LABELS = { tcc: '🧠 TC', psicanalise: '🪞 Psicanálise', sexologia: '💜 Sexologia' };

export default function Sidebar({ session, mobileOpen: mobileOpenProp, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, login } = useCustomAuth();

  // Compute current scoped prefix from URL (e.g. /student/tcc or /adm/psi)
  const prefix = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
      return `/${parts[0]}/${parts[1]}`;
    }
    // Fallback from session
    if (session?.course) {
      const r = session.role === 'admin' ? 'adm' : 'student';
      const slug = COURSE_TO_SLUG[session.course] || 'tcc';
      return `/${r}/${slug}`;
    }
    return '';
  }, [location.pathname, session]);

  const scoped = (path) => {
    if (!prefix) return path;
    if (path.startsWith('/')) return prefix + path;
    return `${prefix}/${path}`;
  };

  const isOpen = mobileOpenProp !== undefined ? mobileOpenProp : mobileOpen;
  const handleClose = () => {
    if (onMobileClose) onMobileClose();
    else setMobileOpen(false);
  };
  const isAdmin = session?.role === 'admin';
  const activeCourse = session?.course;

  const handleChangeCourse = () => {
    // Keep session but clear course so lobby shows again
    const current = getSession();
    setSession({ ...current, course: null });
    login();
    navigate('/lobby');
    handleClose();
  };

  const initials = session?.name
    ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const avatarBg = session?.avatarColor || (isAdmin ? '#5b5ef4' : '#7c3aed');

  const isActive = (path) => {
    const target = scoped(path);
    if (path.includes('?')) {
      const [base, query] = target.split('?');
      return location.pathname === base && location.search.includes(query);
    }
    // Treat /<prefix>/dashboard as active when path is '/'
    if (path === '/') {
      return location.pathname === `${prefix}/dashboard` || location.pathname === prefix || location.pathname === `${prefix}/`;
    }
    return location.pathname === target;
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.path);
    const targetPath = item.path === '/' ? scoped('/dashboard') : scoped(item.path);
    return (
      <Link
        to={targetPath}
        onClick={handleClose}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
          active
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-white/55 hover:bg-white/6 hover:text-white/85'
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />}
        <item.icon size={17} className={active ? 'text-white' : item.color} />
        <span className="font-medium text-[13px] flex-1">{item.label}</span>
        {active && <ChevronRight size={12} className="opacity-40" />}
      </Link>
    );
  };

  const groups = isAdmin ? adminGroups : studentGroups;

  function NotificationsLink({ scoped, isActive, onNav }) {
    const { data: notifications = [] } = useQuery({
      queryKey: ['notifications-admin'],
      queryFn: () => base44.entities.Notification.filter({ recipient_email: 'admin' }, '-created_date', 50),
      refetchInterval: 15000,
    });
    const unread = notifications.filter(n => !n.is_read).length;
    const active = isActive('/ring');
    return (
      <div className="px-3 py-2 border-t border-white/8">
        <Link
          to={scoped('/ring')}
          onClick={onNav}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/6 hover:text-white/85'
          }`}
        >
          <div className="relative">
            <Bell size={17} className={unread > 0 ? 'text-orange-400' : ''} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <span className="font-medium text-[13px] flex-1">Notificações</span>
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
        w-60 flex flex-col
        bg-sidebar text-sidebar-foreground
        border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 flex items-center justify-center">
                <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-sidebar" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-white">{BRAND_SHORT_NAME}</h1>
              <p className="text-[10px] text-white/40 -mt-0.5">Instituto de Desenvolvimento Humano</p>
            </div>
          </div>
          <button onClick={handleClose} className="md:hidden text-white/40 hover:text-white p-1 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 flex flex-col gap-0.5 flex-grow overflow-y-auto scrollbar-thin">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-3">
                {group.label}
              </p>
              {group.items.map(item => <NavLink key={item.path} item={item} />)}
            </div>
          ))}
        </nav>

        {/* Admin notifications link */}
        {isAdmin && <NotificationsLink scoped={scoped} isActive={isActive} onNav={handleClose} />}

        {/* Course badge for admin */}
        {isAdmin && activeCourse && (
          <div className="px-3 py-2 border-t border-white/8">
            <div className="flex items-center justify-between bg-white/6 rounded-xl px-3 py-2">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Turma ativa</p>
                <p className="text-xs font-bold text-white/80">{COURSE_LABELS[activeCourse] || activeCourse}</p>
              </div>
              <button
                onClick={handleChangeCourse}
                className="text-[10px] text-primary font-semibold hover:text-accent transition-colors underline"
              >
                Trocar
              </button>
            </div>
          </div>
        )}

        {/* User footer */}
        <div className="p-3 border-t border-white/8">
          <p className="px-2 pb-2 text-[9px] leading-snug text-white/30">
            {BRAND_LEGAL_NAME}<br />CNPJ {BRAND_CNPJ}
          </p>
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/6 transition-colors mb-1">
            {session?.photoUrl ? (
              <img src={session.photoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20 shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white ring-2 ring-white/20 shrink-0"
                style={{ backgroundColor: avatarBg }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white/90 truncate">{session?.name || 'Usuário'}</p>
              <p className="text-[10px] text-white/40">
                {isAdmin ? 'Administrador' : 'Estudante'}
              </p>
            </div>
            <Sparkles size={13} className="text-white/20 shrink-0" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-white/35 hover:text-red-400 w-full px-3 py-2 rounded-xl transition-colors text-[12px] font-medium"
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  );
}