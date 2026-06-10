/**
 * creditLivePoints
 *
 * ONE-TIME retroactive fix + permanent infrastructure setup.
 *
 * Purpose:
 *   We had 4 live sessions whose attendances were never recorded in the database.
 *   This function:
 *     1. Creates the 4 LiveSession records (skips if already exist, matched by title).
 *     2. Creates LiveAttendance for EVERY active student in each session (idempotent).
 *     3. Calls recalculateScores so each student receives 4 × 1.0 = 4.0 pts.
 *
 * Future use:
 *   This function is NOT needed for future lives. The standard flow is:
 *     - Student clicks "Confirmar Presença" in the live session page → LiveAttendance created.
 *     - Admin runs recalculateScores (or the scheduled automation does it) → points credited.
 *
 * Safety:
 *   - Idempotent: safe to run multiple times. Duplicate attendances are skipped.
 *   - Admin-only.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

// The 4 retroactive live sessions to credit.
// Adjust titles/dates to match what actually happened.
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
    // Allow caller to override which course gets credited (default: tcc)
    const targetCourse = payload?.course || 'tcc';

    // ── 1. Load existing LiveSessions and AccessCodes ──────────────────────
    const [existingSessions, allCodes] = await Promise.all([
      base44.asServiceRole.entities.LiveSession.list('-scheduled_at', 200),
      base44.asServiceRole.entities.AccessCode.list('-created_date', 5000),
    ]);

    const activeCodes = allCodes.filter(c =>
      c.student_email &&
      c.is_active !== false &&
      (c.course === targetCourse || (targetCourse === 'tcc' && !c.course))
    );

    if (activeCodes.length === 0) {
      return Response.json({ error: `No active students found for course: ${targetCourse}` }, { status: 400 });
    }

    // ── 2. Upsert the 4 retroactive LiveSession records ───────────────────
    const sessionIds = [];
    let sessionsCreated = 0;

    for (const live of RETRO_LIVES) {
      const existing = existingSessions.find(s => s.title === live.title);
      if (existing) {
        sessionIds.push(existing.id);
      } else {
        const created = await base44.asServiceRole.entities.LiveSession.create(live);
        sessionIds.push(created.id);
        sessionsCreated++;
      }
    }

    // ── 3. Load existing attendances to avoid duplicates ──────────────────
    const existingAttendances = await base44.asServiceRole.entities.LiveAttendance.list('-created_date', 10000);
    const attendanceKeys = new Set(
      existingAttendances.map(a => `${a.session_id}|${a.student_email}`)
    );

    // ── 4. Create attendances for all active students × 4 sessions ────────
    let attendancesCreated = 0;
    let attendancesSkipped = 0;
    const now = new Date().toISOString();

    for (const sessionId of sessionIds) {
      for (const code of activeCodes) {
        const key = `${sessionId}|${code.student_email}`;
        if (attendanceKeys.has(key)) {
          attendancesSkipped++;
          continue;
        }
        const sessionMeta = RETRO_LIVES[sessionIds.indexOf(sessionId)];
        await base44.asServiceRole.entities.LiveAttendance.create({
          session_id: sessionId,
          session_title: sessionMeta?.title || 'Live retroativa',
          student_email: code.student_email,
          student_name: code.profile_name || code.student_name || code.student_email,
          confirmed_at: now,
        });
        attendanceKeys.add(key);
        attendancesCreated++;
      }
    }

    // ── 5. Trigger recalculateScores to propagate points ──────────────────
    const recalcResult = await base44.functions.invoke('recalculateScores', {});

    return Response.json({
      success: true,
      targetCourse,
      activeStudents: activeCodes.length,
      sessionsCreated,
      sessionsTotal: sessionIds.length,
      attendancesCreated,
      attendancesSkipped,
      pointsPerStudent: sessionIds.length, // 1 pt × N sessions
      recalcResult: recalcResult?.data || recalcResult,
      note: `Each student received ${sessionIds.length} × 1.0 = ${sessionIds.length}.0 pts for live attendance.`,
      futureNote: 'For future lives: students confirm presence in the live page → LiveAttendance created automatically → run recalculateScores to credit points.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});