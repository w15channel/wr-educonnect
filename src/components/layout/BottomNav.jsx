import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Play, Video, MessageSquare, LayoutGrid } from 'lucide-react';

const tabs = [
  { icon: BarChart3, label: 'Início', path: '/' },
  { icon: Play, label: 'Aulas', path: '/lessons' },
  { icon: Video, label: 'Live', path: '/live' },
  { icon: MessageSquare, label: 'Fórum', path: '/forum' },
  { icon: LayoutGrid, label: 'Menu', path: '__menu__' },
];

export default function BottomNav({ onMenuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleTabClick = (e, path) => {
    if (isActive(path)) {
      // Already on this tab — reset to root route
      e.preventDefault();
      navigate(path, { replace: true });
      // Scroll the main content to top
      document.querySelector('main')?.querySelector('[class*="overflow-y-auto"]')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border" />
      <div className="relative flex items-stretch">
        {tabs.map(({ icon: Icon, label, path }) => {
          const active = path !== '__menu__' && isActive(path);
          if (path === '__menu__') {
            return (
              <button
                key="menu"
                onClick={onMenuOpen}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] text-white/40 hover:text-white/70 transition-colors"
              >
                <Icon size={20} />
                <span className="text-[9px] font-semibold uppercase tracking-wide">{label}</span>
              </button>
            );
          }
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => handleTabClick(e, path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-colors relative ${
                active ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
              )}
              <Icon size={20} className={active ? 'text-primary' : ''} />
              <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? 'text-white' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}