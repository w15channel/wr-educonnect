import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Play, Video, MessageSquare, LayoutGrid, BookOpen } from 'lucide-react';

function getPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
    return `/${parts[0]}/${parts[1]}`;
  }
  return '';
}

// Root path for each tab (relative within scoped prefix)
const tabs = [
  { icon: BarChart3, label: 'Início',   root: '/dashboard' },
  { icon: Play,      label: 'Aulas',    root: '/lessons' },
  { icon: BookOpen,  label: 'Apostila', root: '/apostila' },
  { icon: MessageSquare, label: 'Fórum', root: '/forum' },
  { icon: LayoutGrid, label: 'Menu',    root: '__menu__' },
];

// Which tab "owns" a given pathname (after stripping the scoped prefix)
function getOwnerTab(pathname, prefix) {
  const stripped = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) || '/' : pathname;
  if (stripped.startsWith('/lessons'))  return '/lessons';
  if (stripped.startsWith('/live'))     return '/live';
  if (stripped.startsWith('/apostila')) return '/apostila';
  if (stripped.startsWith('/forum'))    return '/forum';
  if (stripped === '/dashboard' || stripped === '/' || stripped === '') return '/dashboard';
  return null;
}

const STACK_KEY = 'wr_tab_stacks';

function loadStacks() {
  try { return JSON.parse(sessionStorage.getItem(STACK_KEY) || '{}'); } catch { return {}; }
}

function saveStack(root, path) {
  const stacks = loadStacks();
  stacks[root] = path;
  sessionStorage.setItem(STACK_KEY, JSON.stringify(stacks));
}

export default function BottomNav({ onMenuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const prefix = useMemo(() => getPrefix(location.pathname), [location.pathname]);
  const currentOwner = getOwnerTab(location.pathname, prefix);
  const scoped = (p) => prefix + p;

  // Persist current path for its owning tab
  useEffect(() => {
    if (currentOwner) saveStack(currentOwner, location.pathname + location.search);
  }, [location.pathname, location.search, currentOwner]);

  const handleTabPress = (root) => {
    const stacks = loadStacks();
    const isOnThisTab = currentOwner === root;
    const target = scoped(root);

    if (isOnThisTab) {
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      } else {
        document.querySelector('[data-scroll-container]')?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      const saved = stacks[root];
      navigate(saved || target);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="absolute inset-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border" />
      <div className="relative flex items-stretch">
        {tabs.map(({ icon: Icon, label, root }) => {
          if (root === '__menu__') {
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

          const active = currentOwner === root;
          return (
            <button
              key={root}
              onClick={() => handleTabPress(root)}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}