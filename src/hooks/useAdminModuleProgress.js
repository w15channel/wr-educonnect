import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildStudentExamProgressRows } from '@/lib/adminModuleProgress';

/**
 * Progresso do checklist de toda a turma, por aluno, no módulo em vigência.
 * Reaproveita as entidades já usadas pelo checklist do aluno — aqui elas são
 * carregadas uma única vez e agrupadas por e-mail.
 */
export default function useAdminModuleProgress({ course = 'tcc' } = {}) {
  const { data: codes = [], isLoading: l1 } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 500),
  });
  const { data: lessons = [], isLoading: l2 } = useQuery({
    queryKey: ['checklist-lessons', course],
    queryFn: () => base44.entities.RecordedLesson.filter({ course }, 'order', 300),
  });
  const { data: tasks = [], isLoading: l3 } = useQuery({
    queryKey: ['checklist-tasks', course],
    queryFn: () => base44.entities.Task.filter({ course }, '-created_date', 300),
  });
  const { data: progresses = [], isLoading: l4 } = useQuery({
    queryKey: ['admin-progress-lesson-progress'],
    queryFn: () => base44.entities.LessonProgress.list('-created_date', 5000),
  });
  const { data: submissions = [], isLoading: l5 } = useQuery({
    queryKey: ['admin-progress-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 3000),
  });
  const { data: allPosts = [], isLoading: l6 } = useQuery({
    queryKey: ['checklist-debates', course],
    queryFn: () => base44.entities.ForumPost.filter({ course }, '-created_date', 1000),
  });
  const { data: allReplies = [], isLoading: l7 } = useQuery({
    queryKey: ['checklist-debate-replies'],
    queryFn: () => base44.entities.ForumReply.list('-created_date', 2000),
  });
  const { data: pairings = [], isLoading: l8 } = useQuery({
    queryKey: ['admin-progress-pairings'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 1000),
  });
  const { data: challengeResponses = [], isLoading: l9 } = useQuery({
    queryKey: ['admin-progress-ofensivas', course],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ course }, '-date', 3000),
  });
  const { data: moduleUnlocks = [], isLoading: l10 } = useQuery({
    queryKey: ['ranking-module-unlocks'],
    queryFn: () => base44.entities.StudentModuleUnlock.list('-unlocked_at', 2000),
  });
  const { data: examReleases = [], isLoading: l11 } = useQuery({
    queryKey: ['exam-releases', course],
    queryFn: () => base44.entities.ExamRelease.filter({ course }, '-released_at', 2000),
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11;

  const students = useMemo(() => codes.filter((code) => {
    if (!code?.student_email) return false;
    const codeCourse = code.course || 'tcc';
    if (codeCourse !== course) return false;
    return !code.profile_category || code.profile_category === 'student';
  }), [codes, course]);

  const rows = useMemo(() => buildStudentExamProgressRows({
    students,
    lessons,
    tasks,
    progresses,
    submissions,
    debatePosts: allPosts.filter((post) => post.space !== 'forum'),
    debateReplies: allReplies.filter((reply) => reply.space !== 'forum'),
    pairings,
    challengeResponses,
    moduleUnlocks,
    examReleases,
  }), [students, lessons, tasks, progresses, submissions, allPosts, allReplies, pairings, challengeResponses, moduleUnlocks, examReleases]);

  return { rows, isLoading, hasCourseData: lessons.length > 0 || tasks.length > 0 };
}
