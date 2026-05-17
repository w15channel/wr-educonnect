/**
 * AppShellMobile — layout exclusivo para celular/app (< 768px).
 *
 * Estrutura:
 * ┌──────────────────────────────────────┐
 * │  Header mínimo: logo + título        │
 * ├──────────────────────────────────────┤
 * │  Conteúdo com scroll nativo          │
 * │  Pull-to-refresh                     │
 * ├──────────────────────────────────────┤
 * │  BottomNav com 5 abas + drawer       │
 * └──────────────────────────────────────┘
 *
 * Otimizações mobile-first:
 * - Safe area insets (notch, home bar)
 * - Touch feedback em todos os elementos
 * - Fonte e áreas de toque maiores
 * - Sem sidebar permanente (sempre drawer)
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, Play, Video, MessageSquare, LayoutGrid } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationsBell from '@/components/dashboard/NotificationsBell';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { WR_PRIMARY_LOGO, BRAND_SHORT_NAME } from '@/lib/brand';

const PTR_THRESHOLD = 72;

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

const routeLabels = {
  '/dashboard': 'Dashboard', '/lessons': 'Aulas', '/chat': 'EDU Live Messenger',
  '/live': 'Sala ao Vivo', '/tasks': 'Tarefas', '/forum': 'Fórum',
  '/students': 'Alunos', '/announcements': 'Avisos', '/profile': 'Meu Perfil',
  '/calendar': 'Calendário', '/tuitions': 'Mensalidades', '/tutor': 'Tutor Digital',
  '/scorecontrol': 'Pontuação', '/certificadora': 'Certificação',
  '/ranking': 'Ranking', '/monitores': 'Monitores', '/terapeuta': 'Terapeuta',
  '/bestseller': 'Best Seller', '/historico': 'Histórico', '/classe': 'Classe',
  '/debates': 'Debates', '/tests': 'Provas', '/keys': 'Acessos',
};

function stripPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
    return '/' + parts.slice(2).join('/');
  }
  return pathname;
}

function getPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
    return `/${parts[0]}/${parts[1]}`;
  }
  return '';
}

const STACK_KEY = 'wr_tab_stacks_mobile';
function loadStacks() { try { return JSON.parse(sessionStorage.getItem(STACK_KEY) || '{}'); } catch { return {}; } }
function saveStack(root, path) { const s = loadStacks(); s[root] = path; sessionStorage.setItem(STACK_KEY, JSON.stringify(s)); }

export default function AppShellMobile() {
  const { session } = useCustomAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef(null);
  const isPulling = useRef(false);

  const prefix = getPrefix(location.pathname);
  const sub = stripPrefix(location.pathname);
  const baseSub = '/' + sub.split('/').filter(Boolean)[0];
  const pageTitle = routeLabels[sub] || routeLabels[baseSub] || BRAND_SHORT_NAME;
  const scoped = (p) => prefix + p;

  const tabs = [
    { icon: BarChart3,    label: 'Início', root: '/dashboard' },
    { icon: Play,         label: 'Aulas',  root: '/lessons' },
    { icon: Video,        label: 'Live',   root: '/live' },
    { icon: MessageSquare, label: 'Fórum', root: '/forum' },
    { icon: LayoutGrid,   label: 'Menu',   root: '__menu__' },
  ];

  function getOwnerTab(pathname) {
    const stripped = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) || '/' : pathname;
    if (stripped.startsWith('/lessons')) return '/lessons';
    if (stripped.startsWith('/live'))    return '/live';
    if (stripped.startsWith('/forum'))   return '/forum';
    if (stripped === '/dashboard' || stripped === '/' || stripped === '') return '/dashboard';
    return null;
  }

  const currentOwner = getOwnerTab(location.pathname);

  // Persist tab path
  React.useEffect(() => {
    if (currentOwner) saveStack(currentOwner, location.pathname + location.search);
  }, [location.pathname, location.search, currentOwner]);

  const handleTabPress = (root) => {
    if (root === '__menu__') { setDrawerOpen(true); return; }
    const stacks = loadStacks();
    const isOnThisTab = currentOwner === root;
    const target = scoped(root);
    if (isOnThisTab) {
      if (location.pathname !== target) navigate(target, { replace: true });
      else scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(stacks[root] || target);
    }
  };

  const handleTouchStart = useCallback((e) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && scrollRef.current?.scrollTop === 0) {
      setPullY(Math.min(delta * 0.45, PTR_THRESHOLD + 20));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullY >= PTR_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(PTR_THRESHOLD);
      await queryClient.invalidateQueries();
      setTimeout(() => { setRefreshing(false); setPullY(0); }, 600);
    } else {
      setPullY(0);
    }
  }, [pullY, refreshing, queryClient]);

  return (
    <div className="app-shell-bg flex flex-col h-[100dvh] overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Sidebar como drawer */}
      <Sidebar session={session} mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />

      {/* Header compacto mobile */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 bg-[#07080f] border-b border-[#1e2540]">
        <div className="w-7 h-7 shrink-0">
          <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
        </div>
        <h1 className="flex-1 text-xs font-light text-[#e8dfc8]/80 tracking-[0.18em] uppercase truncate">{pageTitle}</h1>
        {session?.role === 'admin' && (
          <div className="[&_button]:text-[#c8bfa8]/60 shrink-0">
            <NotificationsBell session={session} />
          </div>
        )}
      </header>

      {/* Main scrollável */}
      <main
        className="flex-1 min-h-0 flex flex-col overflow-hidden relative"
        style={{
          transform: pullY > 0 ? `translateY(${pullY}px)` : undefined,
          transition: isPulling.current ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
        {pullY > 8 && (
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none" style={{ height: pullY, overflow: 'hidden' }}>
            <div className={`w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}
              style={{ transform: !refreshing ? `rotate(${(pullY / PTR_THRESHOLD) * 270}deg)` : undefined }}>
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.16, ease: 'easeOut' }}
            ref={scrollRef}
            data-scroll-container
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-invisible"
            style={{
              paddingBottom: 'calc(60px + env(safe-area-inset-bottom))',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Outlet context={{
              user: session,
              isAdmin: session?.role === 'admin',
              isStudent: session?.role === 'student',
              shell: 'mobile',
            }} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav mobile — touch-optimized */}
      <nav className="shrink-0 bg-[#07080f]/98 border-t border-[#1e2540] backdrop-blur-xl z-40 relative"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch">
          {tabs.map(({ icon: Icon, label, root }) => {
            const active = currentOwner === root;
            return (
              <button
                key={root}
                onClick={() => handleTabPress(root)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors relative active:scale-95 ${
                  active ? 'text-[#e8dfc8]' : 'text-white/35 hover:text-white/60'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {active && root !== '__menu__' && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[#d4b96a]" />
                )}
                <Icon size={20} className={active && root !== '__menu__' ? 'text-[#d4b96a]' : ''} />
                <span className={`text-[9px] font-semibold uppercase tracking-wide ${active && root !== '__menu__' ? 'text-[#d4b96a]' : ''}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}