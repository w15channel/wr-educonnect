/**
 * AppShellTablet — layout exclusivo para tablet (768px–1023px).
 *
 * Estrutura:
 * ┌──────────────────────────────────────────────────┐
 * │  Header compacto com logo + título + actions      │
 * ├──────────────────────────────────────────────────┤
 * │  Conteúdo principal com scroll                    │
 * │  Sidebar disponível como drawer lateral           │
 * ├──────────────────────────────────────────────────┤
 * │  TabBar inferior com 5 atalhos (não full BottomNav)│
 * └──────────────────────────────────────────────────┘
 */
import React, { useState, useRef, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, Play, BookOpen, MessageSquare, LayoutGrid } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationsBell from '@/components/dashboard/NotificationsBell';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { WR_PRIMARY_LOGO, BRAND_SHORT_NAME } from '@/lib/brand';

const PTR_THRESHOLD = 60;

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -8 },
};

const routeLabels = {
  '/dashboard': 'Dashboard', '/lessons': 'Aulas', '/chat': 'Messenger',
  '/apostila': 'Apostila', '/tasks': 'Tarefas', '/forum': 'Fórum',
  '/students': 'Alunos', '/announcements': 'Avisos', '/profile': 'Perfil',
  '/calendar': 'Calendário', '/tuitions': 'Mensalidades', '/tutor': 'Tutor EDU',
  '/scorecontrol': 'Pontuação', '/certificadora': 'Certificação', '/gerar-certificado': 'Gerar Certificado',
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

export default function AppShellTablet() {
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
    { icon: BarChart3, label: 'Início',  root: '/dashboard' },
    { icon: Play,      label: 'Aulas',   root: '/lessons' },
    { icon: BookOpen,  label: 'Apostila', root: '/apostila' },
    { icon: MessageSquare, label: 'Fórum', root: '/forum' },
    { icon: LayoutGrid, label: 'Menu',   root: '__menu__' },
  ];

  function getOwnerTab(pathname) {
    const stripped = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) || '/' : pathname;
    if (stripped.startsWith('/lessons')) return '/lessons';
    if (stripped.startsWith('/apostila')) return '/apostila';
    if (stripped.startsWith('/forum'))   return '/forum';
    if (stripped === '/dashboard' || stripped === '/' || stripped === '') return '/dashboard';
    return null;
  }

  const currentOwner = getOwnerTab(location.pathname);

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
      setPullY(Math.min(delta * 0.4, PTR_THRESHOLD + 16));
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
    <div className="app-shell-bg flex flex-col h-[100dvh] overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Sidebar drawer */}
      <Sidebar session={session} mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />

      {/* Header tablet — mais largo que mobile, mostra título e breadcrumb */}
      <header className="shrink-0 flex items-center gap-4 px-6 py-3.5 bg-[#07080f] border-b border-[#1e2540]">
        <div className="w-8 h-8 shrink-0">
          <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#c8bfa8]/30 uppercase tracking-[0.2em] font-light leading-none mb-0.5">{BRAND_SHORT_NAME}</p>
          <h1 className="text-sm font-light text-[#e8dfc8]/80 tracking-[0.12em] uppercase truncate">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {session?.role === 'admin' && (
            <div className="[&_button]:text-[#c8bfa8]/60">
              <NotificationsBell session={session} />
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] font-light text-[#e8dfc8]/60 tracking-wide truncate max-w-[140px]">{session?.name}</p>
            <p className="text-[9px] text-[#c8bfa8]/25 uppercase tracking-[0.15em]">{session?.role === 'admin' ? 'Admin' : 'Aluno'}</p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main
        className="flex-1 min-h-0 flex flex-col overflow-hidden relative"
        style={{
          transform: pullY > 0 ? `translateY(${pullY}px)` : undefined,
          transition: isPulling.current ? 'none' : 'transform 0.28s ease',
        }}
      >
        {pullY > 8 && (
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none" style={{ height: pullY }}>
            <div className={`w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary ${refreshing ? 'animate-spin' : ''}`}
              style={{ transform: !refreshing ? `rotate(${(pullY / PTR_THRESHOLD) * 270}deg)` : undefined }} />
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            ref={scrollRef}
            data-scroll-container
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-invisible"
            style={{
              paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
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
              shell: 'tablet',
            }} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Tab bar tablet — ícones maiores, labels visíveis */}
      <nav className="shrink-0 bg-[#07080f]/97 border-t border-[#1e2540] backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch">
          {tabs.map(({ icon: Icon, label, root }) => {
            if (root === '__menu__') {
              return (
                <button key="menu" onClick={() => setDrawerOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 min-h-[58px] text-white/40 hover:text-white/70 transition-colors">
                  <Icon size={22} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                </button>
              );
            }
            const active = currentOwner === root;
            return (
              <button key={root} onClick={() => navigate(scoped(root))}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 min-h-[58px] transition-colors relative ${active ? 'text-[#e8dfc8]' : 'text-white/35 hover:text-white/60'}`}>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full bg-[#d4b96a]" />}
                <Icon size={22} className={active ? 'text-[#d4b96a]' : ''} />
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? 'text-[#d4b96a]' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}