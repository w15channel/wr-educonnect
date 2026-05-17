/**
 * AppShellDesktop — layout exclusivo para desktop (>= 1024px).
 *
 * Estrutura:
 * ┌──────────┬───────────────────────────────────────┐
 * │ Sidebar  │  Conteúdo principal com scroll         │
 * │ 224px    │  Sem header fixo — mais área útil       │
 * │ fixa     │  Sem BottomNav                          │
 * └──────────┴───────────────────────────────────────┘
 */
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

export default function AppShellDesktop() {
  const { session } = useCustomAuth();
  const location = useLocation();

  return (
    <div className="app-shell-bg flex h-[100dvh] overflow-hidden">
      {/* Sidebar persistente */}
      <div className="shrink-0 h-full">
        <Sidebar session={session} />
      </div>

      {/* Área de conteúdo */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            data-scroll-container
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-invisible pb-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <Outlet context={{
              user: session,
              isAdmin: session?.role === 'admin',
              isStudent: session?.role === 'student',
              shell: 'desktop',
            }} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}