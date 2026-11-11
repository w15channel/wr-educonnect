import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Play, FileText, LayoutGrid, BookOpen } from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const allTabs = [
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

  const isAdmin = session?.role === 'admin';
  const base = isAdmin ? '/adm' : '/student';
  // Alunos não veem o atalho de Aulas (gravação indisponível);
  // a Apostila já cobre o conteúdo de estudo.
  const tabs = isAdmin ? allTabs : allTabs.filter((t) => t.root !== '/lessons');
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
      className="shell-bar-glass relative shrink-0 z-40 lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(62px + env(safe-area-inset-bottom))',
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ backgroundImage: 'linear-gradient(90deg, transparent, hsl(var(--sidebar-primary) / 0.45), transparent)' }}
      />
      <div className="flex h-[62px] items-stretch">
        {tabs.map(({ icon: Icon, label, root }) => {
          if (root === '__menu__') {
            return (
              <button
                key="menu"
                onClick={onMenuOpen}
                className="nav-shortcut-muted group flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              >
                <span className="flex h-7 w-10 items-center justify-center rounded-lg transition-colors group-hover:bg-sidebar-accent/60">
                  <Icon size={19} />
                </span>
                <span className="text-[8.5px] font-semibold uppercase tracking-[0.1em]">{label}</span>
              </button>
            );
          }

          const active = currentOwner === root;
          return (
            <button
              key={root}
              onClick={() => handleTabPress(root)}
              className={`group relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                active ? 'text-sidebar-primary' : 'nav-shortcut-muted'
              }`}
            >
              <span
                className={`flex h-7 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                  active ? 'bg-sidebar-primary/15' : 'group-hover:bg-sidebar-accent/60'
                }`}
              >
                <Icon size={19} className={active ? 'text-sidebar-primary' : ''} />
              </span>
              <span className={`text-[8.5px] font-semibold uppercase tracking-[0.1em] ${active ? 'text-sidebar-primary' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-b-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}