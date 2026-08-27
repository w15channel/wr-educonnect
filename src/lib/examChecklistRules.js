// Regras do Checklist de liberação da prova do módulo.
// Tudo é calculado por aluno e por módulo — cada aluno avança no seu tempo.

export const CHECKLIST_RULES = {
  lessonsPerModule: 5,
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

/**
 * Monta os 6 requisitos do módulo para um aluno específico.
 * Cada item traz o progresso atual, a meta e o caminho de ida (com volta ao checklist).
 */
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
}) {
  const watchedByLessonId = new Map(progresses.map((p) => [p.lesson_id, p]));

  // 1 — Videoaulas do módulo assistidas e respondidas (resumo ou comentário).
  const moduleLessons = [...lessons]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice((moduleNumber - 1) * CHECKLIST_RULES.lessonsPerModule, moduleNumber * CHECKLIST_RULES.lessonsPerModule);
  const lessonsAnswered = moduleLessons.filter((lesson) => {
    const progress = watchedByLessonId.get(lesson.id);
    return progress?.watched && (progress.summary?.trim() || progress.comment?.trim());
  }).length;

  // 2 — Capítulos da apostila do módulo marcados como lidos.
  const apostilaPrefix = `apostila:mod${moduleNumber}:`;
  const apostilaRead = new Set(
    progresses
      .filter((p) => p.watched && String(p.lesson_id || '').startsWith(apostilaPrefix))
      .map((p) => p.lesson_id)
  ).size;

  // 3 — Tarefas do módulo entregues com no mínimo 500 caracteres de resposta.
  const moduleTasks = tasks.filter((task) => Number(task.module_number) === moduleNumber);
  const tasksDone = moduleTasks.filter((task) => {
    const submission = submissions.find((s) => s.task_id === task.id);
    return submission && submissionTextLength(submission) >= CHECKLIST_RULES.taskMinChars;
  }).length;

  // 4 — Sala de debates: abrir um tema e comentar no tema de um colega.
  const myDebateTopics = debatePosts.filter((post) => post.author_email === email).length;
  const postById = new Map(debatePosts.map((post) => [post.id, post]));
  const myDebateComments = debateReplies.filter((reply) => {
    const parent = postById.get(reply.post_id);
    return reply.author_email === email && parent && parent.author_email !== email;
  }).length;

  // 5 — Atendimento realizado como Terapeuta da Semana.
  const therapistSessions = pairings.filter((p) => p.therapist_email === email && p.therapist_submitted).length;

  // 6 — Pelo menos 3 dias de ofensiva (não precisam ser consecutivos).
  const ofensivaDays = new Set(
    challengeResponses.filter((r) => r.student_email === email).map((r) => r.date)
  ).size;

  const items = [
    {
      key: 'lessons',
      label: 'Assistir e responder todas as videoaulas do módulo',
      hint: 'Marque como assistida e envie o resumo ou comentário de cada aula.',
      current: lessonsAnswered,
      target: moduleLessons.length || CHECKLIST_RULES.lessonsPerModule,
      to: '/lessons',
    },
    {
      key: 'apostila',
      label: 'Marcar os capítulos da apostila do módulo como lidos',
      hint: 'Abra cada capítulo do módulo e use "Marcar como lida".',
      current: apostilaRead,
      target: CHECKLIST_RULES.apostilaChapters,
      to: '/apostila',
    },
    {
      key: 'tasks',
      label: 'Entregar as tarefas do módulo com 500+ caracteres',
      hint: 'Cada resposta precisa de no mínimo 500 caracteres de texto.',
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
      key: 'therapist',
      label: 'Realizar um atendimento como Terapeuta da Semana',
      hint: 'Envie o relato do atendimento realizado.',
      current: Math.min(therapistSessions, 1),
      target: 1,
      to: '/terapeuta',
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