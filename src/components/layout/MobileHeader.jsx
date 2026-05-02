import React from 'react';
import { useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const routeLabels = {
  '/': 'Dashboard',
  '/lessons': 'Videoaulas',
  '/live': 'Sala ao Vivo',
  '/tasks': 'Tarefas e Provas',
  '/forum': 'Fórum de Dúvidas',
  '/students': 'Gestão de Alunos',
  '/announcements': 'Avisos',
  '/profile': 'Meu Perfil',
  '/calendar': 'Calendário',
  '/tuitions': 'Mensalidades',
  '/tutor': 'Tutor Digital EDU',
};

export default function MobileHeader() {
  const location = useLocation();
  const label = routeLabels[location.pathname] || 'WR-EDU';

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border shrink-0">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30">
        <GraduationCap size={14} className="text-white" />
      </div>
      <h1 className="text-sm font-bold text-white tracking-tight">{label}</h1>
      <div className="ml-auto">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">WR-EDU</span>
      </div>
    </header>
  );
}