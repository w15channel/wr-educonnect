/**
 * syncOfensivaScore
 * 
 * Triggered automatically when a DailyChallengeResponse is created or updated.
 * Credits the student's ScoreItem for the ofensiva and updates their pontuacao_total
 * in AccessCode and StudentProfile — so points appear immediately without waiting
 * for manual recalculateScores run.
 */

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

function sameCourse(record, course) {
  return record?.course === course || (course === 'tcc' && !record?.course);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const isAutomation = ['scheduled', 'entity'].includes(body?.automation?.type);
    const user = await base44.auth.me().catch(() => null);
    if (!isAutomation && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the changed DailyChallengeResponse record
    let response = body?.data || null;
    const entityId = body?.event?.entity_id;

    if (!response && entityId) {
      response = await base44.asServiceRole.entities.DailyChallengeResponse.get(entityId).catch(() => null);
    }

    if (!response) {
      return Response.json({ success: true, skipped: true, reason: 'no response data' });
    }

    const { student_email, challenge_id, date, course, points_earned, questions_answered } = response;

    if (!student_email || !challenge_id || !points_earned || points_earned <= 0) {
      return Response.json({ success: true, skipped: true, reason: 'no points to credit' });
    }

    const pts = roundScore(points_earned);
    const refId = `ofensiva:${challenge_id}:${student_email}`;

    // Upsert the ScoreItem for this ofensiva response
    const existingItems = await base44.asServiceRole.entities.ScoreItem.filter(
      { student_email, ref_id: refId },
      '-created_date',
      1
    );

    const scorePayload = {
      student_email,
      category: 'forum',
      ref_id: refId,
      ref_title: `Ofensiva Diária (${date || 'data'})`,
      score: pts,
      max_score: 1.0,
      verified: true,
      notes: `Ofensiva diária — ${questions_answered || 0}/8 perguntas respondidas: +${pts.toFixed(3)} ponto(s).`,
    };

    if (existingItems.length > 0) {
      const existing = existingItems[0];
      if (roundScore(existing.score) !== pts) {
        await base44.asServiceRole.entities.ScoreItem.update(existing.id, scorePayload);
      }
    } else {
      await base44.asServiceRole.entities.ScoreItem.create(scorePayload);
    }

    // Now recalculate the student's total by summing all their verified ScoreItems
    const allStudentScores = await base44.asServiceRole.entities.ScoreItem.filter(
      { student_email },
      '-created_date',
      5000
    );

    // Deduplicate by (category|ref_id) keeping highest verified score
    const seen = new Map();
    for (const s of allStudentScores) {
      if (!s.category || !s.ref_id || !s.verified) continue;
      const key = `${s.category}|${s.ref_id}`;
      const prev = seen.get(key);
      if (!prev || (Number(s.score) || 0) > (Number(prev.score) || 0)) seen.set(key, s);
    }
    const total = capRankingScore([...seen.values()].reduce((sum, s) => roundScore(sum + roundScore(s.score)), 0));

    // Update AccessCode
    const codes = await base44.asServiceRole.entities.AccessCode.filter({ student_email }, '-created_date', 5);
    for (const code of codes) {
      if (roundScore(code.pontuacao_total) !== total) {
        await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: total });
      }
    }

    // Update StudentProfile
    const profiles = await base44.asServiceRole.entities.StudentProfile.filter(
      { student_email },
      '-updated_date',
      5
    );
    const courseName = course || 'tcc';
    const matchingProfile = profiles.find(p => sameCourse(p, courseName));
    const profilePayload = {
      student_email,
      points: total,
      pontuacao_total: total,
      dashboard_course: courseName,
    };
    if (matchingProfile) {
      await base44.asServiceRole.entities.StudentProfile.update(matchingProfile.id, profilePayload);
    } else {
      await base44.asServiceRole.entities.StudentProfile.create(profilePayload);
    }

    return Response.json({
      success: true,
      student_email,
      pts_credited: pts,
      new_total: total,
      ref_id: refId,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});