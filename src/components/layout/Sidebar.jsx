import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Video, MessageSquare, FileText, 
  BarChart, Users, LogOut, Play, Menu, X, Bell, User, Key,
  Calendar, DollarSign, GraduationCap, Brain
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';

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

  const adminNav = [
    { icon: BarChart, label: 'Dashboard', path: '/' },
    { icon: Play, label: 'Aulas Gravadas', path: '/lessons' },
    { icon: Video, label: 'Sala ao Vivo', path: '/live' },
    { icon: FileText, label: 'Tarefas e Provas', path: '/tasks' },
    { icon: MessageSquare, label: 'Fórum de Dúvidas', path: '/forum' },
    { icon: Bell, label: 'Avisos', path: '/announcements' },
    { icon: Calendar, label: 'Calendário', path: '/calendar' },
    { icon: Brain, label: 'Tutor Digital', path: '/tutor' },
  ];

  const adminToolsNav = [
    { icon: Users, label: 'Gestão de Alunos', path: '/students' },
    { icon: Key, label: 'Códigos de Acesso', path: '/students?tab=codes' },
    { icon: DollarSign, label: 'Mensalidades', path: '/tuitions' },
  ];

  const studentNav = [
    { icon: BarChart, label: 'Dashboard', path: '/' },
    { icon: Play, label: 'Videoaulas', path: '/lessons' },
    { icon: Video, label: 'Sala ao Vivo', path: '/live' },
    { icon: FileText, label: 'Tarefas e Provas', path: '/tasks' },
    { icon: MessageSquare, label: 'Fórum de Dúvidas', path: '/forum' },
    { icon: Bell, label: 'Avisos', path: '/announcements' },
    { icon: Calendar, label: 'Calendário', path: '/calendar' },
    { icon: DollarSign, label: 'Mensalidades', path: '/tuitions' },
    { icon: Brain, label: 'Tutor Digital', path: '/tutor' },
    { icon: User, label: 'Meu Perfil', path: '/profile' },
  ];

  const initials = session?.name
    ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const avatarBg = session?.avatarColor || (isAdmin ? '#6366f1' : '#8b5cf6');

  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname === path.split('?')[0] && location.search.includes(path.split('?')[1]);
    }
    return location.pathname === path;
  };

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      onClick={handleClose}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive(item.path)
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
      }`}
    >
      <item.icon size={19} />
      <span className="font-medium text-sm">{item.label}</span>
    </Link>
  );

  return (
    <>
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-sidebar text-sidebar-foreground flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <GraduationCap size={22} className="text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">WR-EDU</h1>
          </div>
          <button onClick={handleClose} aria-label="Fechar menu" className="md:hidden text-sidebar-foreground/60 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 flex flex-col gap-1 flex-grow overflow-y-auto">
          <p className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-1 mt-2 px-3">
            Menu Principal
          </p>
          {(isAdmin ? adminNav : studentNav).map(item => <NavLink key={item.path} item={item} />)}

          {isAdmin && (
            <>
              <p className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-1 mt-4 px-3">
                Administrativo
              </p>
              {adminToolsNav.map(item => <NavLink key={item.path} item={item} />)}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-1">
            {session?.photoUrl ? (
              <img src={session.photoUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                style={{ backgroundColor: avatarBg }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session?.name || 'Usuário'}</p>
              <p className="text-xs text-sidebar-foreground/50">
                {isAdmin ? 'Professor / Admin' : 'Estudante'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Sair da conta"
            className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground w-full px-1 py-2 rounded-lg transition-colors text-sm min-h-[44px]"
          >
            <LogOut size={16} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}