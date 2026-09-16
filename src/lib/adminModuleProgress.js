import { buildModuleChecklist, summarizeChecklistProgress, parseModuleNumber } from '@/lib/examChecklistRules';
import { groupUnlocksByEmail, resolveCurrentStudentModule } from '@/lib/moduleAttribution';

/**
 * Progresso do checklist por aluno para a ferramenta do admin.
 *
 * Reutiliza as mesmas regras do checklist do aluno (examChecklistRules) e a
 * mesma atribuição de módulo em vigência (StudentModuleUnlock), apenas
 * agrupando os dados de toda a turma por e-mail.
 */

export const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const groupByEmail = (records = [], field = 'student_email') => {
  const map = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    const email = normalizeEmail(record?.[field]);
    if (!email) return;
    if (!map.has(email)) map.set(email, []);
    map.get(email).push(record);
  });
  return map;
};

/**
 * Monta uma linha por aluno com o módulo em vigência, o checklist do módulo,
 * o resumo (total / cumpridas / faltantes / percentual) e o estado de liberação.
 */
export function buildStudentExamProgressRows({
  students = [],
  lessons = [],
  tasks = [],
  progresses = [],
  submissions = [],
  debatePosts = [],
  debateReplies = [],
  pairings = [],
  challengeResponses = [],
  moduleUnlocks = [],
  examReleases = [],
  exams = [],
  examSubmissions = [],
} = {}) {
  const unlocksByEmail = groupUnlocksByEmail(
    (Array.isArray(moduleUnlocks) ? moduleUnlocks : []).map((unlock) => ({
      ...unlock,
      student_email: normalizeEmail(unlock?.student_email),
    }))
  );
  const progressByEmail = groupByEmail(progresses);
  const submissionsByEmail = groupByEmail(submissions);
  const challengesByEmail = groupByEmail(challengeResponses);
  const releasesByEmail = groupByEmail(examReleases);
  const examSubsByEmail = groupByEmail(examSubmissions);

  return students
    .map((student) => {
      const email = normalizeEmail(student?.student_email || student?.email);
      if (!email) return null;
      const moduleNumber = resolveCurrentStudentModule(unlocksByEmail.get(email) || []);

      // Pré-requisito: verificar se a prova do módulo anterior foi entregue
      const previousModuleNumber = moduleNumber - 1;
      const previousModuleExams = previousModuleNumber >= 1
        ? exams.filter((exam) => parseModuleNumber(exam.module_ref) === previousModuleNumber)
        : [];
      const studentExamSubs = examSubsByEmail.get(email) || [];
      const submittedExamIds = new Set(studentExamSubs.map((s) => s.exam_id));
      const previousExamCompleted = previousModuleExams.length === 0
        ? true
        : previousModuleExams.every((exam) => submittedExamIds.has(exam.id));

      const checklist = buildModuleChecklist({
        moduleNumber,
        email,
        lessons,
        progresses: progressByEmail.get(email) || [],
        tasks,
        submissions: submissionsByEmail.get(email) || [],
        debatePosts,
        debateReplies,
        pairings,
        challengeResponses: challengesByEmail.get(email) || [],
        previousExamCompleted,
      });
      const summary = summarizeChecklistProgress(checklist);
      const release = (releasesByEmail.get(email) || [])
        .filter((item) => Number(item?.module_number) === moduleNumber)
        .sort((a, b) => String(b?.released_at || '').localeCompare(String(a?.released_at || '')))[0] || null;

      return {
        email,
        name: student?.profile_name || student?.student_name || student?.name || email,
        code: student?.code || '',
        moduleNumber,
        checklist,
        summary,
        release,
        released: !!release,
      };
    })
    .filter(Boolean);
}

/** Índice rápido de liberações manuais: `email|módulo` → registro. */
export function buildExamReleaseIndex(examReleases = []) {
  const map = new Map();
  (Array.isArray(examReleases) ? examReleases : []).forEach((release) => {
    const email = normalizeEmail(release?.student_email);
    const moduleNumber = Number(release?.module_number);
    if (!email || !Number.isFinite(moduleNumber)) return;
    map.set(`${email}|${moduleNumber}`, release);
  });
  return map;
}