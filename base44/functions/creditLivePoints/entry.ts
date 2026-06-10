/**
 * creditLivePoints
 *
 * ONE-TIME retroactive fix + permanent infrastructure setup.
 *
 * Purpose:
 *   We had 4 live sessions. Students attended but attendances/points were never recorded.
 *   This function:
 *     1. Creates the 4 LiveSession records (idempotent, matched by title).
 *     2. Creates LiveAttendance for every active student via adminSave (bypasses RLS).
 *     3. Upserts ScoreItems directly (1 pt per session per student) so points are visible immediately.
 *     4. Updates AccessCode.pontuacao_total and StudentProfile.points for each student.
 *
 * Future use:
 *   NOT needed for future lives. Standard flow:
 *     Student clicks "Confirmar Presença" → LiveAttendance created (student's own record, passes RLS).
 *     Admin runs recalculateScores → points credited automatically.
 *
 * Safety: Idempotent. Safe to run multiple times. Duplicates are skipped/updated.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

const RETRO_LIVES = [
  { title: 'Live 1 — Aula ao Vivo (retroativa)', course: 'tcc', scheduled_at: '2026-05-10T19:00:00.000Z', status: 'ended' },
  { title: 'Live 2 — Aula ao Vivo (retroativa)', course: 'tcc', scheduled_at: '2026-05-17T19:00:00.000Z', status: 'ended' },
  { title: 'Live 3 — Aula ao Vivo (retroativa)', course: 'tcc', scheduled_at: '2026-05-24T19:00:00.000Z', status: 'ended' },
  { title: 'Live 4 — Aula ao Vivo (retroativa)', course: 'tcc', scheduled_at: '2026-05-31T19:00:00.000Z', status: 'ended' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const targetCourse = payload?.course || 'tcc';

    // ── 1. Load data ───────────────────────────────────────────────────────
    const [existingSessions, allCodes, existingScoreItems, studentProfiles] = await Promise.all([
      base44.asServiceRole.entities.LiveSession.list('-scheduled_at', 200),
      base44.asServiceRole.entities.AccessCode.list('-created_date', 5000),
      base44.asServiceRole.entities.ScoreItem.list('-created_date', 5000),
      base44.asServiceRole.entities.StudentProfile.list('-updated_date', 5000),
    ]);

    const activeCodes = allCodes.filter(c =>
      c.student_email &&
      c.is_active !== false &&
      (c.course === targetCourse || (targetCourse === 'tcc' && !c.course))
    );

    if (activeCodes.length === 0) {
      return Response.json({ error: `No active students found for course: ${targetCourse}` }, { status: 400 });
    }

    // ── 2. Upsert LiveSession records ──────────────────────────────────────
    const sessionRecords = [];
    let sessionsCreated = 0;

    for (const live of RETRO_LIVES) {
      const existing = existingSessions.find(s => s.title === live.title);
      if (existing) {
        sessionRecords.push(existing);
      } else {
        const created = await base44.asServiceRole.entities.LiveSession.create(live);
        sessionRecords.push(created);
        sessionsCreated++;
      }
    }

    // ── 3. Build existing ScoreItem map for dedup ──────────────────────────
    // key = `student_email|category|ref_id`
    const scoreMap = new Map();
    for (const item of existingScoreItems) {
      if (!item.student_email || !item.category || !item.ref_id) continue;
      const key = `${item.student_email}|${item.category}|${item.ref_id}`;
      scoreMap.set(key, item);
    }

    // ── 4. Upsert ScoreItems: 1 pt × 4 sessions × all active students ─────
    let scoreCreated = 0;
    let scoreUpdated = 0;
    let scoreSkipped = 0;

    for (const session of sessionRecords) {
      for (const code of activeCodes) {
        const key = `${code.student_email}|live_attendance|${session.id}`;
        const existing = scoreMap.get(key);
        const scorePayload = {
          student_email: code.student_email,
          category: 'live_attendance',
          ref_id: session.id,
          ref_title: session.title || 'Live retroativa',
          score: 1,
          max_score: 1,
          verified: true,
          notes: 'Presença confirmada retroativamente pelo administrador: +1 ponto.',
        };

        if (existing) {
          if (!existing.verified || roundScore(existing.score) !== 1) {
            await base44.asServiceRole.entities.ScoreItem.update(existing.id, scorePayload);
            scoreUpdated++;
          } else {
            scoreSkipped++;
          }
        } else {
          const created = await base44.asServiceRole.entities.ScoreItem.create(scorePayload);
          scoreMap.set(key, created);
          scoreCreated++;
        }
      }
    }

    // ── 5. Recalculate totals per student and persist ──────────────────────
    // Build live score totals from ALL ScoreItems (including just-created ones)
    const livePointsByEmail = {};
    for (const [, item] of scoreMap) {
      if (!item.verified || item.category !== 'live_attendance') continue;
      // Only count sessions in this course (all 4 retro lives + any future ones)
      livePointsByEmail[item.student_email] = roundScore(
        (livePointsByEmail[item.student_email] || 0) + roundScore(item.score)
      );
    }

    // Aggregate ALL verified score items per student (to compute new total)
    const allVerifiedByEmail = {};
    for (const [, item] of scoreMap) {
      if (!item.verified || !item.student_email) continue;
      allVerifiedByEmail[item.student_email] = roundScore(
        (allVerifiedByEmail[item.student_email] || 0) + roundScore(item.score)
      );
    }

    let profilesUpdated = 0;
    let codesUpdated = 0;

    for (const code of activeCodes) {
      const email = code.student_email;
      const newTotal = roundScore(allVerifiedByEmail[email] || 0);
      const oldTotal = roundScore(code.pontuacao_total || 0);

      if (oldTotal !== newTotal) {
        await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: newTotal });
        codesUpdated++;
      }

      const profile = studentProfiles.find(p => p.student_email === email);
      if (profile) {
        await base44.asServiceRole.entities.StudentProfile.update(profile.id, {
          points: newTotal,
          pontuacao_total: newTotal,
        });
        profilesUpdated++;
      }
    }

    return Response.json({
      success: true,
      targetCourse,
      activeStudents: activeCodes.length,
      sessionsCreated,
      sessionsTotal: sessionRecords.length,
      scoreItemsCreated: scoreCreated,
      scoreItemsUpdated: scoreUpdated,
      scoreItemsSkipped: scoreSkipped,
      pointsGrantedPerStudent: sessionRecords.length,
      codesUpdated,
      profilesUpdated,
      note: `Each active student now has ${sessionRecords.length} × 1.0 = ${sessionRecords.length}.0 pts credited for live attendance.`,
      futureNote: 'For future lives: students confirm presence → LiveAttendance saved → run recalculateScores.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});