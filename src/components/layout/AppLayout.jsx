import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQueryClient } from '@tanstack/react-query';
import TutorialModal from '../onboarding/TutorialModal';
import MobileSplash from './MobileSplash';

const TUTORIAL_KEY = 'wr_tutorial_done';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const PTR_THRESHOLD = 72;

export default function AppLayout() {
  const { session } = useCustomAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Role guard: /adm/* only for admins, /student/* only for students
  useEffect(() => {
    if (!session) return;
    const pathname = location.pathname;
    const isAdmin = session.role === 'admin';
    if (pathname.startsWith('/adm/') && !isAdmin) {
      navigate('/student/dashboard', { replace: true });
    } else if (pathname.startsWith('/student/') && isAdmin) {
      navigate('/adm/dashboard', { replace: true });
    }
  }, [session, location.pathname, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isStudent = session?.role === 'student';
  const sessionKey = session?.email || session?.code || '';
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!isStudent || !sessionKey) return;
    const tutKey = `${TUTORIAL_KEY}_${sessionKey}`;
    if (!localStorage.getItem(tutKey)) setShowTutorial(true);
  }, [isStudent, sessionKey]);

  const handleTutorialFinish = () => {
    localStorage.setItem(`${TUTORIAL_KEY}_${sessionKey}`, '1');
    setShowTutorial(false);
  };

  // Pull-to-refresh
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
  const isCertPage = location.pathname.endsWith('/certificadora');

  return (
    <div className="flex h-screen bg-background overflow-hidden pt-[env(safe-area-inset-top)] md:pt-0">
      <MobileSplash />
      {showTutorial && isStudent && (
        <TutorialModal onFinish={handleTutorialFinish} />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar session={session} />
      </div>

      {/* Mobile sidebar drawer */}
      <div className="md:hidden">
        <Sidebar session={session} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MobileHeader />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
          {showIndicator && (
            <div
              className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center transition-all pointer-events-none md:hidden"
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
              transition={{ duration: 0.18, ease: 'easeOut' }}
              ref={scrollRef}
              data-scroll-container
              className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden"
              style={{
                paddingBottom: window.innerWidth < 768 && !isCertPage ? 'calc(76px + env(safe-area-inset-bottom))' : undefined,
                transform: pullY > 0 ? `translateY(${pullY}px)` : undefined,
                transition: isPulling.current ? 'none' : 'transform 0.3s ease',
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className={isCertPage ? 'flex-1 min-h-0 flex flex-col' : ''}>
                <Outlet context={{ user: session, isAdmin: session?.role === 'admin', isStudent: session?.role === 'student' }} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav onMenuOpen={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}