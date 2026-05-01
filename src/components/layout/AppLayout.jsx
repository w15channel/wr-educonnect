import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const pageVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -24, opacity: 0 },
};

export default function AppLayout() {
  const { session } = useCustomAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen bg-background overflow-hidden"
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar session={session} />
      </div>

      {/* Mobile sidebar (drawer) */}
      <div className="md:hidden">
        <Sidebar session={session} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top header */}
        <MobileHeader />

        <div className="flex-1 overflow-auto pb-[env(safe-area-inset-bottom)] md:pb-0">
          {/* Extra bottom padding on mobile for bottom nav */}
          <div className="pb-16 md:pb-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.18, ease: 'easeInOut' }}
              >
                <Outlet context={{ user: session, isAdmin: session?.role === 'admin', isStudent: session?.role === 'student' }} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav onMenuOpen={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}