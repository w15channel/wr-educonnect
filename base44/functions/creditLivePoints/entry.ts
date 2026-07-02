/**
 * creditLivePoints
 *
 * Entity automation handler — fires on LiveAttendance create/update.
 *
 * Upserts a single ScoreItem (1 pt) for the student + session in the event,
 * then updates their AccessCode.pontuacao_total and StudentProfile.points.
 *
 * Designed to be lightweight: loads only the records it needs so many
 * simultaneous attendances don't rate-limit each other.
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

    // ── Entity automation payload ────────────────────────────────────────────
    // payload.data = the LiveAttendance record
    // payload.event = { type: 'create'|'update', entity_name, entity_id }
    const attendance = payload?.data || payload;
    const studentEmail = attendance?.student_email;
    const sessionId = attendance?.session_id;

    if (!studentEmail || !sessionId) {
      return Response.json({ error: 'Dados inválidos: student_email e session_id são obrigatórios.' }, { status: 400 });
    }

    // ── Load only what we need ───────────────────────────────────────────────
    const [sessions, codes, existingScores] = await Promise.all([
      base44.asServiceRole.entities.LiveSession.filter({ id: sessionId }),
      base44.asServiceRole.entities.AccessCode.filter({ student_email: studentEmail }),
      base44.asServiceRole.entities.ScoreItem.filter({
        student_email: studentEmail,
        category: 'live_attendance',
        ref_id: sessionId,
      }),
    ]);

    const session = sessions?.[0];
    const code = codes?.[0];

    if (!session) {
      return Response.json({ error: `LiveSession não encontrada: ${sessionId}` }, { status: 400 });
    }

    // ── Upsert ScoreItem ─────────────────────────────────────────────────────
    const scorePayload = {
      student_email: studentEmail,
      category: 'live_attendance',
      ref_id: sessionId,
      ref_title: session.title || 'Presença em live',
      score: 1,
      max_score: 1,
      verified: true,
      notes: 'Presença confirmada em live: +1 ponto.',
    };

    let scoreAction = 'skipped';
    const existing = existingScores?.[0];
    if (existing) {
      if (!existing.verified || roundScore(existing.score) !== 1) {
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
      session_id: sessionId,
      score_action: scoreAction,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});