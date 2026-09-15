/**
 * examChecklistProgress
 * ─────────────────────
 * Espelho no backend das regras do checklist do módulo (`src/lib/examChecklistRules.js`).
 * Serve para o servidor recalcular o progresso do aluno por conta própria, sem
 * confiar em números enviados pelo navegador, antes de liberar as provas.
 *
 * Ao mudar as regras no app, atualize também este arquivo.
 */

export const CHECKLIST_RULES = {
  lessonsPerModule: 5,
  apostilaChapters: 5,
  tasksPerModule: 5,
  ofensivaDays: 3,
};

export const EXAM_RELEASE_MIN_PERCENT = 100;

type AnyRecord = Record<string, any>;

export function parseModuleNumber(value: unknown): number | null {
  const digits = String(value ?? '').match(/\d+/);
  const parsed = digits ? Number(digits[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function submissionTextLength(submission: AnyRecord | undefined): number {
  if (!submission) return 0;
  const answers = Array.isArray(submission.quiz_answers) ? submission.quiz_answers : [];
  const answersText = answers
    .map((answer: AnyRecord) => (answer && typeof answer === 'object' ? answer.text || '' : ''))
    .join(' ');
  return `${submission.comment || ''} ${answersText}`.trim().length;
}

export interface ChecklistProgressInput {
  moduleNumber: number;
  email: string;
  lessons?: AnyRecord[];
  progresses?: AnyRecord[];
  tasks?: AnyRecord[];
  submissions?: AnyRecord[];
  debatePosts?: AnyRecord[];
  debateReplies?: AnyRecord[];
  pairings?: AnyRecord[];
  challengeResponses?: AnyRecord[];
}

export interface ChecklistProgress {
  items: { key: string; current: number; target: number; done: boolean }[];
  total: number;
  completed: number;
  missing: number;
  percent: number;
  hasData: boolean;
  eligible: boolean;
}

/** Calcula os 6 requisitos do módulo para um aluno e resume o percentual. */
export function computeChecklistProgress({
  moduleNumber,
  email,
  lessons = [],
  progresses = [],
  tasks = [],
  submissions = [],
  debatePosts = [],
  debateReplies = [],
  pairings = [],
  challengeResponses = [],
}: ChecklistProgressInput): ChecklistProgress {
  const watchedByLessonId = new Map(progresses.map((p) => [p.lesson_id, p]));

  const tagged = lessons.filter((lesson) => Number(lesson.module_number) === moduleNumber);
  const moduleLessons = tagged.length > 0
    ? tagged
    : lessons
      .filter((lesson) => !lesson.module_type || lesson.module_type === 'apostila')
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice((moduleNumber - 1) * CHECKLIST_RULES.lessonsPerModule, moduleNumber * CHECKLIST_RULES.lessonsPerModule);
  const lessonsAnswered = moduleLessons.filter((lesson) => watchedByLessonId.get(lesson.id)?.watched).length;

  const apostilaPrefix = `apostila:mod${moduleNumber}:`;
  const apostilaRead = new Set(
    progresses
      .filter((p) => p.watched && String(p.lesson_id || '').startsWith(apostilaPrefix))
      .map((p) => p.lesson_id)
  ).size;

  const moduleTasks = tasks.filter((task) => Number(task.module_number) === moduleNumber);
  const tasksDone = moduleTasks.filter((task) => {
    const submission = submissions.find((s) => s.task_id === task.id);
    return !!submission && (submissionTextLength(submission) > 0 || !!submission.file_url);
  }).length;

  const myDebateTopics = debatePosts.filter((post) => post.author_email === email).length;
  const postById = new Map(debatePosts.map((post) => [post.id, post]));
  const myDebateComments = debateReplies.filter((reply) => {
    const parent = postById.get(reply.post_id);
    return reply.author_email === email && parent && parent.author_email !== email;
  }).length;

  const ofensivaDays = new Set(
    challengeResponses.filter((r) => r.student_email === email).map((r) => r.date)
  ).size;

  const items = [
    { key: 'lessons', current: lessonsAnswered, target: moduleLessons.length || CHECKLIST_RULES.lessonsPerModule },
    { key: 'apostila', current: apostilaRead, target: CHECKLIST_RULES.apostilaChapters },
    { key: 'tasks', current: tasksDone, target: moduleTasks.length || CHECKLIST_RULES.tasksPerModule },
    { key: 'debate_topic', current: Math.min(myDebateTopics, 1), target: 1 },
    { key: 'debate_comment', current: Math.min(myDebateComments, 1), target: 1 },
    { key: 'ofensiva', current: Math.min(ofensivaDays, CHECKLIST_RULES.ofensivaDays), target: CHECKLIST_RULES.ofensivaDays },
  ].map((item) => ({ ...item, done: item.current >= item.target }));

  const total = items.length;
  const completed = items.filter((item) => item.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    items,
    total,
    completed,
    missing: total - completed,
    percent,
    hasData: total > 0,
    eligible: total > 0 && percent >= EXAM_RELEASE_MIN_PERCENT,
  };
}

/** Motivo do bloqueio da liberação — `null` quando o aluno pode receber as provas. */
export function examReleaseBlockReason(progress: ChecklistProgress | null): string | null {
  if (!progress || !progress.hasData) return 'Checklist do módulo indisponível para este aluno.';
  if (!progress.eligible) {
    return `Aluno com ${progress.percent}% do checklist — mínimo exigido é ${EXAM_RELEASE_MIN_PERCENT}% (faltam ${progress.missing} atividade(s)).`;
  }
  return null;
}