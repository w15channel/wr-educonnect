import React from 'react';
import { KeyRound, Users, BookOpen } from 'lucide-react';

const principles = [
  { icon: KeyRound, title: 'Um único acesso', text: 'Seu cadastro e código continuam sendo a sua identidade no portal.' },
  { icon: Users, title: 'Uma comunidade', text: 'O novo modelo reunirá os mesmos colegas, perfil e ferramentas entre as formações.' },
  { icon: BookOpen, title: 'Percursos independentes', text: 'Cada curso terá suas atividades e horas vinculadas ao seu código, sem misturar os históricos.' },
];

export default function PortalModelNotice() {
  return <section aria-labelledby="portal-model-title" className="rounded-2xl border border-portal-muted/20 bg-portal-surface p-5 sm:p-7">
    <p className="text-xs font-semibold uppercase tracking-widest text-course">Próxima fase do portal</p>
    <h2 id="portal-model-title" className="mt-2 text-xl font-semibold">Uma mensalidade. Novos caminhos para aprender.</h2>
    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-portal-muted">No novo modelo, a mensalidade será do portal, com acesso a todos os cursos disponíveis, sem uma cobrança por formação. Os cursos em preparação serão liberados posteriormente.</p>
    <div className="mt-6 grid gap-5 sm:grid-cols-3">{principles.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-3">
      <Icon size={20} className="mt-1 shrink-0 text-course" aria-hidden="true" />
      <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-portal-muted">{text}</p></div>
    </div>)}</div>
  </section>;
}