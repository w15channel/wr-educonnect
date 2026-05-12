import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function scoreTime(item) {
  return new Date(item.updated_date || item.created_date || 0).getTime();
}

function scoreKey(item) {
  return `${normalizeEmail(item.student_email)}|${item.category}|${item.ref_id}`;
}

async function updateAccessCode(base44, code, total) {
  if (roundScore(code.pontuacao_total) === total) return false;
  await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: total });
  return true;
}

async function updateProfile(base44, profile, total) {
  if (roundScore(profile.pontuacao_total ?? profile.points) === total) return false;
  await base44.asServiceRole.entities.StudentProfile.update(profile.id, { pontuacao_total: total, points: total });
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = payload?.automation?.type === 'scheduled';
    const user = await base44.auth.me().catch(() => null);

    if (!isAutomation && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [scoreItems, accessCodes, profiles] = await Promise.all([
      base44.asServiceRole.entities.ScoreItem.list('-created_date', 50000),
      base44.asServiceRole.entities.AccessCode.list('-created_date', 20000),
      base44.asServiceRole.entities.StudentProfile.list('-updated_date', 20000),
    ]);

    const latestByKey = new Map();
    const duplicateGroups = new Map();

    for (const item of scoreItems) {
      if (!item.verified || !item.student_email || !item.category || !item.ref_id) continue;
      const key = scoreKey(item);
      duplicateGroups.set(key, (duplicateGroups.get(key) || 0) + 1);
      const current = latestByKey.get(key);
      if (!current || scoreTime(item) >= scoreTime(current)) latestByKey.set(key, item);
    }

    const totals = new Map();
    for (const item of latestByKey.values()) {
      const email = normalizeEmail(item.student_email);
      totals.set(email, roundScore((totals.get(email) || 0) + roundScore(item.score)));
    }

    const emails = [...new Set([
      ...accessCodes.map((code) => normalizeEmail(code.student_email)).filter(Boolean),
      ...profiles.map((profile) => normalizeEmail(profile.student_email)).filter(Boolean),
    ])];

    let updatedAccessCodes = 0;
    let updatedProfiles = 0;

    for (const email of emails) {
      const total = totals.get(email) || 0;
      for (const code of accessCodes.filter((item) => normalizeEmail(item.student_email) === email)) {
        if (await updateAccessCode(base44, code, total)) updatedAccessCodes += 1;
      }
      for (const profile of profiles.filter((item) => normalizeEmail(item.student_email) === email)) {
        if (await updateProfile(base44, profile, total)) updatedProfiles += 1;
      }
    }

    const duplicateScoreGroups = [...duplicateGroups.values()].filter((count) => count > 1).length;

    return Response.json({
      success: true,
      auditedStudents: emails.length,
      uniqueScoreItems: latestByKey.size,
      duplicateScoreGroups,
      updatedAccessCodes,
      updatedProfiles,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});