import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMemo } from 'react';

const SLUG_TO_PREFIX = { sex: 'SEX-', tcc: 'EDU-', psi: 'PSI-' };
const SLUG_TO_COURSE = { sex: 'sexologia', tcc: 'tcc', psi: 'psicanalise' };
const COURSE_TO_PREFIX = { sexologia: 'SEX-', tcc: 'EDU-', psicanalise: 'PSI-' };

export default function useCourseFilteredEmails(session) {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const routeSlug = (parts[0] === 'student' || parts[0] === 'adm') && parts[1] ? parts[1] : null;
  const courseSlug = routeSlug && SLUG_TO_COURSE[routeSlug] ? routeSlug : null;
  // Current routes are intentionally flat (/student/chat). Prefer the course in
  // the authenticated session and retain support for legacy course-scoped URLs.
  const course = courseSlug ? SLUG_TO_COURSE[courseSlug] : session?.course || null;
  const codePrefix = courseSlug ? SLUG_TO_PREFIX[courseSlug] : COURSE_TO_PREFIX[course] || null;

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes-filter'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 500),
    enabled: !session?.code && !session?.codeId,
  });

  return useMemo(() => {
    if (!codePrefix || !course) return { emails: null, course: null };
    const emails = new Set();
    accessCodes.forEach(c => {
      if ((c.code || '').startsWith(codePrefix) && c.student_email) {
        const validCourse = c.course === course || (course === 'tcc' && !c.course);
        if (validCourse) emails.add(c.student_email);
      }
    });
    return { emails, course, codePrefix };
  }, [accessCodes, codePrefix, course]);
}
