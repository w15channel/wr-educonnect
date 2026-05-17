/**
 * AppLayout — roteador de shells adaptativos.
 *
 * ┌────────────────────────────────────────────────────────┐
 * │  desktop / tablet (≥ 768px)  →  AppShellDesktop        │
 * │  mobile browser  (< 768px)   →  AppShellMobile         │
 * │  app / WebView / PWA         →  AppShellMobile          │
 * └────────────────────────────────────────────────────────┘
 *
 * Cada shell é totalmente independente e otimizado para seu
 * ambiente, sem precisar de hacks de CSS ou media-queries
 * para "desfazer" comportamentos do outro.
 */
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { setSession as persistSession, getSession } from '@/lib/customAuth';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import AppShellDesktop from './AppShellDesktop';
import AppShellMobile from './AppShellMobile';
import TutorialModal from '../onboarding/TutorialModal';
import MobileSplash from './MobileSplash';
import { useState } from 'react';

const TUTORIAL_KEY = 'wr_tutorial_done';
const SLUG_TO_COURSE = { tcc: 'tcc', psi: 'psicanalise', sex: 'sexologia' };
const COURSE_TO_SLUG = { tcc: 'tcc', psicanalise: 'psi', sexologia: 'sex' };

export default function AppLayout() {
  const { session, login } = useCustomAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { isMobile } = useDeviceType();

  // Determine role/course from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  const urlRole = pathParts[0];
  const urlCourseSlug = params.courseSlug || pathParts[1];
  const urlCourse = SLUG_TO_COURSE[urlCourseSlug] || null;

  // Guard: sync session course with URL course; redirect if role mismatch
  useEffect(() => {
    if (!session) return;
    if (!session.course && !urlCourse) {
      navigate('/lobby');
      return;
    }
    if (urlCourse && urlCourse !== session.course) {
      const current = getSession();
      persistSession({ ...current, course: urlCourse });
      login();
    }
    const expectedRole = session.role === 'admin' ? 'adm' : 'student';
    if (urlRole && (urlRole === 'adm' || urlRole === 'student') && urlRole !== expectedRole) {
      const slug = COURSE_TO_SLUG[session.course] || 'tcc';
      navigate(`/${expectedRole}/${slug}/dashboard`, { replace: true });
    }
  }, [session, urlCourse, urlRole, navigate, login]);

  // Tutorial for new students
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

  return (
    <>
      <MobileSplash />
      {showTutorial && isStudent && (
        <TutorialModal onFinish={handleTutorialFinish} />
      )}

      {/* Adaptive shell: mobile/app vs desktop/tablet */}
      {isMobile ? <AppShellMobile /> : <AppShellDesktop />}
    </>
  );
}