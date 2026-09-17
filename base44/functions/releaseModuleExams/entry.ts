import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════════════════
// INLINE CHECKLIST LOGIC — mirrors src/lib/examChecklistRules.js
// Aulas da apostila e tarefas são CUMULATIVAS (não filtram por data).
// Debates e ofensivas usam janela de tempo para não herdar de módulos anteriores.
// Mínimo de 50% do checklist para liberar provas.
// Item de mensalidade: bloqueio hard — se incluído e não pago, impede a liberação.
// ═══════════════════════════════════════════════════════════════════════════

const EXAM_RELEASE_MIN_PERCENT = 50;
const APOSTILA_CHAPTERS = 5;
const OFENSIVA_DAYS = 3;

function submissionTextLength(submission: Record<string, unknown>): number {
  if (!submission) return 0;
  const answers = Array.isArray(submission.quiz_answers) ? submission.quiz_answers : [];
  const answersText = answers
    .map((answer: any) => (answer && typeof answer === 'object' ? answer.text || '' : ''))
    .join(' ');
  return `${submission.comment || ''} ${answersText}`.trim().length;
}

function parseModuleNumber(value: unknown): number | null {
  const digits = String(value ?? '').match(/\d+/);
  const parsed = digits ? Number(digits[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function computeChecklistProgress(params: {
  moduleNumber: number;
  email: string;
  progresses: any[];
  tasks: any[];
  submissions: any[];
  debatePosts: any[];
  debateReplies: any[];
  pairings: any[];
  challengeResponses: any[];
  includeTuition: boolean;
  tuitionPaid: boolean;
}) {
  const { moduleNumber, email, progresses, tasks, submissions, debatePosts, debateReplies, challengeResponses, includeTuition, tuitionPaid } = params;

  // Aulas da apostila — CUMULATIVAS (sem filtro de janela de tempo)
  const apostilaPrefix = `apostila:mod${moduleNumber}:`;
  const apostilaRead = new Set(
    progresses
      .filter((p) => p.watched && String(p.lesson_id || '').startsWith(apostilaPrefix))
      .map((p) => p.lesson_id)
  ).size;

  // Tarefas do módulo — CUMULATIVAS (sem filtro de janela de tempo)
  const moduleTasks = tasks.filter((task) => Number(task.module_number) === moduleNumber && task.type !== 'quiz' && !task.is_hidden);
  const tasksDone = moduleTasks.filter((task) => {
    const submission = submissions.find((s) => s.task_id === task.id);
    return !!submission && (submissionTextLength(submission) > 0 || !!submission.file_url);
  }).length;

  // Debates — sem janela de tempo no servidor (não há moduleWindow passado)
  const myDebateTopics = debatePosts.filter((post) => post.author_email === email).length;
  const postById = new Map(debatePosts.map((post) => [post.id, post]));
  const myDebateComments = debateReplies.filter((reply) => {
    const parent = postById.get(reply.post_id);
    return reply.author_email === email && parent && parent.author_email !== email;
  }).length;

  // Ofensivas
  const ofensivaDays = new Set(
    challengeResponses.filter((r) => r.student_email === email).map((r) => r.date)
  ).size;

  const items = [
    ...(moduleNumber > 1 ? [{
      key: 'previous_exam',
      label: `Concluir a prova do Módulo ${moduleNumber - 1}`,
      done: params.pairings.length >= 0, // placeholder — previous exam check is done separately above
    }] : []),
    // Mensalidade: bloqueio hard — se incluída e não paga, impede a liberação.
    ...(includeTuition ? [{
      key: 'tuition',
      label: 'Quitar a mensalidade do curso',
      current: tuitionPaid ? 1 : 0,
      target: 1,
      done: tuitionPaid,
    }] : []),
    {
      key: 'apostila',
      label: 'Marcar os capítulos da apostila do módulo como lidos',
      current: apostilaRead,
      target: APOSTILA_CHAPTERS,
      done: apostilaRead >= APOSTILA_CHAPTERS,
    },
    {
      key: 'tasks',
      label: 'Entregar as tarefas do módulo',
      current: tasksDone,
      target: moduleTasks.length || 5,
      done: tasksDone >= (moduleTasks.length || 5),
    },
    {
      key: 'debate_topic',
      label: 'Abrir um tema na Sala de Debates',
      current: Math.min(myDebateTopics, 1),
      target: 1,
      done: myDebateTopics >= 1,
    },
    {
      key: 'debate_comment',
      label: 'Comentar em um debate já aberto por um colega',
      current: Math.min(myDebateComments, 1),
      target: 1,
      done: myDebateComments >= 1,
    },
    {
      key: 'ofensiva',
      label: 'Cumprir 3 dias de ofensiva (não precisam ser seguidos)',
      current: Math.min(ofensivaDays, OFENSIVA_DAYS),
      target: OFENSIVA_DAYS,
      done: ofensivaDays >= OFENSIVA_DAYS,
    },
  ];

  // Remove previous_exam from the count since it's checked separately above
  const checkableItems = items.filter((item) => item.key !== 'previous_exam');
  const total = checkableItems.length;
  const completed = checkableItems.filter((item) => item.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const missing = total - completed;
  const missingItems = checkableItems.filter((item) => !item.done);

  return {
    items: checkableItems,
    total,
    completed,
    missing,
    missingItems,
    percent,
    hasData: total > 0,
    eligible: total > 0 && percent >= EXAM_RELEASE_MIN_PERCENT,
  };
}

function examReleaseBlockReason(progress: any): string | null {
  if (!progress || !progress.hasData) return 'Checklist do módulo indisponível para este aluno.';
  if (!progress.eligible) {
    return `Aluno com ${progress.percent}% do checklist — mínimo exigido é ${EXAM_RELEASE_MIN_PERCENT}% (faltam ${progress.missing} atividade(s)).`;
  }
  return null;
}

/**
 * releaseModuleExams
 * ──────────────────
 * Libera (ou revoga) as provas do módulo em vigência de um aluno.
 *
 * Segurança: executa para e-mails cadastrados em AdminCredential ou em
 * AccessCode com profile_category admin/management — o mesmo critério
 * usado pelo adminSave, porque o app usa autenticação customizada.
 * O percentual do checklist é recalculado aqui no servidor; números vindos do
 * navegador não são aceitos como prova de elegibilidade.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { admin_email, student_email, student_name, module_number, course = 'tcc', action = 'release' } = payload || {};

    if (!admin_email) {
      return Response.json({ error: 'admin_email obrigatório.' }, { status: 403 });
    }
    const normAdmin = String(admin_email).trim().toLowerCase();
    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
    let isValidAdmin = credentials.some((c: Record<string, unknown>) => String(c.email || '').trim().toLowerCase() === normAdmin);
    // Fallback: verifica AccessCode com profile_category admin/management (mesmo critério do adminSave)
    if (!isValidAdmin) {
      const codes = await base44.asServiceRole.entities.AccessCode.filter(
        { student_email: normAdmin }, '-created_date', 10
      );
      isValidAdmin = codes.some((c: Record<string, unknown>) =>
        c.is_active !== false &&
        ['admin', 'management'].includes(c.profile_category)
      );
    }
    if (!isValidAdmin) {
      return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const email = String(student_email || '').trim().toLowerCase();
    const moduleNumber = Number(module_number);
    if (!email || !Number.isFinite(moduleNumber) || moduleNumber < 1 || moduleNumber > 10) {
      return Response.json({ error: 'student_email e module_number (1–10) são obrigatórios.' }, { status: 400 });
    }
    if (action !== 'release' && action !== 'revoke') {
      return Response.json({ error: `Ação '${action}' não suportada.` }, { status: 400 });
    }

    const store = base44.asServiceRole.entities;
    const existing = (await store.ExamRelease.filter({ student_email: email, module_number: moduleNumber }, '-released_at', 5))[0] || null;

    if (action === 'revoke') {
      if (!existing) {
        return Response.json({ error: 'Não há liberação registrada para este módulo.' }, { status: 404 });
      }
      await store.ExamRelease.delete(existing.id);
      return Response.json({ success: true, released: false });
    }

    const [lessons, progresses, tasks, submissions, allPosts, allReplies, pairings, challengeResponses, courseExams, studentExamSubs, tuitions] = await Promise.all([
      store.RecordedLesson.filter({ course }, 'order', 300),
      store.LessonProgress.filter({ student_email: email }, '-created_date', 2000),
      store.Task.filter({ course }, '-created_date', 300),
      store.TaskSubmission.filter({ student_email: email }, '-created_date', 1000),
      store.ForumPost.filter({ course }, '-created_date', 1000),
      store.ForumReply.list('-created_date', 2000),
      store.TherapistPairing.list('-pairing_date', 1000),
      store.DailyChallengeResponse.filter({ student_email: email, course }, '-date', 500),
      store.Exam.filter({ course }, '-created_date', 500),
      store.ExamSubmission.filter({ student_email: email }, '-submitted_at', 500),
      store.Tuition.filter({ student_email: email }, '-month_ref', 50),
    ]);

    // Verifica se o aluno já quitou a mensalidade (pelo menos um registro "paid").
    const tuitionPaid = (tuitions || []).some((t: Record<string, unknown>) => t.status === 'paid');

    // Determina em qual módulo o item de mensalidade deve aparecer:
    //   • Se o aluno ainda não concluiu o Módulo 1 → item no Módulo 1
    //   • Se já concluiu o Módulo 1 → item no módulo atual (2+)
    const submittedExamIds = new Set(studentExamSubs.map((s: Record<string, unknown>) => s.exam_id));
    const module1Exams = courseExams.filter((exam: Record<string, unknown>) => parseModuleNumber(exam.module_ref) === 1);
    const module1ExamDone = module1Exams.length === 0 ? true : module1Exams.every((exam: Record<string, unknown>) => submittedExamIds.has(exam.id));

    // Pré-requisito: para módulos 2+, a prova do módulo anterior deve ter sido entregue.
    // O aluno não pode dar sequência ao checklist do módulo seguinte sem concluir a prova do módulo anterior.
    if (moduleNumber > 1) {
      const previousModuleExams = courseExams.filter((exam: Record<string, unknown>) => {
        const match = String(exam.module_ref || '').match(/(\d+)/);
        return match && Number(match[1]) === moduleNumber - 1;
      });
      if (previousModuleExams.length > 0) {
        const previousExamCompleted = previousModuleExams.every((exam: Record<string, unknown>) => submittedExamIds.has(exam.id));
        if (!previousExamCompleted) {
          return Response.json({
            error: `Aluno não concluiu a prova do Módulo ${moduleNumber - 1} — pré-requisito para liberar as provas do Módulo ${moduleNumber}.`,
            progress: {
              items: [{ key: 'previous_exam', done: false, label: `Concluir a prova do Módulo ${moduleNumber - 1}` }],
              total: 1,
              completed: 0,
              missing: 1,
              percent: 0,
              hasData: true,
              eligible: false,
            },
          }, { status: 409 });
        }
      }
    }

    // Determina o módulo atual do aluno para saber se a mensalidade deve ser
    // incluída no checklist deste módulo.
    const currentModuleEstimate = module1ExamDone ? Math.max(2, moduleNumber) : 1;
    const includeTuition = moduleNumber === currentModuleEstimate;

    // Bloqueio hard de mensalidade: se o item está incluído e não foi pago,
    // impede a liberação independentemente do percentual do checklist.
    if (includeTuition && !tuitionPaid) {
      return Response.json({
        error: 'Aluno com mensalidade pendente — regularize o pagamento para liberar as provas.',
        progress: {
          items: [{ key: 'tuition', done: false, label: 'Quitar a mensalidade do curso' }],
          total: 1,
          completed: 0,
          missing: 1,
          percent: 0,
          hasData: true,
          eligible: false,
        },
      }, { status: 409 });
    }

    const progress = computeChecklistProgress({
      moduleNumber,
      email,
      progresses,
      tasks,
      submissions,
      debatePosts: (allPosts || []).filter((p: Record<string, unknown>) => p.space !== 'forum'),
      debateReplies: (allReplies || []).filter((r: Record<string, unknown>) => r.space !== 'forum'),
      pairings,
      challengeResponses,
      includeTuition,
      tuitionPaid,
    });

    const blockReason = examReleaseBlockReason(progress);
    if (blockReason) {
      return Response.json({ error: blockReason, progress }, { status: 409 });
    }

    const data = {
      student_email: email,
      student_name: student_name || email,
      course,
      module_number: moduleNumber,
      percent_at_release: progress.percent,
      completed_activities: progress.completed,
      total_activities: progress.total,
      released_at: new Date().toISOString(),
      released_by: normAdmin,
    };
    const record = existing
      ? await store.ExamRelease.update(existing.id, data)
      : await store.ExamRelease.create(data);

    return Response.json({ success: true, released: true, record, progress });
  } catch (error) {
    return Response.json({ error: (error as Error)?.message || 'Erro ao liberar as provas.' }, { status: 500 });
  }
});