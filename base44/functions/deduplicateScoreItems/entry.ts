/**
 * deduplicateScoreItems
 *
 * Cleans up (student_email, category, ref_id) duplicate ScoreItems.
 * Processes ONE student per call with aggressive but polite deletion.
 *
 * Usage:
 *   { dry_run: true }                    → audit all students, no deletes
 *   { student_email: "foo@bar.com" }     → delete duplicates for one student
 *   { student_email: "foo@bar.com", dry_run: true } → count only
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDuplicatesForStudent(base44, email) {
  const items = await base44.asServiceRole.entities.ScoreItem.filter(
    { student_email: email }, '-created_date', 2000
  );

  const groups = new Map();
  for (const item of items) {
    if (!item.category || !item.ref_id) continue;
    const key = `${item.category}|${item.ref_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const toDelete = [];
  let dupGroups = 0;
  for (const [, members] of groups) {
    if (members.length <= 1) continue;
    dupGroups++;
    members.sort((a, b) => {
      if (a.verified !== b.verified) return b.verified ? 1 : -1;
      if (b.score !== a.score) return (Number(b.score) || 0) - (Number(a.score) || 0);
      const aDate = new Date(a.updated_date || a.created_date || 0).getTime();
      const bDate = new Date(b.updated_date || b.created_date || 0).getTime();
      return bDate - aDate;
    });
    const [, ...dupes] = members;
    for (const d of dupes) toDelete.push(d.id);
  }

  return { totalItems: items.length, duplicateGroups: dupGroups, toDelete };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = ['scheduled', 'entity'].includes(payload?.automation?.type);
    const user = await base44.auth.me().catch(() => null);

    // Auth: native admin, automation, AdminCredential, or AccessCode with admin/management profile
    let isAdmin = isAutomation || user?.role === 'admin';
    if (!isAdmin && payload?.admin_email) {
      const normAdmin = String(payload.admin_email).trim().toLowerCase();
      const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
      isAdmin = credentials.some((c) => String(c.email || '').trim().toLowerCase() === normAdmin);
      if (!isAdmin) {
        const codes = await base44.asServiceRole.entities.AccessCode.filter(
          { student_email: normAdmin }, '-created_date', 10
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

    const dryRun = payload?.dry_run === true;
    const targetEmail = payload?.student_email || null;
    // Max items to delete per call (keep well under timeout)
    const maxDelete = payload?.max_delete || 100;

    // ── Single student mode ─────────────────────────────────────────────────
    if (targetEmail) {
      const { totalItems, duplicateGroups, toDelete } = await getDuplicatesForStudent(base44, targetEmail);

      let deleted = 0;
      let failed = 0;

      if (!dryRun) {
        const batch = toDelete.slice(0, maxDelete);
        // Fire all deletes concurrently in small waves of 5
        const WAVE = 5;
        for (let i = 0; i < batch.length; i += WAVE) {
          const wave = batch.slice(i, i + WAVE);
          const results = await Promise.allSettled(
            wave.map(id => base44.asServiceRole.entities.ScoreItem.delete(id))
          );
          results.forEach(r => r.status === 'fulfilled' ? deleted++ : failed++);
          await sleep(600); // pause between waves
        }
      }

      return Response.json({
        success: true,
        dryRun,
        student_email: targetEmail,
        totalItems,
        duplicateGroups,
        toDeleteTotal: toDelete.length,
        deletedThisRun: dryRun ? 0 : deleted,
        failedThisRun: dryRun ? 0 : failed,
        remaining: dryRun ? toDelete.length : Math.max(0, toDelete.length - deleted),
        note: toDelete.length > maxDelete
          ? `Only processed first ${maxDelete} of ${toDelete.length}. Call again to continue.`
          : 'All duplicates processed.',
      });
    }

    // ── Audit-all mode ──────────────────────────────────────────────────────
    const codes = await base44.asServiceRole.entities.AccessCode.list('-created_date', 5000);
    const studentEmails = [...new Set(codes.map(c => c.student_email).filter(Boolean))];

    const summary = [];
    let totalDuplicateGroups = 0;
    let totalToDelete = 0;

    for (const email of studentEmails) {
      const { totalItems, duplicateGroups, toDelete } = await getDuplicatesForStudent(base44, email);
      totalDuplicateGroups += duplicateGroups;
      totalToDelete += toDelete.length;
      if (duplicateGroups > 0) {
        summary.push({ email, totalItems, duplicateGroups, toDelete: toDelete.length });
      }
    }

    return Response.json({
      success: true,
      dryRun: true,
      note: 'Call with { student_email: "email" } for each affected student to delete duplicates.',
      studentsProcessed: studentEmails.length,
      totalDuplicateGroups,
      totalToDelete,
      affectedStudents: summary.sort((a, b) => b.toDelete - a.toDelete),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
