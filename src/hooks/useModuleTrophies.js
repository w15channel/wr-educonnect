import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildModuleCompletions } from '@/lib/moduleAchievements';

const normalize = (value = '') => String(value || '').trim().toLowerCase();

export default function useModuleTrophies(course = 'tcc') {
  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ['module-trophy-exams', course],
    queryFn: () => base44.entities.Exam.filter({ course }, '-created_date', 300),
  });
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['module-trophy-submissions', course],
    queryFn: () => base44.entities.ExamSubmission.filter({ course }, '-submitted_at', 3000),
  });
  const completions = useMemo(() => buildModuleCompletions(exams, submissions), [exams, submissions]);
  const byEmail = useMemo(() => {
    const map = new Map();
    completions.forEach((item) => {
      const email = normalize(item.student_email);
      if (!map.has(email)) map.set(email, []);
      if (!map.get(email).some((entry) => entry.moduleNumber === item.moduleNumber)) map.get(email).push(item);
    });
    map.forEach((items) => items.sort((a, b) => a.moduleNumber - b.moduleNumber));
    return map;
  }, [completions]);
  return { completions, byEmail, isLoading: loadingExams || loadingSubmissions };
}