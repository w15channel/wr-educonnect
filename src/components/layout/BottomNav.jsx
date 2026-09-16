import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Play, FileText, LayoutGrid, BookOpen } from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const tabs = [
  { icon: BarChart3,    label: 'Início',   root: '/dashboard' },
  { icon: Play,         label: 'Aulas',   root: '/lessons' },
  { icon: BookOpen,     label: 'Apostila', root: '/apostila' },
  { icon: FileText,     label: 'Tarefas', root: '/tasks' },
  { icon: LayoutGrid,   label: 'Menu',    root: '__menu__' },
];

function getOwnerTab(pathname, base) {
  const stripped = pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  if (stripped.startsWith('/lessons'))  return '/lessons';
  if (stripped.startsWith('/apostila')) return '/apostila';
  if (stripped.startsWith('/tasks'))    return '/tasks';
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
  const { session } = useCustomAuth();

  const base = session?.role === 'admin' ? '/adm' : '/student';
  const currentOwner = getOwnerTab(location.pathname, base);

  useEffect(() => {
    if (currentOwner) saveStack(currentOwner, location.pathname + location.search);
  }, [location.pathname, location.search, currentOwner]);

  const handleTabPress = (root) => {
    const target = base + root;
    const isOnThisTab = currentOwner === root;

    if (isOnThisTab) {
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      } else {
        document.querySelector('[data-scroll-container]')?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      const saved = loadStacks()[root];
      navigate(saved || target);
    }
  };

  return (
    <nav
      className="shell-bar-glass shrink-0 border-t z-40 lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(60px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-stretch h-[60px]">
        {tabs.map(({ icon: Icon, label, root }) => {
          if (root === '__menu__') {
            return (
              <button
                key="menu"
                onClick={onMenuOpen}
                className="nav-shortcut-muted flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
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
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors relative ${
                active ? 'text-sidebar-primary' : 'nav-shortcut-muted'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
              )}
              <Icon size={20} className={active ? 'text-primary' : ''} />
              <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? 'text-sidebar-primary' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}