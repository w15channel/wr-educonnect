import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  Video, MessageSquare, FileText,
  BarChart3, Users, LogOut, Play, X, Bell, User, Key,
  CalendarDays, DollarSign, GraduationCap, Brain, Sparkles,
  ChevronRight, ChevronDown, Trophy, Award, Crown, Heart, BookOpen, Hash, UsersRound, Flame
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

// ── Nav groups
// Note: Chat da Turma ↔ Sala de Debates ícones trocados conforme solicitado
const adminGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3,    label: 'Dashboard',           path: '/dashboard',          color: 'text-blue-400' },
      { icon: Play,         label: 'Aulas',               path: '/lessons',            color: 'text-purple-400' },
      { icon: Video,        label: 'Sala ao Vivo',        path: '/live',               color: 'text-red-400' },
      { icon: FileText,     label: 'Tarefas',             path: '/tasks',              color: 'text-orange-400' },
      { icon: GraduationCap,label: 'Provas',              path: '/tests',              color: 'text-violet-400' },
      { icon: Flame,        label: 'Ofensivas',           path: '/ofensivas',          color: 'text-orange-500' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: UsersRound,   label: 'Chat da Turma',       path: '/chat',               color: 'text-blue-400' },
      { icon: MessageSquare,label: 'Fórum de Dúvidas',   path: '/forum',              color: 'text-green-400' },
      { icon: Hash,         label: 'Sala de Debates',     path: '/debates',            color: 'text-fuchsia-400' },
      { icon: Heart,        label: 'Terapeuta da Semana', path: '/terapeuta',          color: 'text-pink-400' },
      { icon: Crown,        label: 'Monitores',           path: '/monitores',          color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { icon: Users,        label: 'Gestão de Alunos',   path: '/students',           color: 'text-indigo-400' },
      { icon: Key,          label: 'Códigos de Acesso',  path: '/keys',               color: 'text-emerald-400' },
      { icon: DollarSign,   label: 'Mensalidades',       path: '/tuitions',           color: 'text-teal-400' },
      { icon: Trophy,       label: 'Controle de Pontuação', path: '/scorecontrol',    color: 'text-yellow-400' },
      { icon: GraduationCap,label: 'Histórico Acadêmico', path: '/historico',         color: 'text-cyan-400' },
      { icon: Bell,         label: 'Avisos',             path: '/announcements',      color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { icon: Brain,        label: 'Tutor Digital EDU',  path: '/tutor',              color: 'text-pink-400' },
      { icon: CalendarDays, label: 'Calendário',         path: '/calendar',           color: 'text-cyan-400' },
      { icon: BookOpen,     label: 'Apostila',           path: '/apostila',           color: 'text-emerald-400' },
      { icon: Award,        label: 'Certificação',       path: '/certificadora',      color: 'text-yellow-400' },
      { icon: FileText,     label: 'Gerar Certificado',  path: '/gerar-certificado',  color: 'text-amber-400' },
    ],
  },
];

const studentGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3,    label: 'Dashboard',          path: '/dashboard',          color: 'text-blue-400' },
      { icon: Flame,        label: 'Ofensivas',          path: '/ofensivas',          color: 'text-orange-500' },
      { icon: Play,         label: 'Aulas',              path: '/lessons',            color: 'text-purple-400' },
      { icon: Video,        label: 'Sala ao Vivo',       path: '/live',               color: 'text-red-400' },
      { icon: FileText,     label: 'Tarefas',            path: '/tasks',              color: 'text-orange-400' },
      { icon: GraduationCap,label: 'Provas',             path: '/tests',              color: 'text-violet-400' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: UsersRound,   label: 'Chat da Turma',      path: '/chat',               color: 'text-blue-400' },
      { icon: MessageSquare,label: 'Fórum de Dúvidas',  path: '/forum',              color: 'text-green-400' },
      { icon: Hash,         label: 'Sala de Debates',    path: '/debates',            color: 'text-fuchsia-400' },
      { icon: Heart,        label: 'Terapeuta da Semana', path: '/terapeuta',         color: 'text-rose-400' },
      { icon: Crown,        label: 'Monitores',          path: '/monitores',          color: 'text-yellow-400' },
      { icon: UsersRound,   label: 'Classe',             path: '/classe',             color: 'text-sky-400' },
    ],
  },
  {
    label: 'Minha Área',
    items: [
      { icon: Bell,         label: 'Avisos',             path: '/announcements',      color: 'text-yellow-400' },
      { icon: DollarSign,   label: 'Mensalidades',       path: '/tuitions',           color: 'text-teal-400' },
      { icon: CalendarDays, label: 'Calendário',         path: '/calendar',           color: 'text-cyan-400' },
      { icon: User,         label: 'Meu Perfil',         path: '/profile',            color: 'text-indigo-400' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { icon: Brain,        label: 'Tutor Digital EDU',  path: '/tutor',              color: 'text-pink-400' },
      { icon: BookOpen,     label: 'Meu Best Seller',    path: '/bestseller',         color: 'text-emerald-400' },
      { icon: BookOpen,     label: 'Apostila',           path: '/apostila',           color: 'text-teal-400' },
      { icon: GraduationCap,label: 'Histórico Acadêmico', path: '/historico',        color: 'text-cyan-400' },
      { icon: Award,        label: 'Certificação',       path: '/certificadora',      color: 'text-yellow-400' },
      { icon: GraduationCap,label: 'Meu Certificado',   path: '/meu-certificado',    color: 'text-amber-400' },
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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useCustomAuth();

  const isAdmin = session?.role === 'admin';
  const base = isAdmin ? '/adm' : '/student';
  const groups = isAdmin ? adminGroups : studentGroups;

  // Collapsible group state — initially open the group that has the active route
  const [openGroups, setOpenGroups] = useState(() =>
    getInitialOpenGroups(groups, base, location.pathname)
  );

  const toggleGroup = (gi) => {
    setOpenGroups(prev => ({ ...prev, [gi]: !prev[gi] }));
  };

  const isOpen = mobileOpenProp !== undefined ? mobileOpenProp : mobileOpen;
  const handleClose = () => {
    if (onMobileClose) onMobileClose();
    else setMobileOpen(false);
  };

  const initials = session?.name
    ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const avatarBg = session?.avatarColor || (isAdmin ? '#5b5ef4' : '#7c3aed');

  const isActive = (path) => {
    const target = base + path;
    return location.pathname === target || (path === '/dashboard' && (location.pathname === base || location.pathname === base + '/'));
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.path);
    return (
      <Link
        to={base + item.path}
        onClick={handleClose}
        className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 relative ${
          active
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-white/50 hover:bg-white/6 hover:text-white/80'
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-primary" />}
        <item.icon size={15} className={active ? 'text-white' : item.color} />
        <span className="font-medium text-[12.5px] flex-1 leading-tight">{item.label}</span>
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
    const unread = notifications.filter(n => !n.is_read).length;
    const active = isActive('/ring');
    return (
      <div className="px-3 py-2 border-t border-white/8">
        <Link
          to={base + '/ring'}
          onClick={handleClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
            active ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/6 hover:text-white/80'
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
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-sidebar" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold tracking-tight text-white">{BRAND_SHORT_NAME}</h1>
              <p className="text-[9px] text-white/35 -mt-0.5 leading-tight">Instituto de Desenvolvimento Humano</p>
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
                    hasActiveItem ? 'text-white/70' : 'text-white/28 hover:text-white/50'
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
        <div className="p-2.5 border-t border-white/8">
          <p className="px-2 pb-1.5 text-[8.5px] leading-snug text-white/25">
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
              <p className="text-[12px] font-semibold text-white/90 truncate">{session?.name || 'Usuário'}</p>
              <p className="text-[9px] text-white/35">{isAdmin ? 'Administrador' : 'Estudante'}</p>
            </div>
            <Sparkles size={11} className="text-white/15 shrink-0" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-white/30 hover:text-red-400 w-full px-3 py-1.5 rounded-xl transition-colors text-[11px] font-medium"
          >
            <LogOut size={13} />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  );
}