import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, Video, MessageSquare, FileText, 
  BarChart, Users, LogOut, Play, Menu, X, Bell, User, Key
} from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';

export default function Sidebar({ session }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useCustomAuth();
  const isAdmin = session?.role === 'admin';

  const navItems = [
    { icon: BarChart, label: 'Dashboard', path: '/' },
    { icon: Play, label: 'Aulas Gravadas', path: '/lessons' },
    { icon: Video, label: 'Sala ao Vivo', path: '/live' },
    { icon: FileText, label: 'Tarefas e Provas', path: '/tasks' },
    { icon: MessageSquare, label: 'Fórum de Dúvidas', path: '/forum' },
    ...(isAdmin ? [
      { icon: Users, label: 'Gestão de Alunos', path: '/students' },
      { icon: Key, label: 'Códigos de Acesso', path: '/students?tab=codes' },
    ] : []),
    { icon: Bell, label: 'Avisos', path: '/announcements' },
    ...(!isAdmin ? [{ icon: User, label: 'Meu Perfil', path: '/profile' }] : []),
  ];

  const initials = session?.name
    ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const avatarBg = session?.avatarColor || (isAdmin ? '#6366f1' : '#8b5cf6');

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground shadow-lg"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar text-sidebar-foreground flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <BookOpen size={22} className="text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">EduConnect</h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-sidebar-foreground/60">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 flex flex-col gap-1 flex-grow overflow-y-auto">
          <p className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2 mt-3 px-3">
            Menu Principal
          </p>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path.includes('?') && location.pathname === item.path.split('?')[0] && location.search.includes(item.path.split('?')[1]));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <item.icon size={19} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session?.name || 'Usuário'}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">
                {isAdmin ? 'Professor / Admin' : 'Estudante'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground w-full px-1 py-2 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}