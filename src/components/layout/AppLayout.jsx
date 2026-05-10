import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { setSession as persistSession, getSession } from '@/lib/customAuth';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQueryClient } from '@tanstack/react-query';
import ServiceTermsModal from '../onboarding/ServiceTermsModal';
import TutorialModal from '../onboarding/TutorialModal';
import { useVersionCheck } from '@/hooks/useVersionCheck';

const TERMS_KEY = 'wr_terms_accepted';
const TUTORIAL_KEY = 'wr_tutorial_done';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const PTR_THRESHOLD = 72; // px to pull before triggering refresh

const SLUG_TO_COURSE = { tcc: 'tcc', psi: 'psicanalise', sex: 'sexologia' };
const COURSE_TO_SLUG = { tcc: 'tcc', psicanalise: 'psi', sexologia: 'sex' };

export default function AppLayout() {
  const { session, login } = useCustomAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();

  // Determine role/course from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  const urlRole = pathParts[0]; // 'student' or 'adm'
  const urlCourseSlug = params.courseSlug || pathParts[1];
  const urlCourse = SLUG_TO_COURSE[urlCourseSlug] || null;

  // Guard: no session course → lobby. URL course != session course → sync session to URL course.
  useEffect(() => {
    if (!session) return;
    if (!session.course && !urlCourse) {
      navigate('/lobby');
      return;
    }
    // If URL has a valid course and it differs from session, update session to match URL
    if (urlCourse && urlCourse !== session.course) {
      const current = getSession();
      persistSession({ ...current, course: urlCourse });
      login();
    }
    // Role mismatch protection: if URL says /adm but user is student (or vice versa), redirect
    const expectedRole = session.role === 'admin' ? 'adm' : 'student';
    if (urlRole && (urlRole === 'adm' || urlRole === 'student') && urlRole !== expectedRole) {
      const slug = COURSE_TO_SLUG[session.course] || 'tcc';
      navigate(`/${expectedRole}/${slug}/dashboard`, { replace: true });
    }
  }, [session, urlCourse, urlRole, navigate, login]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isStudent = session?.role === 'student';
  const sessionKey = session?.email || session?.code || '';
  const [showTerms, setShowTerms] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!isStudent || !sessionKey) return;
    const termsKey = `${TERMS_KEY}_${sessionKey}`;
    const tutKey = `${TUTORIAL_KEY}_${sessionKey}`;
    const termsAccepted = localStorage.getItem(termsKey);
    const tutDone = localStorage.getItem(tutKey);
    if (!termsAccepted) {setShowTerms(true);return;}
    if (!tutDone) {setShowTutorial(true);}
  }, [isStudent, sessionKey]);

  const handleTermsAccept = () => {
    const termsKey = `${TERMS_KEY}_${sessionKey}`;
    localStorage.setItem(termsKey, '1');
    setShowTerms(false);
    const tutKey = `${TUTORIAL_KEY}_${sessionKey}`;
    if (!localStorage.getItem(tutKey)) setShowTutorial(true);
  };

  const handleTutorialFinish = () => {
    const tutKey = `${TUTORIAL_KEY}_${sessionKey}`;
    localStorage.setItem(tutKey, '1');
    setShowTutorial(false);
  };

  // Pull-to-refresh state
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
      setTimeout(() => {
        setRefreshing(false);
        setPullY(0);
      }, 600);
    } else {
      setPullY(0);
    }
  }, [pullY, refreshing, queryClient]);

  const showIndicator = pullY > 8;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {showTerms && isStudent &&
      <ServiceTermsModal studentName={session?.name || 'Aluno'} onAccept={handleTermsAccept} />
      }
      {showTutorial && isStudent && !showTerms &&
      <TutorialModal onFinish={handleTutorialFinish} />
      }
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

        







































        

        {/* Mobile bottom nav */}
        <BottomNav onMenuOpen={() => setSidebarOpen(true)} />
      </main>
    </div>);

}