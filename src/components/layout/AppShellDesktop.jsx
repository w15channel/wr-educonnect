/**
 * AppShellDesktop — shell otimizado para desktop e tablet (>= 768px).
 * Layout: Sidebar fixa à esquerda + área de conteúdo scrollável à direita.
 * Sem BottomNav nem MobileHeader.
 */
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

export default function AppShellDesktop() {
  const { session } = useCustomAuth();
  const location = useLocation();

  return (
    <div className="app-shell-bg flex h-[100dvh] overflow-hidden">
      {/* Persistent sidebar */}
      <div className="shrink-0">
        <Sidebar session={session} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            data-scroll-container
            className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-invisible pb-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex-1 min-h-0 flex flex-col w-full max-w-full">
              <Outlet context={{ user: session, isAdmin: session?.role === 'admin', isStudent: session?.role === 'student' }} />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}