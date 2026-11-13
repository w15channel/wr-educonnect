import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { setSession, getSession } from '@/lib/customAuth';
import useSocialIdentity from '@/hooks/useSocialIdentity';
import { PORTAL_COURSES, portalStudyPath, canPrepareCourses } from '@/components/courses/portalCourses';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpenCheck, BriefcaseBusiness, GraduationCap, Layers3 } from 'lucide-react';
import PortalHeader from '@/components/courses/PortalHeader';
import PortalCourseCard from '@/components/courses/PortalCourseCard';
import PortalModelNotice from '@/components/courses/PortalModelNotice';
import PortalAccountLinks from '@/components/courses/PortalAccountLinks';

const DIVISIONS = [
  {
    id: 'educacionais',
    title: 'Cursos Educacionais',
    description: 'Percursos de aprendizagem e aprofundamento em diferentes áreas do conhecimento.',
    icon: GraduationCap,
    label: 'Novos percursos em preparação',
    style: 'from-sky-500/15 via-blue-500/5 to-transparent border-sky-400/30 text-sky-300',
  },
  {
    id: 'profissionalizantes',
    title: 'Cursos Profissionalizantes',
    description: 'Formações com conteúdo, atividades e percursos próprios para desenvolver competências profissionais.',
    icon: BriefcaseBusiness,
    label: 'Acessar formações disponíveis',
    style: 'from-violet-500/15 via-fuchsia-500/5 to-transparent border-violet-400/30 text-violet-300',
  },
];

export default function CourseLobby() {
  const navigate = useNavigate();
  const { session, login, isAdmin } = useCustomAuth();
  const { firstName, isLoading } = useSocialIdentity(session);
  const [selectedDivisionId, setSelectedDivisionId] = useState(null);
  useEffect(() => { localStorage.setItem('wr_lobby_music_enabled', 'off'); }, []);
  const queryClient = useQueryClient();
  const staffAccess = canPrepareCourses(session);
  const selectedDivision = DIVISIONS.find((division) => division.id === selectedDivisionId);
  const divisionCourses = selectedDivision
    ? PORTAL_COURSES.filter((course) => course.division === selectedDivision.id)
    : [];

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
        <p className="mb-5 mt-3 max-w-2xl text-sm leading-relaxed text-portal-muted">Escolha uma área para explorar os percursos disponíveis. Seu perfil e acesso continuam reunidos em um só lugar.</p>
        <PortalAccountLinks session={session} />
      </section>

      {!selectedDivision ? (
        <section aria-labelledby="course-divisions-title" className="space-y-4">
          <div className="flex items-center gap-2 text-portal-muted">
            <Layers3 size={17} aria-hidden="true" />
            <h2 id="course-divisions-title" className="text-sm font-semibold uppercase tracking-wider">Escolha uma área de formação</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {DIVISIONS.map(({ id, title, description, icon: Icon, label, style }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedDivisionId(id)}
                className={`group relative flex min-h-56 flex-col overflow-hidden rounded-3xl border bg-gradient-to-br ${style} p-6 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-course sm:p-8`}
                aria-label={`Abrir ${title}`}
              >
                <div className="flex w-full items-start justify-between gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-current/20 bg-black/10">
                    <Icon size={28} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <ArrowRight size={21} className="mt-1 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold tracking-tight text-portal-text sm:text-3xl">{title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-portal-muted">{description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                    <BookOpenCheck size={14} aria-hidden="true" />{label}
                  </span>
                </div>
                <div className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full border border-current/10 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section aria-labelledby="selected-division-title" className="space-y-5">
          <button
            type="button"
            onClick={() => setSelectedDivisionId(null)}
            className="inline-flex items-center gap-2 rounded-full border border-portal-muted/20 bg-portal-surface px-4 py-2 text-sm font-medium text-portal-text transition hover:border-course/40 hover:text-course focus-visible:outline focus-visible:outline-2 focus-visible:outline-course"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Voltar às áreas
          </button>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-course">Área selecionada</p>
              <h2 id="selected-division-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{selectedDivision.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-portal-muted">{selectedDivision.description}</p>
            </div>
            {divisionCourses.length > 0 && <span className="rounded-full border border-portal-muted/20 bg-portal-surface px-3 py-1.5 text-xs text-portal-muted">{divisionCourses.length} {divisionCourses.length === 1 ? 'curso' : 'cursos'}</span>}
          </div>

          {divisionCourses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {divisionCourses.map(course => <PortalCourseCard key={course.id} course={course} isAdmin={isAdmin} staffAccess={staffAccess} onEnter={enterCourse} />)}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 via-portal-surface to-portal-surface p-7 sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300">
                <GraduationCap size={25} aria-hidden="true" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-sky-300">Em estruturação</p>
              <h3 className="mt-2 text-xl font-semibold text-portal-text sm:text-2xl">Novos cursos educacionais chegarão aqui.</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-portal-muted">Esta área já está preparada para receber cursos educacionais. Quando forem cadastrados, aparecerão aqui sem misturar seus conteúdos com as formações profissionalizantes.</p>
            </div>
          )}
        </section>
      )}

      <PortalModelNotice />
    </main>
  </div>;
}
