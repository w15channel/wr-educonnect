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
  const { data: moduleAchievements = [], isLoading: loadingAchievements } = useQuery({
    queryKey: ['module-achievements-trophies', course],
    queryFn: () => base44.entities.Achievement.filter({ course, kind: 'module' }, '-occurred_at', 500),
  });

  const completions = useMemo(() => {
    const examCompletions = buildModuleCompletions(exams, submissions);
    const achievementCompletions = moduleAchievements.map((ach) => {
      let modNum = 1;
      const match = (ach.source_id || ach.title || ach.dedupe_key || '').match(/(?:mod|m[óo]dulo|module)[^\d]*(\d+)/i);
      if (match) modNum = parseInt(match[1], 10);
      return {
        id: ach.id,
        student_email: ach.student_email,
        moduleNumber: modNum,
        submitted_at: ach.occurred_at || ach.created_date,
      };
    }).filter((item) => item.moduleNumber);

    return [...examCompletions, ...achievementCompletions];
  }, [exams, submissions, moduleAchievements]);

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
  return { completions, byEmail, isLoading: loadingExams || loadingSubmissions || loadingAchievements };
}