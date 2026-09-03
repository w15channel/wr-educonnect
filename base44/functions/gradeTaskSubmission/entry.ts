/**
 * Entity automation handler for TaskSubmission create/update events.
 *
 * Grades only the submitted task instead of recalculating every student's
 * complete score history, which keeps feedback available even during busy
 * submission periods.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { taskScoreNote } from '../../shared/scoreMessages.ts';

const TASK_POINTS = 5;
const QUIZ_POINTS = 50;

function roundScore(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function eventSubmission(rawPayload: any) {
  const payload = rawPayload?.data && typeof rawPayload.data === 'object' ? rawPayload.data : rawPayload;
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
}

function hasChanged(existing: any, next: Record<string, unknown>) {
  return Object.entries(next).some(([key, value]) => {
    if (key === 'score' || key === 'max_score') return roundScore(existing?.[key]) !== roundScore(value);
    return existing?.[key] !== value;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rawPayload = await req.json().catch(() => ({}));
    const submission = eventSubmission(rawPayload);
    const studentEmail = String(submission?.student_email || '').trim().toLowerCase();
    const taskId = submission?.task_id;

    if (!studentEmail || !taskId || !submission?.id) {
      return Response.json({ error: 'Dados inválidos: entrega, aluno e tarefa são obrigatórios.' }, { status: 400 });
    }

    const [tasks, existingScores] = await Promise.all([
      base44.asServiceRole.entities.Task.filter({ id: taskId }),
      base44.asServiceRole.entities.ScoreItem.filter({
        student_email: studentEmail,
        ref_id: taskId,
      }, '-created_date', 20),
    ]);
    const task = tasks?.[0];
    if (!task) return Response.json({ error: `Tarefa não encontrada: ${taskId}` }, { status: 404 });

    const isQuiz = task.type === 'quiz';
    const points = isQuiz ? QUIZ_POINTS : TASK_POINTS;
    const category = isQuiz ? 'quiz' : 'task';
    const feedback = taskScoreNote(task.id, points, isQuiz);
    const submissionUpdate = { grade: points, feedback, status: 'graded' };
    const scorePayload = {
      student_email: studentEmail,
      category,
      ref_id: task.id,
      ref_title: task.title,
      score: points,
      max_score: points,
      verified: true,
      notes: feedback,
      ...(Number(task.module_number) ? { module_number: Number(task.module_number) } : {}),
    };
    const existing = existingScores?.find((item: any) => item.category === category) || existingScores?.[0];

    if (hasChanged(submission, submissionUpdate)) {
      await base44.asServiceRole.entities.TaskSubmission.update(submission.id, submissionUpdate);
    }
    if (existing) {
      if (hasChanged(existing, scorePayload)) {
        await base44.asServiceRole.entities.ScoreItem.update(existing.id, scorePayload);
      }
    } else {
      await base44.asServiceRole.entities.ScoreItem.create(scorePayload);
    }

    return Response.json({
      success: true,
      student_email: studentEmail,
      task_id: taskId,
      grade: points,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
