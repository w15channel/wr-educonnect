import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Removes ALL data belonging to a student across every entity — no traces left.
// Admin-only. Identifies the student by their access-code id (primary) and email.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const user = await base44.auth.me().catch(() => null);

    // Auth: native admin OR custom admin (AdminCredential)
    const adminEmail = payload?.admin_email || user?.email;
    let isAdmin = user?.role === 'admin';
    if (!isAdmin && adminEmail) {
      const creds = await base44.asServiceRole.entities.AdminCredential.filter({ email: adminEmail }, '-created_date', 1).catch(() => []);
      isAdmin = creds.length > 0;
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

    const deleteWhere = async (entityName, query) => {
      let count = 0;
      let skip = 0;
      while (true) {
        const rows = await base44.asServiceRole.entities[entityName].filter(query, '-created_date', 200, skip).catch(() => []);
        if (!rows || rows.length === 0) break;
        for (const row of rows) {
          await base44.asServiceRole.entities[entityName].delete(row.id).catch(() => null);
          count++;
        }
        if (rows.length < 200) break;
      }
      if (count > 0) deleted[entityName] = (deleted[entityName] || 0) + count;
    };

    if (email) {
      // Entities keyed by student_email
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

    // Finally, all access codes for this student (across courses) + this one
    if (email) {
      await deleteWhere('AccessCode', { student_email: email });
    } else {
      await base44.asServiceRole.entities.AccessCode.delete(codeId).catch(() => null);
      deleted.AccessCode = (deleted.AccessCode || 0) + 1;
    }

    return Response.json({ success: true, email, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});