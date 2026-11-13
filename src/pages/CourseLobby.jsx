import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { setSession, getSession } from '@/lib/customAuth';
import useSocialIdentity from '@/hooks/useSocialIdentity';
import { PORTAL_COURSES, portalStudyPath, canPrepareCourses } from '@/components/courses/portalCourses';
import { useQueryClient } from '@tanstack/react-query';
import PortalHeader from '@/components/courses/PortalHeader';
import PortalCourseCard from '@/components/courses/PortalCourseCard';
import PortalModelNotice from '@/components/courses/PortalModelNotice';
import PortalAccountLinks from '@/components/courses/PortalAccountLinks';

export default function CourseLobby() {
  const navigate = useNavigate();
  const { session, login, isAdmin } = useCustomAuth();
  const { firstName, isLoading } = useSocialIdentity(session);
  useEffect(() => { localStorage.setItem('wr_lobby_music_enabled', 'off'); }, []);
  const queryClient = useQueryClient();
  const staffAccess = canPrepareCourses(session);
  const enterCourse = (id) => {
    if (!PORTAL_COURSES.some(course => course.id === id && (course.available || staffAccess))) return;
    const next = { ...getSession(), course: id };
    setSession(next, { remember: !!localStorage.getItem('educonnect_session') });
    queryClient.clear();
    login();
    navigate(`${portalStudyPath(next)}/dashboard`);
  };
  return <div className="portal-shell h-[100dvh] overflow-y-auto bg-portal-background text-portal-text">
    <PortalHeader />
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:py-12">
      <section>
        <p className="text-xs uppercase tracking-widest text-course">{isAdmin ? 'Gestão das formações' : 'Seu espaço de aprendizagem'}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{isAdmin ? 'Todos os cursos, um só portal.' : isLoading ? 'Preparando seu espaço…' : `Olá, ${firstName}!`}</h1>
        <p className="mb-5 mt-3 max-w-2xl text-sm leading-relaxed text-portal-muted">Escolha sua formação e continue aprendendo. Novos temas, novas cores e o mesmo lugar para você se desenvolver.</p>
        <PortalAccountLinks session={session} />
      </section>
      <section aria-label="Cursos do portal" className="grid gap-5 sm:grid-cols-2">
        {PORTAL_COURSES.map(course => <PortalCourseCard key={course.id} course={course} isAdmin={isAdmin} staffAccess={staffAccess} onEnter={enterCourse} />)}
      </section>
      <PortalModelNotice />
    </main>
  </div>;
}