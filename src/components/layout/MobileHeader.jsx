import React from 'react';
import { useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import NotificationsBell from '@/components/dashboard/NotificationsBell';

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

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border shrink-0">
      <div className="w-7 h-7 flex items-center justify-center">
        <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png" alt="WR" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-sm font-bold text-white tracking-tight">{label}</h1>
      <div className="ml-auto flex items-center gap-2">
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