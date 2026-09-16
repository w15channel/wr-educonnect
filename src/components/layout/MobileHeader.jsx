import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';
import ThemeToggle from '@/components/layout/ThemeToggle';

// ── Shared theme util (used by MobileHeader + Sidebar)
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  localStorage.setItem('wr_theme', theme);
  window.dispatchEvent(new CustomEvent('wr-theme-change', { detail: theme }));
}

export function getStoredTheme() {
  return localStorage.getItem('wr_theme') || 'dark';
}

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/lessons': 'Aulas',
  '/chat': 'Mural de Superação',
  '/apostila': 'Apostila',
  '/tasks': 'Tarefas e Provas',
  '/forum': 'Suporte ao Aluno',
  '/students': 'Gestão de Alunos',
  '/announcements': 'Avisos',
  '/profile': 'Meu Perfil',
  '/calendar': 'Calendário',
  '/tuitions': 'Mensalidades',
  '/tutor': 'Luna — Assistente IA',
  '/scorecontrol': 'Controle de Pontuação',
  '/pontuacao-geral': 'Pontuação Geral',
  '/certificadora': 'Certificação',
  '/gerar-certificado': 'Gerar Certificado',
  '/monitores': 'Monitores',
  '/terapeuta': 'Terapeuta da Semana',
  '/bestseller': 'Meu Best Seller',
  '/historico': 'Histórico Acadêmico',
  '/classe': 'Classe',
  '/practice': 'Mentorias',
};

function stripScopedPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  // New flat format: /student/dashboard or /adm/dashboard — strip just the role prefix
  if (parts[0] === 'student' || parts[0] === 'adm') {
    return '/' + parts.slice(1).join('/');
  }
  return pathname;
}

export default function MobileHeader() {
  const location = useLocation();
  const { session } = useCustomAuth();
  const sub = stripScopedPrefix(location.pathname);
  const baseSub = '/' + sub.split('/').filter(Boolean)[0];
  const label = routeLabels[sub] || routeLabels[baseSub] || BRAND_LEGAL_NAME;

  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => setTheme(event.detail || getStoredTheme());
    window.addEventListener('wr-theme-change', syncTheme);
    return () => window.removeEventListener('wr-theme-change', syncTheme);
  }, []);

  const toggleTheme = () => setTheme((prev) => prev === 'dark' ? 'light' : 'dark');

  return (
    <header className="lg:hidden flex items-center gap-3 px-4 bg-sidebar border-b border-sidebar-border shrink-0" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))', paddingBottom: '0.75rem' }}>
      <div className="w-7 h-7 flex items-center justify-center">
        <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">{label}</h1>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <span className="hidden sm:inline text-[9px] font-bold text-white/30 uppercase tracking-widest">{BRAND_LEGAL_NAME}</span>
      </div>
    </header>
  );
}