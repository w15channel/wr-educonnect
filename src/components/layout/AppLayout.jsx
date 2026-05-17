/**
 * AppLayout — roteador de shells por dispositivo.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  desktop  (>= 1024px)  →  AppShellDesktop                    │
 * │  tablet   (768-1023px) →  AppShellTablet                     │
 * │  mobile   (< 768px)    →  AppShellMobile  (browser)          │
 * │  app      (< 768px)    →  AppShellMobile  (WebView / PWA)    │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Cada shell é completamente independente:
 * - Layout próprio, sem hacks de CSS entre dispositivos
 * - Experiência nativa para cada tipo de acesso
 * - Contexto `shell` disponível via useOutletContext()
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { setSession as persistSession, getSession } from '@/lib/customAuth';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import AppShellDesktop from './AppShellDesktop';
import AppShellTablet from './AppShellTablet';
import AppShellMobile from './AppShellMobile';
import TutorialModal from '../onboarding/TutorialModal';
import MobileSplash from './MobileSplash';

const TUTORIAL_KEY = 'wr_tutorial_done';
const SLUG_TO_COURSE = { tcc: 'tcc', psi: 'psicanalise', sex: 'sexologia' };
const COURSE_TO_SLUG = { tcc: 'tcc', psicanalise: 'psi', sexologia: 'sex' };

export default function AppLayout() {
  const { session, login } = useCustomAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { deviceType, isMobile, isTablet, isDesktop } = useDeviceType();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const urlRole = pathParts[0];
  const urlCourseSlug = params.courseSlug || pathParts[1];
  const urlCourse = SLUG_TO_COURSE[urlCourseSlug] || null;

  // Sincroniza sessão com curso da URL e protege por role
  useEffect(() => {
    if (!session) return;
    if (!session.course && !urlCourse) { navigate('/lobby'); return; }
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

  // Tutorial para novos alunos
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

  // Seleciona o shell correto para cada tipo de dispositivo
  function Shell() {
    if (isDesktop) return <AppShellDesktop />;
    if (isTablet)  return <AppShellTablet />;
    return <AppShellMobile />;        // mobile browser + app (WebView/PWA)
  }

  return (
    <>
      {/* Splash screen apenas para mobile/app */}
      {isMobile && <MobileSplash />}

      {/* Tutorial onboarding para novos alunos */}
      {showTutorial && isStudent && (
        <TutorialModal onFinish={handleTutorialFinish} />
      )}

      {/* Shell adaptado ao dispositivo */}
      <Shell />
    </>
  );
}