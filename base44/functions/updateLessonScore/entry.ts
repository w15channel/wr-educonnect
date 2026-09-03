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
import { lessonReferenceTitle, parseLessonReference } from '../../shared/lessonReference.ts';
import { lessonScoreNote } from '../../shared/scoreMessages.ts';

const MAX_RANKING_POINTS = 100;

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function capRankingScore(value) {
  return Math.min(roundScore(value), MAX_RANKING_POINTS);
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

    const lessonReference = parseLessonReference(lessonId);
    if (!lessonReference) {
      return Response.json({ error: `Referência de aula inválida: ${lessonId}` }, { status: 400 });
    }

    // ── Load only what we need ───────────────────────────────────────────────
    // Apostila progress stores a composite business key, not a Base44 entity
    // id. Sending that value to RecordedLesson.filter({ id }) makes the SDK
    // reject it before the function can handle a missing lesson.
    const lessonQuery = lessonReference.kind === 'apostila'
      ? base44.asServiceRole.entities.BookChapter.filter({
          book_id: 'apostila-tcc',
          chapter_id: lessonReference.chapterId,
          lesson_id: lessonReference.apostilaLessonId,
        })
      : base44.asServiceRole.entities.RecordedLesson.filter({ id: lessonReference.lessonId });

    const [lessons, codes, existingScores] = await Promise.all([
      lessonQuery,
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
      ref_title: lessonReferenceTitle(lessonReference, lesson),
      score: 2,
      max_score: 2,
      verified: true,
      notes: lessonScoreNote(lessonId),
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
      const verifiedScores = allScores.filter((item) => item.verified);
      const newTotal = capRankingScore(verifiedScores.reduce((sum, item) => sum + roundScore(item.score), 0));
      const newStudyTotal = roundScore(verifiedScores
        .filter((item) => ['lesson', 'task', 'quiz', 'exam'].includes(item.category) && !String(item.ref_id || '').startsWith('therapist_pairing:'))
        .reduce((sum, item) => sum + roundScore(item.score), 0));

      await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: newTotal, pontuacao_estudos: newStudyTotal });

      const profiles = await base44.asServiceRole.entities.StudentProfile.filter({ student_email: studentEmail });
      if (profiles?.[0]) {
        await base44.asServiceRole.entities.StudentProfile.update(profiles[0].id, {
          points: newTotal,
          pontuacao_total: newTotal,
          pontuacao_estudos: newStudyTotal,
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
