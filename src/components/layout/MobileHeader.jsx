import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, GraduationCap } from 'lucide-react';

const ROOT_ROUTES = ['/', '/lessons', '/live', '/tasks', '/forum'];

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/lessons': 'Videoaulas',
  '/live': 'Sala ao Vivo',
  '/tasks': 'Tarefas e Provas',
  '/forum': 'Fórum',
  '/announcements': 'Avisos',
  '/profile': 'Meu Perfil',
  '/calendar': 'Calendário',
  '/tuitions': 'Mensalidades',
  '/tutor': 'Tutor Digital',
  '/students': 'Alunos',
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = ROOT_ROUTES.includes(location.pathname);
  const label = ROUTE_LABELS[location.pathname] || 'WR-EDU';

  return (
    <header
      className="flex md:hidden items-center gap-3 px-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-30"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        minHeight: 'calc(52px + env(safe-area-inset-top))',
      }}
    >
      {!isRoot ? (
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2.5 -ml-1 rounded-xl hover:bg-sidebar-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div className="bg-primary p-1.5 rounded-lg">
          <GraduationCap size={18} className="text-primary-foreground" />
        </div>
      )}
      <h1 className="font-bold text-base flex-1 truncate">{label}</h1>
    </header>
  );
}