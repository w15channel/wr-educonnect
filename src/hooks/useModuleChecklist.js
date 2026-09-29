import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useModuleAccess from '@/hooks/useModuleAccess';
import useStudentRecords from '@/hooks/useStudentRecords';
import { base44 } from '@/api/base44Client';
import { buildModuleChecklist, parseModuleNumber } from '@/lib/examChecklistRules';
import { applyChecklistVerification } from '@/lib/verifiedChecklist';

const MODULE_COUNT = 10;
// O calendário define o módulo disponível; concluir atividades não antecipa datas.

/**
 * Checklist individual do aluno: calcula os requisitos de cada módulo (1–10)
 * e identifica o módulo em que ele está agora — o primeiro cuja prova ainda
 * não foi entregue. Nada é compartilhado entre alunos.
 */
export default function useModuleChecklist({ course = 'tcc', session, includeOfensiva = true } = {}) {
  const email = session?.email || session?.code || '';
  const access = useModuleAccess(course, session);
  const queryClient = useQueryClient();

  const { data: progresses = [], isLoading: l2, error: progressError } = useStudentRecords('LessonProgress', session);
  const { data: tasks = [], isLoading: l3 } = useQuery({
    queryKey: ['checklist-tasks', course],
    queryFn: () => base44.entities.Task.filter({ course }, '-created_date', 300),
  });
  const { data: submissions = [], isLoading: l4, error: submissionError } = useStudentRecords('TaskSubmission', session);
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
  // A área da resposta pode estar ausente em registros antigos; o post pai define se ela pertence aos debates.
  const debateReplies = allReplies;
  const { data: pairings = [], isLoading: l7 } = useQuery({
    queryKey: ['checklist-pairings', email],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 1000),
    enabled: !!email,
  });
  const { data: challengeResponses = [], isLoading: l8 } = useQuery({
    queryKey: ['checklist-ofensivas', email, course],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ student_email: email, course }, '-date', 500),
    enabled: !!email && includeOfensiva,
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
  const { data: verification = null } = useQuery({
    queryKey: ['checklist-verification', session?.codeId, email, course],
    queryFn: async () => {
      const filter = session?.codeId ? { code_id: session.codeId, course } : { student_email: email, course };
      return (await base44.entities.ChecklistVerification.filter(filter, '-verified_at', 1))[0] || null;
    },
    enabled: !!email,
    staleTime: 30000,
    refetchInterval: 60000,
  });
  const verified = verification?.rules_version === 1 ? verification : null;
  useEffect(() => {
    if (!verification?.verified_at) return;
    queryClient.invalidateQueries({ predicate: query => {
      const key = String(query.queryKey[0]);
      return key === 'student-learning-records' || key === 'module-unlocks' || (key.startsWith('checklist-') && key !== 'checklist-verification');
    } });
  }, [verification?.verified_at, queryClient]);
  const moduleUnlocks = access.unlocks;

  const isLoading = l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || access.isLoading;

  // Data em que cada módulo foi liberado para o aluno — usada para que
  // debates, terapeuta da semana, ofensiva contem apenas o que
  // foi feito dentro da janela de tempo daquele módulo.
  const unlockDateByModule = useMemo(() => {
    const map = new Map();
    moduleUnlocks.filter((u) => (u.course || 'tcc') === course).forEach((u) => {
      map.set(Number(u.module_number), u.unlocked_at);
    });
    return map;
  }, [moduleUnlocks, course]);

  const submittedExamIds = useMemo(() => new Set(examSubmissions.map((s) => s.exam_id)), [examSubmissions]);

  const modules = useMemo(() => {
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
        includeOfensiva,
        previousExamCompleted: moduleNumber === 1 ? true : (() => {
          const previousModuleNumber = moduleNumber - 1;
          const previousModuleExams = exams.filter((exam) => parseModuleNumber(exam.module_ref) === previousModuleNumber);
          return previousModuleExams.length > 0 && previousModuleExams.every((exam) => submittedExamIds.has(exam.id));
        })(),
      });
      const confirmed = verified?.modules?.find(row => row.moduleNumber === moduleNumber);
      const reconciled = applyChecklistVerification(checklist, confirmed, {
        taskIds: tasks.filter(task => Number(task.module_number) === moduleNumber && task.type !== 'quiz' && !task.is_hidden).map(task => task.id),
        previousExamIds: exams.filter(exam => parseModuleNumber(exam.module_ref) === moduleNumber - 1).map(exam => exam.id),
      });
      const moduleExams = exams.filter((exam) => parseModuleNumber(exam.module_ref) === moduleNumber);
      const sameExams = JSON.stringify(moduleExams.map(exam => exam.id).sort()) === JSON.stringify(confirmed?.exam_ids || []);
      const examDone = moduleExams.length > 0 && (moduleExams.every((exam) => submittedExamIds.has(exam.id)) || (sameExams && confirmed?.examDone === true));
      return { moduleNumber, ...reconciled, examDone, exams: moduleExams };
    });
  }, [email, progresses, tasks, submissions, debatePosts, debateReplies, pairings, challengeResponses, exams, submittedExamIds, unlockDateByModule, verified, includeOfensiva]);

  // Conteúdo liberado pelo calendário não equivale a acesso antecipado à
  // trilha. O checklist N só abre depois da entrega da prova N-1.
  const checklistAvailableModules = useMemo(() => access.availableModules.filter((moduleNumber) => {
    if (moduleNumber <= 5 || session?.role === 'admin') return true;
    const previousExams = exams.filter((exam) => parseModuleNumber(exam.module_ref) === moduleNumber - 1);
    return previousExams.length > 0 && previousExams.every((exam) => submittedExamIds.has(exam.id));
  }), [access.availableModules, exams, submittedExamIds, session?.role]);

  // O módulo atual é o primeiro checklist acessível que ainda tem itens pendentes.
  const currentModule = useMemo(() => {
    for (const mod of modules) {
      if (checklistAvailableModules.includes(mod.moduleNumber) && !mod.complete) {
        return mod.moduleNumber;
      }
    }
    return checklistAvailableModules.at(-1) || 1;
  }, [modules, checklistAvailableModules]);

  const isModuleUnlockedForExam = (moduleNumber) => {
    const found = modules.find((m) => m.moduleNumber === Number(moduleNumber));
    return access.moduleUnlocked[Number(moduleNumber) - 1] === true && !!found?.complete;
  };

  return { modules, currentModule, isModuleUnlockedForExam, isLoading, error: progressError || submissionError || access.error, availableModules: access.availableModules, checklistAvailableModules };
}
