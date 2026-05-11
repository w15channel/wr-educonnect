import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import NotificationsBell from '@/components/dashboard/NotificationsBell';
import { Moon, Sun } from 'lucide-react';
import { BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

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
  const label = routeLabels[sub] || BRAND_LEGAL_NAME;

  const [theme, setTheme] = useState(() => localStorage.getItem('wr_theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    localStorage.setItem('wr_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => prev === 'dark' ? 'light' : 'dark');

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border shrink-0 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="w-7 h-7 flex items-center justify-center">
        <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-sm font-bold text-white tracking-tight">{label}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-white/30 bg-white/20 text-white hover:bg-white/30 shadow-sm"
          title="Alternar tema"
          aria-label="Alternar tema claro e escuro"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {session?.role === 'admin' && (
          <div className="[&_button]:text-white/70 [&_button:hover]:bg-white/10">
            <NotificationsBell session={session} />
          </div>
        )}
        <span className="hidden sm:inline text-[9px] font-bold text-white/30 uppercase tracking-widest">{BRAND_LEGAL_NAME}</span>
      </div>
    </header>
  );
}
