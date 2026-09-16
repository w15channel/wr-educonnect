import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { computeChecklistProgress, examReleaseBlockReason } from '../../shared/examChecklistProgress.ts';

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

    const [lessons, progresses, tasks, submissions, allPosts, allReplies, pairings, challengeResponses, courseExams, studentExamSubs] = await Promise.all([
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
    ]);

    // Pré-requisito: para módulos 2+, a prova do módulo anterior deve ter sido entregue.
    // O aluno não pode dar sequência ao checklist do módulo seguinte sem concluir a prova do módulo anterior.
    if (moduleNumber > 1) {
      const previousModuleExams = courseExams.filter((exam: Record<string, unknown>) => {
        const match = String(exam.module_ref || '').match(/(\d+)/);
        return match && Number(match[1]) === moduleNumber - 1;
      });
      if (previousModuleExams.length > 0) {
        const submittedExamIds = new Set(studentExamSubs.map((s: Record<string, unknown>) => s.exam_id));
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

    const progress = computeChecklistProgress({
      moduleNumber,
      email,
      lessons,
      progresses,
      tasks,
      submissions,
      debatePosts: (allPosts || []).filter((p: Record<string, unknown>) => p.space !== 'forum'),
      debateReplies: (allReplies || []).filter((r: Record<string, unknown>) => r.space !== 'forum'),
      pairings,
      challengeResponses,
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
