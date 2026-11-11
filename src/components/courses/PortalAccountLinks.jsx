import React from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Users, Wallet } from 'lucide-react';
import { portalStudyPath } from '@/components/courses/portalCourses';

export default function PortalAccountLinks({ session }) {
  const base = portalStudyPath(session);
  const links = [{ icon: UserRound, label: 'Meu perfil', path: '/profile' }, { icon: Users, label: 'Minha comunidade', path: '/classe' }, { icon: Wallet, label: 'Mensalidade do portal', path: '/tuitions' }];
  return <nav aria-label="Minha conta no portal" className="flex flex-wrap gap-3">
    {links.map(({ icon: Icon, label, path }) => <Link key={path} to={`${base}${path}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-portal-muted/25 px-4 py-2 text-sm text-portal-text hover:bg-portal-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-course"><Icon size={16} className="text-course" />{label}</Link>)}
  </nav>;
}