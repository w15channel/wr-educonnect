/**
 * updateLessonScore
 *
 * Entity automation handler — fires on LessonProgress create/update.
 *
 * Upserts a single ScoreItem (2 pts) when a student marks a lesson as watched,
 * then updates their AccessCode.pontuacao_total and StudentProfile.points.
 *
 * Lightweight: loads only the records needed for the specific student + lesson.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function normalizePayload(raw) {
  return raw?.data && typeof raw.data === 'object' ? raw.data : raw;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rawPayload = await req.json().catch(() => ({}));
    const payload = normalizePayload(rawPayload);

    // payload.data = the LessonProgress record
    const progress = payload?.data || payload;
    const studentEmail = progress?.student_email;
    const lessonId = progress?.lesson_id;
    const watched = progress?.watched;

    if (!studentEmail || !lessonId) {
      return Response.json({ error: 'Dados inválidos: student_email e lesson_id são obrigatórios.' }, { status: 400 });
    }

    // Only credit points when the lesson is marked as watched
    if (!watched) {
      return Response.json({ success: true, skipped: true, reason: 'Aula ainda não marcada como assistida.' });
    }

    // ── Load only what we need ───────────────────────────────────────────────
    const [lessons, codes, existingScores] = await Promise.all([
      base44.asServiceRole.entities.RecordedLesson.filter({ id: lessonId }),
      base44.asServiceRole.entities.AccessCode.filter({ student_email: studentEmail }),
      base44.asServiceRole.entities.ScoreItem.filter({
        student_email: studentEmail,
        category: 'lesson',
        ref_id: lessonId,
      }),
    ]);

    const lesson = lessons?.[0];
    const code = codes?.[0];

    if (!lesson) {
      return Response.json({ error: `Aula não encontrada: ${lessonId}` }, { status: 400 });
    }

    // ── Upsert ScoreItem ─────────────────────────────────────────────────────
    const scorePayload = {
      student_email: studentEmail,
      category: 'lesson',
      ref_id: lessonId,
      ref_title: lesson.title || 'Aula assistida',
      score: 2,
      max_score: 2,
      verified: true,
      notes: 'Aula assistida por completo: +2 pontos de estudo.',
    };

    let scoreAction = 'skipped';
    const existing = existingScores?.[0];
    if (existing) {
      if (!existing.verified || roundScore(existing.score) !== 2) {
        await base44.asServiceRole.entities.ScoreItem.update(existing.id, scorePayload);
        scoreAction = 'updated';
      }
    } else {
      await base44.asServiceRole.entities.ScoreItem.create(scorePayload);
      scoreAction = 'created';
    }

    // ── Recalculate student total from all verified ScoreItems ───────────────
    if (scoreAction !== 'skipped' && code) {
      const allScores = await base44.asServiceRole.entities.ScoreItem.filter({ student_email: studentEmail });
      const newTotal = roundScore(
        allScores
          .filter((item) => item.verified)
          .reduce((sum, item) => sum + roundScore(item.score), 0)
      );

      await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: newTotal });

      const profiles = await base44.asServiceRole.entities.StudentProfile.filter({ student_email: studentEmail });
      if (profiles?.[0]) {
        await base44.asServiceRole.entities.StudentProfile.update(profiles[0].id, {
          points: newTotal,
          pontuacao_total: newTotal,
        });
      }
    }

    return Response.json({
      success: true,
      student_email: studentEmail,
      lesson_id: lessonId,
      score_action: scoreAction,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});