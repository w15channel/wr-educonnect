import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';

export default function PortalCourseCard({ course, isAdmin, onEnter }) {
  const Icon = course.icon;
  const actionClass = 'inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-course/40 bg-course/10 px-4 py-3 text-sm font-semibold text-course hover:bg-course/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-course';
  return <article className={`${course.theme} flex h-full flex-col overflow-hidden rounded-2xl border border-course/30 bg-portal-surface`}>
    <div className="relative flex h-36 items-center justify-between overflow-hidden bg-course/10 px-6">
      {course.video && <video src={course.video} muted loop playsInline autoPlay aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
      <Icon size={52} strokeWidth={1.2} className="relative text-course" aria-hidden="true" />
      <span className="relative inline-flex items-center gap-2 rounded-full border border-course/30 bg-portal-background px-3 py-1.5 text-xs font-medium text-course">{!course.available && <Clock3 size={13} />}{course.available ? 'Disponível' : 'Em breve'}</span>
    </div>
    <div className="flex flex-1 flex-col p-6">
      <p className="text-xs text-course">{course.qualification}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-portal-text">{course.title}</h2>
      <p className="mb-6 mt-3 flex-1 text-sm leading-relaxed text-portal-muted">{course.description}</p>
      {course.available ? <button onClick={() => onEnter(course.id)} className={actionClass}>{isAdmin ? 'Gerenciar curso' : 'Entrar no curso'}<ArrowUpRight size={18} /></button> : <Link to={`/courses/${course.id}`} className={actionClass}>Conhecer a formação<ArrowUpRight size={18} /></Link>}
    </div>
  </article>;
}