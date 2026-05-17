/**
 * AppShellMobile — shell otimizado para mobile (browser) e app (WebView/PWA).
 * Layout: Header fixo no topo + conteúdo scrollável + BottomNav fixo.
 * Sem Sidebar (acesso via drawer no BottomNav "Menu").
 */
import React, { useState, useRef, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const PTR_THRESHOLD = 72;

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

export default function AppShellMobile() {
  const { session } = useCustomAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef(null);
  const isPulling = useRef(false);

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

  const showIndicator = pullY > 8;

  return (
    <div className="app-shell-bg flex flex-col h-[100dvh] overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Sidebar drawer (mobile only, opens from BottomNav "Menu") */}
      <Sidebar session={session} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* Fixed top header */}
      <MobileHeader />

      {/* Scrollable content area */}
      <main
        className="flex-1 min-h-0 flex flex-col overflow-hidden relative"
        style={{
          transform: pullY > 0 ? `translateY(${pullY}px)` : undefined,
          transition: isPulling.current ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
        {/* Pull-to-refresh indicator */}
        {showIndicator && (
          <div
            className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none"
            style={{ height: pullY, overflow: 'hidden' }}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}
              style={{ transform: !refreshing ? `rotate(${(pullY / PTR_THRESHOLD) * 270}deg)` : undefined }}
            >
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
            className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-invisible"
            style={{
              paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Outlet context={{ user: session, isAdmin: session?.role === 'admin', isStudent: session?.role === 'student' }} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav onMenuOpen={() => setSidebarOpen(true)} />
    </div>
  );
}