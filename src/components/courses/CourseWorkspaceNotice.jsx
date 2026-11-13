import React from 'react';
import { Link } from 'react-router-dom';
import { PORTAL_COURSES, canPrepareCourses } from '@/components/courses/portalCourses';

export default function CourseWorkspaceNotice({ session }) {
  const course = PORTAL_COURSES.find(item => item.id === session?.course);
  if (!course || course.available || !canPrepareCourses(session)) return null;
  return <section className={`${course.theme} mx-4 my-3 rounded-xl border border-course/30 bg-course/10 p-4`} aria-label="Curso em preparação">
    <p className="text-sm font-semibold text-course">{course.qualification}</p>
    <p className="mt-1 text-xs text-muted-foreground">{session.role === 'admin' ? 'Área de preparação: edite os conteúdos deste curso.' : 'Visualização do aluno pela conta de professor: as ações realizadas serão registradas nesta conta.'} Este curso continua em breve para os alunos.</p>
    <Link to="/lobby" className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-course underline">Trocar de curso</Link>
  </section>;
}