import React from 'react';
import { Link } from 'react-router-dom';
import { Library } from 'lucide-react';

export default function MyCoursesLink({ onClick }) {
  return <Link to="/lobby" onClick={onClick} className="mb-4 flex min-h-11 items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
    <Library size={17} aria-hidden="true" /> Meus cursos
  </Link>;
}