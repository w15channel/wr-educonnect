import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useModuleAccess from '@/hooks/useModuleAccess';
import { base44 } from '@/api/base44Client';
import { buildModuleChecklist, parseModuleNumber } from '@/lib/examChecklistRules';

const MODULE_COUNT = 10;
// O calendário define o módulo disponível; concluir atividades não antecipa datas.

/**
 * Checklist individual do aluno: calcula os requisitos de cada módulo (1–10)
 * e identifica o módulo em que ele está agora — o primeiro cuja prova ainda
 * não foi entregue. Nada é compartilhado entre alunos.
 */
export default function useModuleChecklist({ course = 'tcc', session } = {}) {
  const email = session?.email || session?.code || '';
  const access = useModuleAccess(course, session);

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
  const moduleUnlocks = access.unlocks;

  const isLoading = l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || access.isLoading;

  // Data em que cada módulo foi liberado para o aluno — usada para que
  // debates, terapeuta da semana e ofensiva contem apenas o que foi feito
  // dentro da janela de tempo daquele módulo, sem herdar participações antigas.
  const unlockDateByModule = useMemo(() => {
    const map = new Map();
    moduleUnlocks.filter((u) => (u.course || 'tcc') === course).forEach((u) => {
      map.set(Number(u.module_number), u.unlocked_at);
    });
    return map;
  }, [moduleUnlocks, course]);

  const modules = useMemo(() => {
    const submittedExamIds = new Set(examSubmissions.map((s) => s.exam_id));
    return Array.from({ length: MODULE_COUNT }, (_, index) => {
      const moduleNumber = index + 1;
      const moduleWindow = { start: unlockDateByModule.get(moduleNumber) || null, end: unlockDateByModule.get(moduleNumber + 1) || null };
      const checklist = buildModuleChecklist({
        moduleNumber,
        email,
        progresses,
        tasks,
        submissions,
        debatePosts,
        debateReplies,
        pairings,
        challengeResponses,
        moduleWindow,
      });
      const moduleExams = exams.filter((exam) => parseModuleNumber(exam.module_ref) === moduleNumber);
      const examDone = moduleExams.length > 0 && moduleExams.every((exam) => submittedExamIds.has(exam.id));
      return { moduleNumber, ...checklist, examDone, exams: moduleExams };
    });
  }, [email, progresses, tasks, submissions, debatePosts, debateReplies, pairings, challengeResponses, exams, examSubmissions, unlockDateByModule]);

  const currentModule = access.currentModule;

  const isModuleUnlockedForExam = (moduleNumber) => {
    const found = modules.find((m) => m.moduleNumber === Number(moduleNumber));
    return access.moduleUnlocked[Number(moduleNumber) - 1] === true && !!found?.complete;
  };

  return { modules, currentModule, isModuleUnlockedForExam, isLoading, availableModules: access.availableModules };
}