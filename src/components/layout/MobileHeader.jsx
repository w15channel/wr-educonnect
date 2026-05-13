import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import NotificationsBell from '@/components/dashboard/NotificationsBell';

import { BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/lessons': 'Aulas',
  '/chat': 'EDU Live Messenger',
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
  const baseSub = '/' + sub.split('/').filter(Boolean)[0];
  const label = routeLabels[sub] || routeLabels[baseSub] || BRAND_LEGAL_NAME;

  // Cosmos theme is always dark — force it once
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#07080f] border-b border-[#1e2540] shrink-0 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="w-7 h-7 flex items-center justify-center">
        <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-xs font-light text-[#e8dfc8]/80 tracking-[0.18em] uppercase">{label}</h1>
      <div className="ml-auto flex items-center gap-2">
        {session?.role === 'admin' && (
          <div className="[&_button]:text-[#c8bfa8]/60 [&_button:hover]:bg-white/8">
            <NotificationsBell session={session} />
          </div>
        )}
        <span className="hidden sm:inline text-[9px] font-light text-[#c8bfa8]/25 uppercase tracking-[0.2em]">{BRAND_LEGAL_NAME}</span>
      </div>
    </header>
  );
}