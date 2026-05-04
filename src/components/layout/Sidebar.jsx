import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Video, MessageSquare, FileText,
  BarChart3, Users, LogOut, Play, X, Bell, User, Key,
  CalendarDays, DollarSign, GraduationCap, Brain, Sparkles,
  ChevronRight, Trophy, Award, Crown, Heart, BookOpen, Hash
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const adminGroups = [
  {
    label: 'Classe',
    items: [
      { icon: BarChart3, label: 'Dashboard', path: '/', color: 'text-blue-400' },
      { icon: Play, label: 'Aulas', path: '/lessons', color: 'text-purple-400' },
      { icon: Video, label: 'Sala ao Vivo', path: '/live', color: 'text-red-400' },
      { icon: FileText, label: 'Tarefas e Provas', path: '/tasks', color: 'text-orange-400' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: Hash, label: 'Chat da Turma', path: '/chat', color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas', path: '/forum', color: 'text-green-400' },
      { icon: Heart, label: 'Terapeuta da Semana', path: '/terapeuta', color: 'text-pink-400' },
      { icon: Crown, label: 'Monitores', path: '/monitores', color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { icon: Users, label: 'Gestão de Alunos', path: '/students', color: 'text-indigo-400' },
      { icon: Key, label: 'Códigos de Acesso', path: '/students?tab=codes', color: 'text-emerald-400' },
      { icon: DollarSign, label: 'Mensalidades', path: '/tuitions', color: 'text-teal-400' },
      { icon: Trophy, label: 'Controle de Pontuação', path: '/scores', color: 'text-yellow-400' },
      { icon: GraduationCap, label: 'Histórico Acadêmico', path: '/historico', color: 'text-cyan-400' },
      { icon: Bell, label: 'Avisos', path: '/announcements', color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { icon: Brain, label: 'Tutor Digital EDU', path: '/tutor', color: 'text-pink-400' },
      { icon: CalendarDays, label: 'Calendário', path: '/calendar', color: 'text-cyan-400' },
      { icon: Award, label: 'Certificadora', path: '/certificadora', color: 'text-yellow-400' },
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
      { icon: FileText, label: 'Tarefas e Provas', path: '/tasks', color: 'text-orange-400' },
    ],
  },
  {
    label: 'Comunidade',
    items: [
      { icon: Hash, label: 'Chat da Turma', path: '/chat', color: 'text-blue-400' },
      { icon: MessageSquare, label: 'Fórum de Dúvidas', path: '/forum', color: 'text-green-400' },
      { icon: Heart, label: 'Terapeuta da Semana', path: '/terapeuta', color: 'text-rose-400' },
      { icon: Crown, label: 'Monitores', path: '/monitores', color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Minha Área',
    items: [
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
      { icon: Award, label: 'Certificadora', path: '/certificadora', color: 'text-yellow-400' },
    ],
  },
];

export default function Sidebar({ session, mobileOpen: mobileOpenProp, onMobileClose }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useCustomAuth();

  const isOpen = mobileOpenProp !== undefined ? mobileOpenProp : mobileOpen;
  const handleClose = () => {
    if (onMobileClose) onMobileClose();
    else setMobileOpen(false);
  };
  const isAdmin = session?.role === 'admin';

  const initials = session?.name
    ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const avatarBg = session?.avatarColor || (isAdmin ? '#5b5ef4' : '#7c3aed');

  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname === path.split('?')[0] && location.search.includes(path.split('?')[1]);
    }
    return location.pathname === path;
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.path);
    return (
      <Link
        to={item.path}
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/40">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-sidebar" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-white">WR-EDU</h1>
              <p className="text-[10px] text-white/40 -mt-0.5">Portal Educacional</p>
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

        {/* User footer */}
        <div className="p-3 border-t border-white/8">
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