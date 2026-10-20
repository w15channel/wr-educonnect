// Regras do Checklist de liberação da prova do módulo.
// Tudo é calculado por aluno e por módulo — cada aluno avança no seu tempo.

export const CHECKLIST_RULES = {
  apostilaChapters: 5,
  tasksPerModule: 5,
  taskMinChars: 500,
  ofensivaDays: 3,
};

export const parseModuleNumber = (value) => {
  const digits = String(value ?? '').match(/\d+/);
  const parsed = digits ? Number(digits[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Texto entregue em uma tarefa: comentário + respostas escritas do quiz.
export const submissionTextLength = (submission) => {
  if (!submission) return 0;
  const answers = Array.isArray(submission.quiz_answers) ? submission.quiz_answers : [];
  const answersText = answers
    .map((answer) => (answer && typeof answer === 'object' ? answer.text || '' : ''))
    .join(' ');
  return `${submission.comment || ''} ${answersText}`.trim().length;
};

const normalizeIdentity = (value) => String(value || '').trim().toLowerCase();
const isDeliveredSubmission = (submission) => ['submitted', 'graded'].includes(submission?.status)
  || submissionTextLength(submission) > 0
  || !!submission?.file_url;

// Verifica se uma data cai dentro da janela de tempo em que o aluno esteve
// naquele módulo (entre a liberação do módulo e a liberação do próximo).
// APENAS para atividades perenes (debates, ofensivas, terapeuta) — 
// aulas e tarefas são cumulativas: uma vez feitas, sempre contam.
const isWithinModuleWindow = (dateValue, window) => {
  if (!window) return true;
  const time = new Date(dateValue).getTime();
  if (!Number.isFinite(time)) return false;
  if (window.start && time < new Date(window.start).getTime()) return false;
  if (window.end && time >= new Date(window.end).getTime()) return false;
  return true;
};

export function buildModuleChecklist({
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
  moduleWindow = null,
  previousExamCompleted = false,
  includeOfensiva = true,
}) {
  // Aulas da apostila e tarefas são CUMULATIVAS — uma vez completas, sempre contam
  // independente de quando foram feitas. Não filtramos por janela de tempo.
  // Debates, ofensivas e terapeuta usam janela de tempo para não herdar de módulos anteriores.

  // 2 — Capítulos da apostila do módulo marcados como lidos (cumulativo).
  const apostilaPrefix = `apostila:mod${moduleNumber}:`;
  const apostilaRead = new Set(
    progresses
      .filter((p) => p.watched && String(p.lesson_id || '').startsWith(apostilaPrefix))
      .map((p) => p.lesson_id)
  ).size;

  // 3 — Tarefas do módulo entregues (cumulativo).
  // Filtra tarefas tipo quiz (provas) e ocultas — elas não são trabalhos normais.
  const moduleTasks = tasks.filter((task) => Number(task.module_number) === moduleNumber && task.type !== 'quiz' && !task.is_hidden);
  const tasksDone = moduleTasks.filter((task) => {
    // Há históricos com mais de um registro para a mesma tarefa. A entrega é
    // única por tarefa e basta um registro válido; nunca usamos apenas o
    // primeiro (que pode ser um rascunho vazio).
    return submissions.some((submission) => submission.task_id === task.id && isDeliveredSubmission(submission));
  }).length;

  // 4 — Sala de debates: abrir um tema e comentar no tema de um colega.
  // Restrito à janela de tempo do módulo, para não herdar participações de módulos anteriores.
  const studentIdentity = normalizeIdentity(email);
  const myDebateTopics = debatePosts.filter((post) => normalizeIdentity(post.author_email) === studentIdentity && isWithinModuleWindow(post.created_date, moduleWindow)).length;
  const postById = new Map(debatePosts.map((post) => [post.id, post]));
  const myDebateComments = debateReplies.filter((reply) => {
    const parent = postById.get(reply.post_id);
    return normalizeIdentity(reply.author_email) === studentIdentity && parent && normalizeIdentity(parent.author_email) !== studentIdentity && isWithinModuleWindow(reply.created_date, moduleWindow);
  }).length;

  // 6 — Pelo menos 3 dias de ofensiva (não precisam ser consecutivos), dentro da janela do módulo.
  const ofensivaDays = new Set(
    challengeResponses.filter((r) => r.student_email === email && isWithinModuleWindow(r.date, moduleWindow)).map((r) => r.date)
  ).size;

  const items = [
    // Pré-requisito: para módulos 2+, a prova do módulo anterior deve ter sido entregue.
    ...(moduleNumber > 1 ? [{
      key: 'previous_exam',
      label: `Concluir a prova do Módulo ${moduleNumber - 1}`,
      hint: 'Você precisa ter entregue a prova do módulo anterior antes de prosseguir com as atividades deste módulo.',
      current: previousExamCompleted ? 1 : 0,
      target: 1,
      to: '/exams',
    }] : []),
    {
      key: 'apostila',
      label: 'Marcar os capítulos da apostila do módulo como lidos',
      hint: 'Abra cada capítulo do módulo e use "Marcar como lida".',
      current: apostilaRead,
      target: CHECKLIST_RULES.apostilaChapters,
      to: `/apostila?module=${moduleNumber}`,
    },
    {
      key: 'tasks',
      label: 'Entregar as tarefas do módulo',
      hint: 'Entregas já registradas no seu histórico contam automaticamente.',
      current: tasksDone,
      target: moduleTasks.length || CHECKLIST_RULES.tasksPerModule,
      to: '/tasks',
    },
    {
      key: 'debate_topic',
      label: 'Abrir um tema na Sala de Debates',
      hint: 'Escolha um tema dos capítulos da apostila e proponha o debate.',
      current: Math.min(myDebateTopics, 1),
      target: 1,
      to: '/debates',
    },
    {
      key: 'debate_comment',
      label: 'Comentar em um debate já aberto por um colega',
      hint: 'Participe de um tema aberto por outra pessoa da turma.',
      current: Math.min(myDebateComments, 1),
      target: 1,
      to: '/debates',
    },
    ...(includeOfensiva ? [{
      key: 'ofensiva',
      label: 'Cumprir 3 dias de ofensiva (não precisam ser seguidos)',
      hint: 'Responda a ofensiva diária em três dias diferentes.',
      current: Math.min(ofensivaDays, CHECKLIST_RULES.ofensivaDays),
      target: CHECKLIST_RULES.ofensivaDays,
      to: '/ofensivas',
    }] : []),
  ].map((item) => {
    // A autodeclaração fica gravada junto ao histórico individual do aluno.
    // Ela é usada apenas para a etapa correspondente e não altera outros módulos.
    const selfMarked = progresses.some((progress) => progress.watched
      && progress.lesson_id === `checklist:mod${moduleNumber}:${item.key}`
      && normalizeIdentity(progress.student_email) === studentIdentity);
    const current = selfMarked ? item.target : item.current;
    return { ...item, current, done: current >= item.target, selfMarked };
  });

  return {
    items,
    complete: items.every((item) => item.done),
    doneCount: items.filter((item) => item.done).length,
  };
}

/**
 * Percentual mínimo do checklist exigido para liberar as provas do módulo.
 * A prova só pode ser liberada quando todo o checklist estiver concluído.
 */
export const EXAM_RELEASE_MIN_PERCENT = 100;

/**
 * Resumo do checklist de um módulo para o painel do admin.
 */
export function summarizeChecklistProgress(checklistOrItems) {
  const items = Array.isArray(checklistOrItems)
    ? checklistOrItems
    : (Array.isArray(checklistOrItems?.items) ? checklistOrItems.items : []);
  const total = items.length;
  const completed = items.filter((item) => item?.done).length;
  const missingItems = items.filter((item) => !item?.done);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    total,
    completed,
    missing: total - completed,
    missingItems,
    percent,
    hasData: total > 0,
    eligible: total > 0 && percent >= EXAM_RELEASE_MIN_PERCENT,
  };
}

/**
 * Guarda de liberação: devolve o motivo do bloqueio (ou null quando pode liberar).
 */
export function examReleaseBlockReason(summary) {
  if (!summary || !summary.hasData) return 'Checklist do módulo indisponível para este aluno.';
  if (!summary.eligible) {
    return `Aluno com ${summary.percent}% do checklist — mínimo exigido é ${EXAM_RELEASE_MIN_PERCENT}% (faltam ${summary.missing} atividade(s)).`;
  }
  return null;
}

export function canReleaseExams(summary) {
  return examReleaseBlockReason(summary) === null;
}
