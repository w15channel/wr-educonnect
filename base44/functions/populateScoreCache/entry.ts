import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MAX_RANKING_POINTS = 100;

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function capRankingScore(value) {
  return Math.min(roundScore(value), MAX_RANKING_POINTS);
}

function addRounded(total, value) {
  return roundScore(roundScore(total) + roundScore(value));
}

function isStudyItem(item) {
  return ['lesson', 'task', 'quiz', 'exam'].includes(item?.category) && !String(item?.ref_id || '').startsWith('therapist_pairing:');
}

function rankingScore(item) {
  // Lives deixaram de gerar pontuação; registros legados são mantidos como evidência, mas valem 0 no cache.
  if (item?.category === 'live_attendance') return 0;
  return item?.score;
}

async function updateStudentCache(base44, email, total, studyTotal, profiles, accessCodes, users) {
  const pontuacaoTotal = capRankingScore(total);
  const pontuacaoEstudos = roundScore(studyTotal);
  const profileMatches = profiles.filter((profile) => profile.student_email === email);
  for (const profile of profileMatches) {
    await base44.asServiceRole.entities.StudentProfile.update(profile.id, {
      pontuacao_total: pontuacaoTotal,
      pontuacao_estudos: pontuacaoEstudos,
      points: pontuacaoTotal,
    });
  }

  const codeMatches = accessCodes.filter((code) => code.student_email === email);
  for (const code of codeMatches) {
    await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: pontuacaoTotal, pontuacao_estudos: pontuacaoEstudos });
  }

  for (const user of users.filter((item) => item.email === email)) {
    await base44.asServiceRole.entities.User.update(user.id, { pontuacao_total: pontuacaoTotal, pontuacao_estudos: pontuacaoEstudos });
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
        ? []
        : [],
    ]);

    // Deduplicate ScoreItems in-memory before summing to prevent inflated totals
    const deduped = new Map(); // key → best item
    for (const item of scoreItems) {
      if (!item.student_email || !item.category || !item.ref_id) continue;
      const key = `${item.student_email}|${item.category}|${item.ref_id}`;
      const prev = deduped.get(key);
      if (!prev) { deduped.set(key, item); continue; }
      // keep verified > higher score > more recent
      const prevWins =
        (prev.verified && !item.verified) ||
        (prev.verified === item.verified && (Number(prev.score) || 0) >= (Number(item.score) || 0));
      if (!prevWins) deduped.set(key, item);
    }

    const totals = new Map();
    const studyTotals = new Map();
    for (const item of deduped.values()) {
      if (!item.verified || !item.student_email) continue;
      totals.set(item.student_email, addRounded(totals.get(item.student_email) || 0, rankingScore(item)));
      if (isStudyItem(item)) {
        studyTotals.set(item.student_email, addRounded(studyTotals.get(item.student_email) || 0, item.score));
      }
    }

    const emails = targetEmail
      ? [targetEmail]
      : [...new Set([
          ...accessCodes.map((code) => code.student_email).filter(Boolean),
          ...profiles.map((profile) => profile.student_email).filter(Boolean),
          ...users.map((user) => user.email).filter(Boolean),
        ])];

    for (const email of emails) {
      await updateStudentCache(base44, email, totals.get(email) || 0, studyTotals.get(email) || 0, profiles, accessCodes, users);
    }

    return Response.json({ success: true, updatedStudents: emails.length, student_email: targetEmail, totals: Object.fromEntries(totals), studyTotals: Object.fromEntries(studyTotals) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});