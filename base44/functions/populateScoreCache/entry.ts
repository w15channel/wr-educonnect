import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function addRounded(total, value) {
  return roundScore(roundScore(total) + roundScore(value));
}

async function updateStudentCache(base44, email, total, profiles, accessCodes, users) {
  const pontuacaoTotal = roundScore(total);
  const profileMatches = profiles.filter((profile) => profile.student_email === email);
  for (const profile of profileMatches) {
    await base44.asServiceRole.entities.StudentProfile.update(profile.id, {
      pontuacao_total: pontuacaoTotal,
      points: pontuacaoTotal,
    });
  }

  const codeMatches = accessCodes.filter((code) => code.student_email === email);
  for (const code of codeMatches) {
    await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: pontuacaoTotal });
  }

  for (const user of users.filter((item) => item.email === email)) {
    await base44.asServiceRole.entities.User.update(user.id, { pontuacao_total: pontuacaoTotal });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = payload?.automation?.type === 'scheduled';
    const currentUser = await base44.auth.me().catch(() => null);

    const targetEmail = payload?.student_email || payload?.email || null;

    if (!isAutomation && currentUser?.role !== 'admin' && (!targetEmail || targetEmail !== currentUser?.email)) {
      return Response.json({ error: 'Forbidden: only admins or the owner student can update this cache' }, { status: 403 });
    }

    const [scoreItems, accessCodes, profiles, users] = await Promise.all([
      targetEmail
        ? base44.asServiceRole.entities.ScoreItem.filter({ student_email: targetEmail }, '-created_date', 20000)
        : base44.asServiceRole.entities.ScoreItem.list('-created_date', 50000),
      targetEmail
        ? base44.asServiceRole.entities.AccessCode.filter({ student_email: targetEmail }, '-created_date', 1000)
        : base44.asServiceRole.entities.AccessCode.list('-created_date', 20000),
      targetEmail
        ? base44.asServiceRole.entities.StudentProfile.filter({ student_email: targetEmail }, '-updated_date', 1000)
        : base44.asServiceRole.entities.StudentProfile.list('-updated_date', 20000),
      targetEmail
        ? base44.asServiceRole.entities.User.filter({ email: targetEmail }, '-created_date', 1000).catch(() => [])
        : base44.asServiceRole.entities.User.list('-created_date', 20000).catch(() => []),
    ]);

    const totals = new Map();
    for (const item of scoreItems) {
      if (!item.verified || !item.student_email) continue;
      totals.set(item.student_email, addRounded(totals.get(item.student_email) || 0, item.score));
    }

    const emails = targetEmail
      ? [targetEmail]
      : [...new Set([
          ...accessCodes.map((code) => code.student_email).filter(Boolean),
          ...profiles.map((profile) => profile.student_email).filter(Boolean),
          ...users.map((user) => user.email).filter(Boolean),
        ])];

    for (const email of emails) {
      await updateStudentCache(base44, email, totals.get(email) || 0, profiles, accessCodes, users);
    }

    return Response.json({ success: true, updatedStudents: emails.length, student_email: targetEmail, totals: Object.fromEntries(totals) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
