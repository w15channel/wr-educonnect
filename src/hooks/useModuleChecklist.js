import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildModuleChecklist, parseModuleNumber } from '@/lib/examChecklistRules';

const MODULE_COUNT = 10;

/**
 * Checklist individual do aluno: calcula os requisitos de cada módulo (1–10)
 * e identifica o módulo em que ele está agora — o primeiro cuja prova ainda
 * não foi entregue. Nada é compartilhado entre alunos.
 */
export default function useModuleChecklist({ course = 'tcc', session } = {}) {
  const email = session?.email || session?.code || '';

  const { data: lessons = [], isLoading: l1 } = useQuery({
    queryKey: ['checklist-lessons', course],
    queryFn: () => base44.entities.RecordedLesson.filter({ course }, 'order', 300),
  });
  const { data: progresses = [], isLoading: l2 } = useQuery({
    queryKey: ['checklist-progress', email],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: email }, '-created_date', 2000),
    enabled: !!email,
  });
  const { data: tasks = [], isLoading: l3 } = useQuery({
    queryKey: ['checklist-tasks', course],
    queryFn: () => base44.entities.Task.filter({ course }, '-created_date', 300),
  });
  const { data: submissions = [], isLoading: l4 } = useQuery({
    queryKey: ['checklist-submissions', email],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: email }, '-created_date', 1000),
    enabled: !!email,
  });
  // Debates antigos foram gravados sem o campo "space" — buscamos tudo do curso
  // e filtramos aqui para reconhecer também as participações já existentes.
  const { data: allPosts = [], isLoading: l5 } = useQuery({
    queryKey: ['checklist-debates', course],
    queryFn: () => base44.entities.ForumPost.filter({ course }, '-created_date', 1000),
  });
  const { data: allReplies = [], isLoading: l6 } = useQuery({
    queryKey: ['checklist-debate-replies'],
    queryFn: () => base44.entities.ForumReply.list('-created_date', 2000),
  });
  const debatePosts = useMemo(() => allPosts.filter((p) => p.space !== 'forum'), [allPosts]);
  const debateReplies = useMemo(() => allReplies.filter((r) => r.space !== 'forum'), [allReplies]);
  const { data: pairings = [], isLoading: l7 } = useQuery({
    queryKey: ['checklist-pairings', email],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 1000),
    enabled: !!email,
  });
  const { data: challengeResponses = [], isLoading: l8 } = useQuery({
    queryKey: ['checklist-ofensivas', email, course],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ student_email: email, course }, '-date', 500),
    enabled: !!email,
  });
  const { data: exams = [], isLoading: l9 } = useQuery({
    queryKey: ['checklist-exams', course],
    queryFn: () => base44.entities.Exam.filter({ course }, '-created_date', 300),
  });
  const { data: examSubmissions = [], isLoading: l10 } = useQuery({
    queryKey: ['checklist-exam-subs', email],
    queryFn: () => base44.entities.ExamSubmission.filter({ student_email: email }, '-submitted_at', 500),
    enabled: !!email,
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10;

  const modules = useMemo(() => {
    const submittedExamIds = new Set(examSubmissions.map((s) => s.exam_id));
    return Array.from({ length: MODULE_COUNT }, (_, index) => {
      const moduleNumber = index + 1;
      const checklist = buildModuleChecklist({
        moduleNumber,
        email,
        lessons,
        progresses,
        tasks,
        submissions,
        debatePosts,
        debateReplies,
        pairings,
        challengeResponses,
      });
      const moduleExams = exams.filter((exam) => parseModuleNumber(exam.module_ref) === moduleNumber);
      const examDone = moduleExams.length > 0 && moduleExams.every((exam) => submittedExamIds.has(exam.id));
      return { moduleNumber, ...checklist, examDone, exams: moduleExams };
    });
  }, [email, lessons, progresses, tasks, submissions, debatePosts, debateReplies, pairings, challengeResponses, exams, examSubmissions]);

  // Módulo atual do aluno: o primeiro cuja prova ainda não foi entregue.
  const currentModule = modules.find((m) => !m.examDone)?.moduleNumber || MODULE_COUNT;

  const isModuleUnlockedForExam = (moduleNumber) => {
    const found = modules.find((m) => m.moduleNumber === Number(moduleNumber));
    return found ? found.complete : true;
  };

  return { modules, currentModule, isModuleUnlockedForExam, isLoading };
}