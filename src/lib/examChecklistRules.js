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

// ═══════════════════════════════════════════════════════════════════════════
// MENSALIDADES
// Todas as mensalidades não pagas aparecem como pendência no checklist
// de cada módulo. Se o aluno pagou todas, nenhum item de mensalidade aparece.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula o período da mensalidade a partir do due_date.
 * O período vai do dia 05 do mês anterior ao dia 05 do mês de vencimento.
 * Ex: due_date '2026-09-10' → período [05/08, 05/09)
 */
export function tuitionPeriodFromDueDate(dueDateStr) {
  if (!dueDateStr) return null;
  const parts = String(dueDateStr).split('-');
  if (parts.length < 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]); // 1-indexed
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  const periodEnd = new Date(year, month - 1, 5).getTime();
  const periodStart = new Date(year, month - 2, 5).getTime();
  return { start: periodStart, end: periodEnd };
}

/**
 * Encontra a mensalidade cujo período contém a data de liberação do módulo.
 * Retorna null se não houver mensalidade para o período.
 */
export function findTuitionForModule(moduleReleaseDate, tuitions) {
  if (!moduleReleaseDate || !tuitions || tuitions.length === 0) return null;
  const releaseTime = new Date(moduleReleaseDate).getTime();
  if (!Number.isFinite(releaseTime)) return null;
  for (const t of tuitions) {
    const period = tuitionPeriodFromDueDate(t.due_date);
    if (period && releaseTime >= period.start && releaseTime < period.end) {
      return t;
    }
  }
  return null;
}

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
  tuitions = [],
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
    const submission = submissions.find((s) => s.task_id === task.id);
    return !!submission && (submissionTextLength(submission) > 0 || !!submission.file_url);
  }).length;

  // 4 — Sala de debates: abrir um tema e comentar no tema de um colega.
  // Restrito à janela de tempo do módulo, para não herdar participações de módulos anteriores.
  const myDebateTopics = debatePosts.filter((post) => post.author_email === email && isWithinModuleWindow(post.created_date, moduleWindow)).length;
  const postById = new Map(debatePosts.map((post) => [post.id, post]));
  const myDebateComments = debateReplies.filter((reply) => {
    const parent = postById.get(reply.post_id);
    return reply.author_email === email && parent && parent.author_email !== email && isWithinModuleWindow(reply.created_date, moduleWindow);
  }).length;

  // 6 — Pelo menos 3 dias de ofensiva (não precisam ser consecutivos), dentro da janela do módulo.
  const ofensivaDays = new Set(
    challengeResponses.filter((r) => r.student_email === email && isWithinModuleWindow(r.date, moduleWindow)).map((r) => r.date)
  ).size;

  // 7 — Mensalidades voluntárias em aberto.
  // Todas as mensalidades não pagas aparecem como pendência no checklist
  // de cada módulo. Se o aluno pagou todas, nenhum item de mensalidade aparece.
  // O caminho leva à página de mensalidades (tuitions) com retorno ao checklist.
  const unpaidTuitions = (tuitions || []).filter((t) => t.status !== 'paid');
  const tuitionItems = unpaidTuitions.map((t, idx) => ({
    key: `tuition_${idx}`,
    label: `Contribuição Voluntária${t.month_ref ? ` — ${t.month_ref}` : ''}`,
    hint: `O curso tem custos mensais reais (professor, plataforma, tecnologia). O custo de referência é R$ 450 por aluno — mas você escolhe quanto pode colaborar, sem valor mínimo. Hoje, com quanto você poderia contribuir? Vá até a página de Mensalidades para informar seu valor.`,
    current: 0,
    target: 1,
    to: '/tuitions',
  }));

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
    ...tuitionItems,
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
    {
      key: 'ofensiva',
      label: 'Cumprir 3 dias de ofensiva (não precisam ser seguidos)',
      hint: 'Responda a ofensiva diária em três dias diferentes.',
      current: Math.min(ofensivaDays, CHECKLIST_RULES.ofensivaDays),
      target: CHECKLIST_RULES.ofensivaDays,
      to: '/ofensivas',
    },
  ].map((item) => ({ ...item, done: item.current >= item.target }));

  return {
    items,
    complete: items.every((item) => item.done),
    doneCount: items.filter((item) => item.done).length,
  };
}

/**
 * Percentual mínimo do checklist exigido para liberar as provas do módulo.
 * Alunos com 50% ou mais do checklist completo podem ter o próximo módulo liberado.
 */
export const EXAM_RELEASE_MIN_PERCENT = 50;

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