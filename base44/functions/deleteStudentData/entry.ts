import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Removes ALL data belonging to a student across every entity — no traces left.
// Admin-only. Identifies the student by their access-code id (primary) and email.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const user = await base44.auth.me().catch(() => null);

    // Auth: native admin, AdminCredential, or AccessCode with admin/management profile
    const adminEmail = payload?.admin_email || user?.email;
    let isAdmin = user?.role === 'admin';
    if (!isAdmin && adminEmail) {
      const creds = await base44.asServiceRole.entities.AdminCredential.filter({ email: adminEmail }, '-created_date', 1).catch(() => []);
      isAdmin = creds.length > 0;
      // Fallback: verifica AccessCode com profile_category admin/management (mesmo critério do adminSave)
      if (!isAdmin) {
        const normAdminEmail = String(adminEmail).trim().toLowerCase();
        const codes = await base44.asServiceRole.entities.AccessCode.filter(
          { student_email: normAdminEmail }, '-created_date', 10
        );
        isAdmin = codes.some((c) =>
          c.is_active !== false &&
          ['admin', 'management'].includes(c.profile_category)
        );
      }
    }
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const codeId = payload?.code_id;
    if (!codeId) return Response.json({ error: 'code_id is required' }, { status: 400 });

    const code = await base44.asServiceRole.entities.AccessCode.get(codeId).catch(() => null);
    if (!code) return Response.json({ error: 'Access code not found' }, { status: 404 });

    const email = code.student_email || '';
    const deleted = {};

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const deleteWhere = async (entityName, query) => {
      let count = 0;
      // Keep re-fetching from the start until the query returns nothing. Deletes
      // may fail silently on rate limits, so we loop until the list is truly
      // empty rather than trusting a single pass. Guard against infinite loops.
      let safety = 0;
      while (safety < 200) {
        safety++;
        const rows = await base44.asServiceRole.entities[entityName].filter(query, '-created_date', 100).catch(() => []);
        if (!rows || rows.length === 0) break;
        let deletedThisPass = 0;
        for (const row of rows) {
          try {
            await base44.asServiceRole.entities[entityName].delete(row.id);
            count++;
            deletedThisPass++;
          } catch {
            // rate-limited or transient — brief pause, next pass will retry
            await sleep(200);
          }
          await sleep(40);
        }
        // If a whole pass deleted nothing, the remaining rows are stuck — stop.
        if (deletedThisPass === 0) break;
      }
      if (count > 0) deleted[entityName] = (deleted[entityName] || 0) + count;
    };

    // ── STEP 1: remove ALL access codes FIRST ────────────────────────────────
    // Any sync/recalculate automation only recreates ScoreItem/StudentProfile for
    // students that still have an AccessCode. Deleting the codes first guarantees
    // nothing gets regenerated while we clean up the rest.
    if (email) {
      await deleteWhere('AccessCode', { student_email: email });
    }
    await base44.asServiceRole.entities.AccessCode.delete(codeId).catch(() => null);

    // ── STEP 2: purge everything else keyed by the student ───────────────────
    if (email) {
      await deleteWhere('ScoreItem', { student_email: email });
      await deleteWhere('StudentProfile', { student_email: email });
      await deleteWhere('LessonProgress', { student_email: email });
      await deleteWhere('TaskSubmission', { student_email: email });
      await deleteWhere('ExamSubmission', { student_email: email });
      await deleteWhere('LiveAttendance', { student_email: email });
      await deleteWhere('CalendarEvent', { student_email: email });
      await deleteWhere('Tuition', { student_email: email });
      await deleteWhere('DailyChallengeResponse', { student_email: email });
      await deleteWhere('MonitorHistory', { student_email: email });
      await deleteWhere('CertificateRecord', { student_email: email });

      // Author-keyed entities
      await deleteWhere('ForumPost', { author_email: email });
      await deleteWhere('ForumReply', { author_email: email });
      await deleteWhere('ChatMessage', { author_email: email });

      // Therapist pairings (either role)
      await deleteWhere('TherapistPairing', { therapist_email: email });
      await deleteWhere('TherapistPairing', { patient_email: email });
    }

    return Response.json({ success: true, email, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
