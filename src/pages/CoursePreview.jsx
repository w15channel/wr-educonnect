import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, BookOpen, ClipboardList, Headphones, GraduationCap } from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { PORTAL_COURSES } from '@/components/courses/portalCourses';
import PortalHeader from '@/components/courses/PortalHeader';
import PortalAccountLinks from '@/components/courses/PortalAccountLinks';

const resources = [{ icon: BookOpen, label: 'Apostila e trilha de estudo' }, { icon: ClipboardList, label: 'Atividades e provas' }, { icon: Headphones, label: 'Podcasts' }, { icon: GraduationCap, label: 'Histórico e carga horária' }];
export default function CoursePreview() {
  const { courseId } = useParams();
  const { session } = useCustomAuth();
  const course = PORTAL_COURSES.find(item => item.id === courseId);
  useEffect(() => {
    if (course) return;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code'; meta.content = '404';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [course]);
  if (course?.available) return <Navigate to="/lobby" replace />;
  const Icon = course?.icon || BookOpen;
  return <div className={`portal-shell ${course?.theme || ''} h-[100dvh] overflow-y-auto bg-portal-background text-portal-text`}>
    <PortalHeader />
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:py-12">
      <Link to="/lobby" className="inline-flex min-h-11 items-center gap-2 rounded text-sm text-course hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-course"><ArrowLeft size={16} /> Voltar aos meus cursos</Link>
      {!course ? <h1 className="text-3xl font-semibold">Curso não encontrado</h1> : <>
        <section className="rounded-2xl border border-course/30 bg-course/10 p-6 sm:p-10">
          <Icon size={56} strokeWidth={1.2} className="text-course" aria-hidden="true" />
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-course"><Clock3 size={16} /> Em breve estará disponível</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">{course.qualification}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-portal-muted">{course.description}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-portal-muted">Estamos preparando esta formação. Você poderá voltar pelo lobby com o mesmo cadastro e código de acesso, sem uma nova matrícula quando o curso for liberado.</p>
        </section>
        <section aria-labelledby="course-resources"><h2 id="course-resources" className="text-lg font-semibold">A mesma dinâmica, um novo tema</h2><p className="mt-2 text-sm text-portal-muted">Recursos previstos para a abertura do curso. As atividades ainda não estão disponíveis.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">{resources.map(({ icon: ResourceIcon, label }) => <li key={label} className="flex items-center gap-3 rounded-xl border border-course/20 bg-portal-surface p-4"><ResourceIcon size={20} className="shrink-0 text-course" /><span className="flex-1 text-sm">{label}</span><span className="text-xs text-portal-muted">Em breve</span></li>)}</ul>
          <p className="mt-4 text-sm leading-relaxed text-portal-muted">O histórico desta formação começará com suas próprias atividades e horas após a liberação. Esta apresentação não altera nem transfere seus registros do curso atual.</p>
        </section>
        <section><h2 className="mb-4 text-lg font-semibold">Continue usando sua conta</h2><PortalAccountLinks session={session} /></section>
      </>}
    </main>
  </div>;
}