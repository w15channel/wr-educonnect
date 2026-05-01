import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart, Play, Video, MessageSquare, Menu } from 'lucide-react';

const tabs = [
  { icon: BarChart, label: 'Início', path: '/' },
  { icon: Play, label: 'Aulas', path: '/lessons' },
  { icon: Video, label: 'Live', path: '/live' },
  { icon: MessageSquare, label: 'Fórum', path: '/forum' },
  { icon: Menu, label: 'Menu', path: '__menu__' },
];

export default function BottomNav({ onMenuOpen }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação principal"
    >
      {tabs.map(({ icon: Icon, label, path }) => {
        const active = path !== '__menu__' && isActive(path);
        if (path === '__menu__') {
          return (
            <button
              key="menu"
              onClick={onMenuOpen}
              aria-label="Abrir menu completo"
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        }
        return (
          <Link
            key={path}
            to={path}
            aria-label={label}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors ${
              active
                ? 'text-sidebar-primary'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}