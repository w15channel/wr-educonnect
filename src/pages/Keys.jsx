import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Key } from 'lucide-react';
import CodeManager from '@/components/admin/CodeManager';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';

const COURSE_LABEL = { tcc: 'TC', psicanalise: 'Psicanalista Freudiano', sexologia: 'Sexólogo(a)' };

export default function Keys() {
  const { user: session } = useOutletContext() || {};
  const { course: routeCourse } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';
  const label = COURSE_LABEL[activeCourse] || activeCourse;

  return (
    <div className="app-page app-page--compact animate-fade-in-up">
      <div className="mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
          <Key size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Códigos de Acesso — {label}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gere e gerencie os códigos de acesso desta turma. Apenas códigos de <strong>{label}</strong> são exibidos aqui.
          </p>
        </div>
      </div>
      <CodeManager course={activeCourse} />
    </div>
  );
}