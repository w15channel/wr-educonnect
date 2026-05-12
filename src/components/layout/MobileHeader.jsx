import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import NotificationsBell from '@/components/dashboard/NotificationsBell';
import { Moon, Sun } from 'lucide-react';

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/lessons': 'Aulas',
  '/chat': 'Chat da Turma',
  '/live': 'Sala ao Vivo',
  '/tasks': 'Tarefas e Provas',
  '/forum': 'Fórum de Dúvidas',
  '/students': 'Gestão de Alunos',
  '/announcements': 'Avisos',
  '/profile': 'Meu Perfil',
  '/calendar': 'Calendário',
  '/tuitions': 'Mensalidades',
  '/tutor': 'Tutor Digital EDU',
  '/scorecontrol': 'Controle de Pontuação',
  '/certificadora': 'Certificação',
  '/ranking': 'Ranking Geral',
  '/monitores': 'Monitores',
  '/terapeuta': 'Terapeuta da Semana',
  '/bestseller': 'Meu Best Seller',
  '/historico': 'Histórico Acadêmico',
  '/classe': 'Classe',
};

function stripScopedPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
    return '/' + parts.slice(2).join('/');
  }
  return pathname;
}

export default function MobileHeader() {
  const location = useLocation();
  const { session } = useCustomAuth();
  const sub = stripScopedPrefix(location.pathname);
  const label = routeLabels[sub] || 'WR-EDU';

  const [theme, setTheme] = useState(() => localStorage.getItem('wr_theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    localStorage.setItem('wr_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => prev === 'dark' ? 'light' : 'dark');

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border shrink-0">
      <div className="w-7 h-7 flex items-center justify-center">
        <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png" alt="WR" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-sm font-bold text-white tracking-tight">{label}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 rounded-lg border border-white/30 bg-black/20 text-white shadow-sm hover:bg-white/15" title="Alternar tema">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
        {session?.role === 'admin' && (
          <div className="[&_button]:text-white/70 [&_button:hover]:bg-white/10">
            <NotificationsBell session={session} />
          </div>
        )}
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">WR-EDU</span>
      </div>
    </header>
  );
}