import { useLocation } from 'react-router-dom';

// Parses URL like /student/tcc/dashboard or /adm/psi/lessons
// Returns { role, course, prefix, subPath }
// role: 'student' | 'adm' | null
// course: 'tcc' | 'psicanalise' | 'sexologia' | null
// prefix: '/student/tcc' (use as base for links)
// subPath: '/dashboard'

const COURSE_ALIAS = {
  tcc: 'tcc',
  psi: 'psicanalise',
  psicanalise: 'psicanalise',
  sex: 'sexologia',
  sexologia: 'sexologia',
};

const COURSE_TO_SLUG = {
  tcc: 'tcc',
  psicanalise: 'psi',
  sexologia: 'sex',
};

export function parseRoutePath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const role = parts[0] === 'student' || parts[0] === 'adm' ? parts[0] : null;
  if (!role) return { role: null, course: null, prefix: '', subPath: pathname };

  const courseSlug = parts[1];
  const course = COURSE_ALIAS[courseSlug] || null;
  if (!course) return { role, course: null, prefix: `/${role}`, subPath: '/' + parts.slice(1).join('/') };

  const prefix = `/${role}/${courseSlug}`;
  const subPath = '/' + parts.slice(2).join('/');
  return { role, course, prefix, subPath: subPath === '/' ? '/dashboard' : subPath };
}

export function buildPrefix(role, course) {
  // role: 'student' | 'admin' (or 'adm')
  // course: 'tcc' | 'psicanalise' | 'sexologia'
  const r = role === 'admin' ? 'adm' : 'student';
  const slug = COURSE_TO_SLUG[course] || 'tcc';
  return `/${r}/${slug}`;
}

export function useRouteContext() {
  const location = useLocation();
  return parseRoutePath(location.pathname);
}

// Build a path within the current role/course context
export function useScopedPath() {
  const { prefix } = useRouteContext();
  return (subPath) => {
    if (!subPath || subPath === '/') return prefix + '/dashboard';
    return prefix + (subPath.startsWith('/') ? subPath : '/' + subPath);
  };
}