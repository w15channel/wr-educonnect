import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function AppLayout() {
  const { session } = useCustomAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar session={session} />
      </div>

      {/* Mobile sidebar drawer */}
      <div className="md:hidden">
        <Sidebar session={session} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top header */}
        <MobileHeader />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden"
              style={{ paddingBottom: location.pathname !== '/certificadora' ? 'calc(76px + env(safe-area-inset-bottom))' : undefined }}
            >
              <div className={location.pathname === '/certificadora' ? 'flex-1 min-h-0 flex flex-col' : ''}>
                <Outlet context={{ user: session, isAdmin: session?.role === 'admin', isStudent: session?.role === 'student' }} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav onMenuOpen={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}